#!/usr/bin/env node

// Memory Bridge Script
// This script handles cross-session memory persistence
// It reads RECENT_EVENTS.md at startup and appends new events periodically

const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = '/home/admin/.openclaw/workspace';
const RECENT_EVENTS_FILE = path.join(WORKSPACE_DIR, 'RECENT_EVENTS.md');
const MEMORY_DIR = path.join(WORKSPACE_DIR, 'memory');

// Ensure memory directory exists
if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

// Function to read recent events
function readRecentEvents() {
  try {
    if (fs.existsSync(RECENT_EVENTS_FILE)) {
      const content = fs.readFileSync(RECENT_EVENTS_FILE, 'utf8');
      console.log('✅ Loaded recent events from RECENT_EVENTS.md');
      return content;
    } else {
      console.log('📝 RECENT_EVENTS.md not found, creating empty file');
      fs.writeFileSync(RECENT_EVENTS_FILE, '# Recent Events\n\nThis file contains recent events that persist across sessions.\n\n');
      return '# Recent Events\n\nThis file contains recent events that persist across sessions.\n\n';
    }
  } catch (error) {
    console.error('❌ Error reading RECENT_EVENTS.md:', error);
    return '';
  }
}

// Function to append new event
function appendEvent(eventText) {
  try {
    const timestamp = new Date().toISOString();
    const eventEntry = `\n## ${timestamp}\n${eventText}\n`;
    
    // Read existing content
    let existingContent = '';
    if (fs.existsSync(RECENT_EVENTS_FILE)) {
      existingContent = fs.readFileSync(RECENT_EVENTS_FILE, 'utf8');
    } else {
      existingContent = '# Recent Events\n\nThis file contains recent events that persist across sessions.\n\n';
    }
    
    // Append new event
    const updatedContent = existingContent + eventEntry;
    fs.writeFileSync(RECENT_EVENTS_FILE, updatedContent);
    console.log('✅ Appended new event to RECENT_EVENTS.md');
  } catch (error) {
    console.error('❌ Error appending event to RECENT_EVENTS.md:', error);
  }
}

// Function to create daily memory file
function createDailyMemory() {
  const today = new Date().toISOString().split('T')[0];
  const dailyFile = path.join(MEMORY_DIR, `${today}.md`);
  
  if (!fs.existsSync(dailyFile)) {
    fs.writeFileSync(dailyFile, `# Memory - ${today}\n\n`);
    console.log(`✅ Created daily memory file: ${today}.md`);
  }
}

// Main function
function main() {
  const action = process.argv[2] || 'read';
  
  switch (action) {
    case 'read':
      readRecentEvents();
      break;
    case 'append':
      const eventText = process.argv.slice(3).join(' ');
      if (eventText) {
        appendEvent(eventText);
      } else {
        console.log('⚠️ No event text provided. Usage: node memory_bridge.js append "event description"');
      }
      break;
    case 'daily':
      createDailyMemory();
      break;
    default:
      console.log('Usage: node memory_bridge.js [read|append|daily]');
      console.log('  read   - Read recent events');
      console.log('  append - Append new event (provide event text as arguments)');
      console.log('  daily  - Create daily memory file');
  }
}

if (require.main === module) {
  main();
}