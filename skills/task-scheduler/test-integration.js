#!/usr/bin/env node

const TaskScheduler = require('./scheduler');

async function testIntegration() {
  const scheduler = new TaskScheduler();
  
  // Test adding a task
  try {
    const taskId = await scheduler.addTask({
      name: 'heartbeat-test',
      command: 'echo "Heartbeat task executed"',
      schedule: {
        type: 'interval',
        interval: 60 // 60 seconds
      }
    });
    
    console.log('✓ Task added successfully:', taskId);
    
    // Test listing tasks
    const tasks = await scheduler.listTasks();
    console.log('✓ Tasks listed successfully:', tasks.length, 'tasks');
    
    // Test running tasks (should execute since no last run time)
    const results = await scheduler.runScheduledTasks();
    console.log('✓ Tasks executed successfully:', results.length, 'results');
    
    console.log('Integration test passed!');
  } catch (error) {
    console.error('Integration test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testIntegration().catch(console.error);
}