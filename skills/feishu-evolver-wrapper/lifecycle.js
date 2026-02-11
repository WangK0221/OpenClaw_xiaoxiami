#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger'); // New logger

const WRAPPER_INDEX = path.join(__dirname, 'index.js');
const PID_FILE = path.resolve(__dirname, '../../memory/evolver_wrapper.pid');
const LEGACY_PID_FILE = path.resolve(__dirname, '../../memory/evolver_loop.pid'); // Deprecated but checked for cleanup
const DAEMON_PID_FILE = path.resolve(__dirname, '../../memory/evolver_daemon.pid');

const HEALTH_CHECK_SCRIPT = path.resolve(__dirname, '../../evolver/src/ops/health_check.js');
let runHealthCheck;
try {
    runHealthCheck = require(HEALTH_CHECK_SCRIPT).runHealthCheck;
} catch (e) {
    runHealthCheck = () => ({ status: 'unknown', error: e.message });
}

// INNOVATION: Internal Daemon Loop (Self-Healing Watchdog 2.0)
function startDaemon() {
    if (fs.existsSync(DAEMON_PID_FILE)) {
        try {
            const pid = fs.readFileSync(DAEMON_PID_FILE, 'utf8').trim();
            process.kill(pid, 0);
            // Daemon already running
            return;
        } catch(e) {
            // Stale PID, remove it
            try { fs.unlinkSync(DAEMON_PID_FILE); } catch(err) {}
        }
    }

    const out = fs.openSync(path.resolve(__dirname, '../../logs/daemon_out.log'), 'a');
    const err = fs.openSync(path.resolve(__dirname, '../../logs/daemon_err.log'), 'a');

    const child = spawn(process.execPath, [__filename, 'daemon-loop'], {
        detached: true,
        stdio: ['ignore', out, err],
        cwd: __dirname
    });
    
    fs.writeFileSync(DAEMON_PID_FILE, String(child.pid));
    child.unref();
    console.log(`[Daemon] Started internal watchdog daemon (PID ${child.pid})`);
}

function daemonLoop() {
    console.log(`[Daemon] Loop started at ${new Date().toISOString()}`);
    
    // Heartbeat loop
    setInterval(() => {
        try {
            // Run ensure logic internally in a fresh process
            const res = require('child_process').spawnSync(process.execPath, [__filename, 'ensure', '--json', '--daemon-check'], {
                encoding: 'utf8'
            });
            if (res.error) console.error('[Daemon] Ensure failed:', res.error);
            
            // Log heartbeat
            fs.writeFileSync(path.resolve(__dirname, '../../memory/daemon_heartbeat.txt'), new Date().toISOString());
        } catch(e) {
            console.error('[Daemon] Loop error:', e);
        }
    }, 60000); // Check every 1 minute
}

// Unified watchdog: managed via OpenClaw Cron (job: evolver_watchdog_robust)
function ensureWatchdog() {
  // INNOVATION: Auto-detect 'openclaw' CLI path to fix PATH issues in execSync
  let openclawCli = 'openclaw';
  const possiblePaths = [
    '/home/crishaocredits/.npm-global/bin/openclaw',
    '/usr/local/bin/openclaw',
    '/usr/bin/openclaw'
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      openclawCli = p;
      break;
    }
  }

  try {
    // Check if the cron job exists via OpenClaw CLI
    // Optimization: Check a local state file first to avoid expensive CLI calls every time
    const cronStateFile = path.resolve(__dirname, '../../memory/evolver_cron_state.json');
    let skipCheck = false;
    if (fs.existsSync(cronStateFile)) {
        try {
            const state = JSON.parse(fs.readFileSync(cronStateFile, 'utf8'));
            // If checked within last hour, skip expensive list
            if (Date.now() - state.lastChecked < 3600000 && state.exists) {
                skipCheck = true;
            }
        } catch (e) {}
    }

    if (!skipCheck) {
        // Use --all to include disabled jobs, --json for parsing
        // Use absolute path for reliability
        const listOut = execSync(`${openclawCli} cron list --all --json`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        let jobs = [];
        try {
            const parsed = JSON.parse(listOut);
            jobs = parsed.jobs || [];
        } catch (parseErr) {
            console.warn('[Lifecycle] Failed to parse cron list output:', parseErr.message);
            // Fallback: check raw string for job name as a heuristic
            if (listOut.includes('evolver_watchdog_robust')) {
                // Update state blindly
                fs.writeFileSync(cronStateFile, JSON.stringify({ lastChecked: Date.now(), exists: true }));
                return; 
            }
        }
        const exists = jobs.find(j => j.name === 'evolver_watchdog_robust');

        if (!exists) {
          console.log('[Lifecycle] Creating missing cron job: evolver_watchdog_robust...');
          // Use array for safe argument passing to avoid shell injection
          // Note: using execSync with string command, so we must be careful with quotes.
          // Using openclawCli variable here too.
          const cmdStr = `${openclawCli} cron add --name "evolver_watchdog_robust" --every "10m" --session "isolated" --message "exec: node skills/feishu-evolver-wrapper/lifecycle.js ensure" --announce --json`;
          
          execSync(cmdStr);
          console.log('[Lifecycle] Watchdog cron job created successfully.');
          fs.writeFileSync(cronStateFile, JSON.stringify({ lastChecked: Date.now(), exists: true }));
        } else {
          // If disabled, enable it
          if (exists.enabled === false) {
             console.log(`[Lifecycle] Enabling disabled watchdog job (ID: ${exists.id})...`);
             execSync(`${openclawCli} cron edit "${exists.id}" --enable --json`);
          }
          fs.writeFileSync(cronStateFile, JSON.stringify({ lastChecked: Date.now(), exists: true }));
        }
    }
  } catch (e) {
    console.error('[Lifecycle] Failed to ensure watchdog cron:', e.message);
  }
}

