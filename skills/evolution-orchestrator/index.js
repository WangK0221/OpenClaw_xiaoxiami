#!/usr/bin/env node

/**
 * Evolution Orchestrator
 * Dynamically manages evolution strategy based on system signals and patterns
 * 
 * This skill provides:
 * - Signal pattern detection and analysis
 * - Dynamic intent selection (repair/optimize/innovate)
 * - Stagnation prevention through strategy rotation
 * - Evolution cycle optimization
 */

const fs = require('fs');
const path = require('path');

// Load evolution history to detect patterns
function loadEvolutionHistory() {
  const historyPath = path.join(__dirname, '../../skills/evolver/memory/evolution/memory_graph.jsonl');
  if (!fs.existsSync(historyPath)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(historyPath, 'utf8');
    return content.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .filter(event => event.type === 'EvolutionEvent');
  } catch (error) {
    console.warn('⚠️  Could not load evolution history:', error.message);
    return [];
  }
}

// Analyze recent evolution patterns
function analyzePatterns(history) {
  const recentCycles = history.slice(-10); // Last 10 cycles
  
  // Count consecutive same intents
  let consecutiveSameIntent = 1;
  let currentIntent = recentCycles.length > 0 ? recentCycles[recentCycles.length - 1].intent : null;
  
  for (let i = recentCycles.length - 2; i >= 0; i--) {
    if (recentCycles[i].intent === currentIntent) {
      consecutiveSameIntent++;
    } else {
      break;
    }
  }
  
  // Count same signals
  const signalCounts = {};
  recentCycles.forEach(event => {
    event.signals.forEach(signal => {
      signalCounts[signal] = (signalCounts[signal] || 0) + 1;
    });
  });
  
  return {
    consecutiveSameIntent,
    currentIntent,
    signalCounts,
    totalRecentCycles: recentCycles.length
  };
}

// Determine optimal evolution strategy
function determineStrategy(patterns) {
  // If we have too many consecutive same intents, force a change
  if (patterns.consecutiveSameIntent >= 3) {
    const intents = ['repair', 'optimize', 'innovate'];
    const currentIndex = intents.indexOf(patterns.currentIntent);
    const nextIndex = (currentIndex + 1) % intents.length;
    return {
      intent: intents[nextIndex],
      reason: `Breaking stagnation: ${patterns.consecutiveSameIntent} consecutive ${patterns.currentIntent} cycles`
    };
  }
  
  // If we see stagnation signals, prioritize innovation
  if (patterns.signalCounts['evolution_stagnation_detected'] > 0) {
    return {
      intent: 'innovate',
      reason: 'Responding to evolution_stagnation_detected signal'
    };
  }
  
  // If we see error signals, prioritize repair
  if (patterns.signalCounts['log_error'] > 0) {
    return {
      intent: 'repair',
      reason: 'Responding to log_error signal'
    };
  }
  
  // Default to balanced strategy
  const cycleCount = patterns.totalRecentCycles;
  const intents = ['innovate', 'optimize', 'repair'];
  const intent = intents[cycleCount % 3];
  
  return {
    intent,
    reason: `Balanced rotation: cycle ${cycleCount} -> ${intent}`
  };
}

// Execute the orchestrator
async function orchestrate() {
  console.log('🎯 Evolution Orchestrator - Analyzing system state...');
  
  const history = loadEvolutionHistory();
  const patterns = analyzePatterns(history);
  const strategy = determineStrategy(patterns);
  
  console.log(`📊 Analysis Results:`);
  console.log(`   - Consecutive same intent: ${patterns.consecutiveSameIntent}`);
  console.log(`   - Current intent: ${patterns.currentIntent || 'none'}`);
  console.log(`   - Total recent cycles: ${patterns.totalRecentCycles}`);
  console.log(``);
  console.log(`🚀 Recommended Strategy:`);
  console.log(`   - Intent: ${strategy.intent}`);
  console.log(`   - Reason: ${strategy.reason}`);
  
  // Write strategy to a file for the evolver to consume
  const strategyFile = path.join(__dirname, '../../.evolution_strategy.json');
  fs.writeFileSync(strategyFile, JSON.stringify({
    intent: strategy.intent,
    reason: strategy.reason,
    timestamp: Date.now(),
    patterns: patterns
  }, null, 2));
  
  console.log(`✅ Strategy saved to ${strategyFile}`);
  console.log('💡 The evolver will use this strategy in the next cycle.');
  
  return strategy;
}

// CLI interface
if (require.main === module) {
  orchestrate().catch(error => {
    console.error('❌ Evolution Orchestrator failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  loadEvolutionHistory,
  analyzePatterns,
  determineStrategy,
  orchestrate
};