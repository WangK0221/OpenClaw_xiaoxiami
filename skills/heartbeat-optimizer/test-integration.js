#!/usr/bin/env node

/**
 * Integration test for Heartbeat Optimizer
 */

const fs = require('fs').promises;
const path = require('path');

async function runIntegrationTest() {
  console.log('Running Heartbeat Optimizer integration test...');
  
  // Test 1: Load optimizer module
  let HeartbeatOptimizer;
  try {
    HeartbeatOptimizer = require('./optimizer');
    console.log('✓ Optimizer module loaded successfully');
  } catch (error) {
    console.error('Integration test failed:', error.message);
    process.exit(1);
  }

  // Test 2: Create test instance and check heartbeat execution
  const optimizer = new HeartbeatOptimizer();
  let shouldExecute;
  try {
    shouldExecute = await optimizer.shouldExecuteHeartbeat();
    console.log(`✓ Heartbeat execution check: ${shouldExecute ? 'needed' : 'not needed'}`);
  } catch (error) {
    console.error('Integration test failed:', error.message);
    process.exit(1);
  }

  // Test 3: Test state management
  try {
    const state = await optimizer.loadState();
    if (state && typeof state === 'object') {
      console.log('✓ State management working correctly');
    } else {
      throw new Error('Invalid state returned');
    }
  } catch (error) {
    console.error('Integration test failed:', error.message);
    process.exit(1);
  }

  // Test 4: Reset state functionality
  try {
    await optimizer.resetState();
    console.log('✓ State reset functionality working');
  } catch (error) {
    console.error('Integration test failed:', error.message);
    process.exit(1);
  }

  console.log('Integration test passed!');
  process.exit(0);
}

if (require.main === module) {
  runIntegrationTest().catch((error) => {
    console.error('Integration test failed:', error.message);
    process.exit(1);
  });
}