function getAllRunningPids() {
  const pids = [];
  const relativePath = 'skills/feishu-evolver-wrapper/index.js';
  
  if (process.platform === 'linux') {
    try {
      const procs = fs.readdirSync('/proc').filter(p => /^\d+$/.test(p));
      for (const p of procs) {
        if (parseInt(p) === process.pid) continue; // Skip self
        try {
          const cmdline = fs.readFileSync(path.join('/proc', p, 'cmdline'), 'utf8');
          if ((cmdline.includes(WRAPPER_INDEX) || cmdline.includes(relativePath)) && cmdline.includes('--loop')) {
             pids.push(p);
          }
        } catch(e) {}
      }
    } catch(e) {}
  }
  return pids;
}

function getRunningPid() {
  // Check primary PID file
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
    try {
      process.kill(pid, 0);
      return pid;
    } catch (e) {
      // Stale
    }
  }
  
  // Check actual processes
  const pids = getAllRunningPids();
  if (pids.length > 0) {
      // If multiple, pick the first one and warn
      if (pids.length > 1) {
          console.warn(`[WARNING] Multiple wrapper instances found: ${pids.join(', ')}. Using ${pids[0]}.`);
      }
      const pid = pids[0];
      fs.writeFileSync(PID_FILE, pid);
      return pid;
  }

  return null;
}

function start(args) {
  const pid = getRunningPid();
  if (pid) {
    console.log(`Evolver wrapper is already running (PID ${pid}).`);
    return;
  }

  ensureWatchdog();

  console.log('Starting Evolver Wrapper...');
  const out = fs.openSync(path.resolve(__dirname, '../../logs/wrapper_out.log'), 'a');
  const err = fs.openSync(path.resolve(__dirname, '../../logs/wrapper_err.log'), 'a');

  const child = spawn('node', [WRAPPER_INDEX, ...args], {
    detached: true,
    stdio: ['ignore', out, err],
    cwd: __dirname
  });
  
  fs.writeFileSync(PID_FILE, String(child.pid));
  child.unref();
  console.log(`Started background process (PID ${child.pid}).`);
}

function stop() {
  const pid = getRunningPid();
  if (!pid) {
    console.log('Evolver wrapper is not running.');
    return;
  }

  console.log(`Stopping Evolver Wrapper (PID ${pid})...`);
  try {
    process.kill(pid, 'SIGTERM');
    console.log('SIGTERM sent.');
    
    // Wait for process to exit (max 5 seconds)
    const start = Date.now();
    while (Date.now() - start < 5000) {
      try {
        process.kill(pid, 0);
        // Busy wait but safer than execSync
        const now = Date.now();
        while (Date.now() - now < 100) {}
      } catch (e) {
        console.log(`Process ${pid} exited successfully.`);
        break;
      }
    }
    
    // Force kill if still running
    try {
      process.kill(pid, 0);
      console.warn(`Process ${pid} did not exit gracefully. Sending SIGKILL...`);
      process.kill(pid, 'SIGKILL');
    } catch (e) {
      // Already exited
    }

    // Clean up PID files
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    if (fs.existsSync(LEGACY_PID_FILE)) fs.unlinkSync(LEGACY_PID_FILE);
  } catch (e) {
    console.error(`Failed to stop PID ${pid}: ${e.message}`);
    // Ensure cleanup even on error if process is gone
    try { process.kill(pid, 0); } catch(err) {
        if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    }
  }
}

function status(json = false) {
  const pid = getRunningPid();
  const logFile = path.resolve(__dirname, '../../logs/wrapper_lifecycle.log');
  const cycleFile = path.resolve(__dirname, '../../logs/cycle_count.txt');
  
  let cycle = 'Unknown';
  if (fs.existsSync(cycleFile)) {
    cycle = fs.readFileSync(cycleFile, 'utf8').trim();
  }

  let lastActivity = 'Never';
  let lastAction = '';
  
  if (fs.existsSync(logFile)) {
    try {
      // Read last 1KB to find last line
      const stats = fs.statSync(logFile);
      const size = stats.size;
      const bufferSize = Math.min(1024, size);
      const buffer = Buffer.alloc(bufferSize);
      const fd = fs.openSync(logFile, 'r');
      fs.readSync(fd, buffer, 0, bufferSize, size - bufferSize);
      fs.closeSync(fd);
      
      const lines = buffer.toString().trim().split('\n');
      
      // Parse: 🧬 [ISO_TIMESTAMP] MSG...
      let match = null;
      let line = '';
      
      // Try parsing backwards for a valid timestamp line
      // Optimization: Read larger chunk if needed, or handle different log formats
      for (let i = lines.length - 1; i >= 0; i--) {
          line = lines[i].trim();
          if (!line) continue;
          
          // Match standard format: 🧬 [ISO] Msg
          match = line.match(/\[(.*?)\] (.*)/);
          if (match) break;
          
          // Fallback match: just ISO timestamp at start
          const isoMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
          if (isoMatch) {
              match = [line, isoMatch[1], line.substring(isoMatch[0].length).trim()];
              break;
          }
      }

      if (match) {
           const date = new Date(match[1]);
           if (!isNaN(date.getTime())) {
               const diff = Math.floor((Date.now() - date.getTime()) / 1000);
               
               if (diff < 60) lastActivity = `${diff}s ago`;
               else if (diff < 3600) lastActivity = `${Math.floor(diff/60)}m ago`;
               else lastActivity = `${Math.floor(diff/3600)}h ago`;
               
               lastAction = match[2];
           }
      }
    } catch (e) {
      lastActivity = 'Error reading log: ' + e.message;
    }
  }

  // Fallback: Check wrapper_out.log (more granular) if lifecycle log is old (>5m)
  try {
      const outLog = path.resolve(__dirname, '../../logs/wrapper_out.log');
      if (fs.existsSync(outLog)) {
          const stats = fs.statSync(outLog);
          const diff = Math.floor((Date.now() - stats.mtimeMs) / 1000);
          // If outLog is fresher than what we found, use it
          // Or just append it as "Output Update"
          if (diff < 300) { // Only if recent (<5m)
              let timeStr = diff < 60 ? `${diff}s ago` : `${Math.floor(diff/60)}m ago`;
              lastActivity += ` (Output updated ${timeStr})`;
          }
      }
  } catch(e) {}


  if (json) {
    const daemonPid = fs.existsSync(DAEMON_PID_FILE) ? fs.readFileSync(DAEMON_PID_FILE, 'utf8').trim() : null;
    try { if(daemonPid) process.kill(daemonPid, 0); } catch(e) { /* stale */ }
    
    console.log(JSON.stringify({
      loop: pid ? `running (pid ${pid})` : 'stopped',
      pid: pid || null,
      daemon: daemonPid ? `running (pid ${daemonPid})` : 'stopped',
      cycle: cycle,
      watchdog: pid ? 'ok' : 'unknown',
      last_activity: lastActivity,
      last_action: lastAction
    }));
  } else {
    if (pid) {
      console.log(`✅ Evolver wrapper is RUNNING (PID ${pid})`);
      const daemonPid = fs.existsSync(DAEMON_PID_FILE) ? fs.readFileSync(DAEMON_PID_FILE, 'utf8').trim() : null;
      if (daemonPid) {
          try { process.kill(daemonPid, 0); console.log(`   Daemon: Active (PID ${daemonPid})`); } 
          catch(e) { console.log(`   Daemon: Stale PID file (cleaning up...)`); try { fs.unlinkSync(DAEMON_PID_FILE); } catch(err) {} }
      } else {
          console.log(`   Daemon: Stopped`);
      }

      console.log(`   Cycle: #${cycle}`);
      console.log(`   Last Activity: ${lastActivity}`);
      console.log(`   Action: ${lastAction.substring(0, 60)}${lastAction.length > 60 ? '...' : ''}`);
      
      // If requested via --report, send a card
      if (process.argv.includes('--report')) {
         try {
             const reportScript = path.resolve(__dirname, 'report.js');
             const statusText = `PID: ${pid}\nCycle: #${cycle}\nLast Activity: ${lastActivity}\nAction: ${lastAction}`;
             const cmd = `node "${reportScript}" --title "🧬 Evolver Status Check" --status "Status: [RUNNING] wrapper is active.\n${statusText}" --color "green"`;
             execSync(cmd, { stdio: 'inherit' });
         } catch(e) {
             console.error('Failed to send status report:', e.message);
         }
      }

    } else {
      console.log('❌ Evolver wrapper is STOPPED');
      console.log(`   Last Known Cycle: #${cycle}`);
      console.log(`   Last Activity: ${lastActivity}`);

      if (process.argv.includes('--report')) {
         try {
             const reportScript = path.resolve(__dirname, 'report.js');
             const statusText = `Last Known Cycle: #${cycle}\nLast Activity: ${lastActivity}`;
             const cmd = `node "${reportScript}" --title "🚨 Evolver Status Check" --status "Status: [STOPPED] wrapper is NOT running.\n${statusText}" --color "red"`;
             execSync(cmd, { stdio: 'inherit' });
         } catch(e) {
             console.error('Failed to send status report:', e.message);
         }
      }
    }
  }
}

const action = process.argv[2];
const passArgs = process.argv.slice(2);

switch (action) {
  case 'start':
  case '--loop': 
    start(['--loop']);
    break;
  case 'stop':
    stop();
    break;
  case 'status':
    status(passArgs.includes('--json'));
    break;
  case 'restart':
    stop();
    setTimeout(() => start(['--loop']), 1000);
    break;
  case 'daemon-loop':
    daemonLoop();
    // Keep process alive forever (setInterval does this naturally)
    break;
  case 'ensure':
    // Handle --delay argument (wait before checking)
    const delayArgIndex = passArgs.indexOf('--delay');
    if (delayArgIndex !== -1 && passArgs[delayArgIndex + 1]) {
        const ms = parseInt(passArgs[delayArgIndex + 1]);
        if (!isNaN(ms) && ms > 0) {
            console.log(`[Ensure] Waiting ${ms}ms before check...`);
            try {
                // Use sleep to save CPU (Linux only)
                execSync(`sleep ${ms / 1000}`);
            } catch (e) {
                // Fallback to busy wait if sleep fails
                const end = Date.now() + ms;
                while (Date.now() < end) {}
            }
        }
    }

    // Check if process is stuck by inspecting logs (stale > 10m)
    // We do this BEFORE the debounce check, because a stuck process needs immediate attention
    let isStuck = false;
    try {
        const logFile = path.resolve(__dirname, '../../logs/wrapper_lifecycle.log');
        const outLog = path.resolve(__dirname, '../../logs/wrapper_out.log');
        
        // Only consider stuck if BOTH logs are stale > 20m (to avoid false positives during sleep/long cycles)
        const now = Date.now();
        const threshold = 1200000; // 20 minutes (increased from 10m to support long reasoning cycles)
        
        let lifeStale = true;
        let outStale = true;

        if (fs.existsSync(logFile)) {
             lifeStale = (now - fs.statSync(logFile).mtimeMs) > threshold;
        }
        
        if (fs.existsSync(outLog)) {
             outStale = (now - fs.statSync(outLog).mtimeMs) > threshold;
        } else {
             // If outLog is missing but process is running, that's suspicious, but maybe it just started?
             // Let's assume stale if missing for >10m uptime, but simpler to just say stale=true.
        }

        if (lifeStale && outStale) {
            isStuck = true;
            console.log(`[Ensure] Logs are stale (Lifecycle: ${lifeStale}, Out: ${outStale}). Marking as stuck.`);
        }
    } catch(e) {
        console.warn('[Ensure] Log check failed:', e.message);
    }

    if (isStuck) {
        console.warn('[Ensure] Process appears stuck (logs stale > 20m). Restarting...');
        stop();
        // Clear lock so we can proceed
        try { if (fs.existsSync(path.resolve(__dirname, '../../memory/evolver_ensure.lock'))) fs.unlinkSync(path.resolve(__dirname, '../../memory/evolver_ensure.lock')); } catch(e) {}
    }

    const ensureLock = path.resolve(__dirname, '../../memory/evolver_ensure.lock');
    let forceRestart = false;

    // RUN HEALTH CHECK (Innovation: Self-Healing)
    try {
        const health = runHealthCheck();
        if (health.status === 'error') {
            console.warn('[Ensure] Health Check FAILED (Status: error). Ignoring debounce and forcing restart.');
            console.warn('Issues:', JSON.stringify(health.checks.filter(c => c.ok === false), null, 2));
            forceRestart = true;
            stop(); // STOP THE UNHEALTHY PROCESS
            
            // Clear ensure lock
            try { if (fs.existsSync(ensureLock)) fs.unlinkSync(ensureLock); } catch(e) {}
            
            // Auto-report the failure
            try {
                const reportScript = path.resolve(__dirname, 'report.js');
                const issueText = health.checks.filter(c => c.ok === false).map(c => `- ${c.name}: ${c.error || c.status}`).join('\n');
                const cmd = `node "${reportScript}" --title "🚨 Evolver Self-Healing Triggered" --status "Status: [HEALTH_FAIL] System detected critical failure.\n${issueText}" --color "red"`;
                execSync(cmd, { stdio: 'ignore' });
            } catch(e) {}
        }
    } catch(e) {
        console.warn('[Ensure] Health check execution failed:', e.message);
    }

    try {
      if (fs.existsSync(ensureLock) && !forceRestart) {
        const stats = fs.statSync(ensureLock);
        if (Date.now() - stats.mtimeMs < 300000) { // Increased debounce to 5m
          // silent exit
          process.exit(0);
        }
      }
      fs.writeFileSync(ensureLock, String(Date.now()));
    } catch(e) {}

    ensureWatchdog();
    
    // INNOVATION: Ensure internal daemon is running (unless checking from daemon itself)
    if (!passArgs.includes('--daemon-check')) {
        startDaemon();
    }

    const runningPids = getAllRunningPids();
    if (runningPids.length > 1) {
        console.warn(`[Ensure] Found multiple instances: ${runningPids.join(', ')}. Killing all to reset state.`);
        runningPids.forEach(p => {
            try { process.kill(p, 'SIGKILL'); } catch(e) {}
        });
        // Remove PID file to force clean start
        if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
        // Wait briefly for OS to clear
        execSync('sleep 1');
    }
    
    if (!getRunningPid()) {
      start(['--loop']);
      // If we started it, report success if requested
      if (passArgs.includes('--report')) {
          setTimeout(() => status(false), 2000); // wait for startup
      }
      // INNOVATION: Auto-report dashboard on successful restart via ensure
      try {
          const reportScript = path.resolve(__dirname, 'report.js');
          const cmd = `node "${reportScript}" --title "🧬 Evolver Auto-Repair" --status "Status: [RESTARTED] Watchdog restarted the wrapper." --color "orange"`;
          execSync(cmd, { stdio: 'ignore' });
      } catch(e) {}
    } else {
      // If ensuring and already running, stay silent unless JSON/report requested
      if (passArgs.includes('--json')) {
         setTimeout(() => status(true), 1000);
         return;
      }
      if (passArgs.includes('--report')) {
         status(false);
         return;
      }
      // Silent success - do not spam logs
      return; 
    }
    // Only print status if we just started it or if JSON requested
    if (!getRunningPid() || passArgs.includes('--json')) {
       status(passArgs.includes('--json'));
    }
    break;
  case 'dashboard':
    try {
        const reportScript = path.resolve(__dirname, 'report.js');
        console.log('[Dashboard] Generating full system status card...');
        // Use the new --dashboard flag for rich card
        const cmd = `node "${reportScript}" --dashboard --color "blue"`;
        execSync(cmd, { stdio: 'inherit' });
    } catch(e) {
        console.error('[Dashboard] Failed to generate card:', e.message);
    }
    break;
  default:
    console.log('Usage: node lifecycle.js [start|stop|restart|status|ensure|dashboard|--loop] [--json]');
    status();
}
