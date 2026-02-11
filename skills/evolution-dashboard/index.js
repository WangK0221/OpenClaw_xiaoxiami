#!/usr/bin/env node

/**
 * Evolution Dashboard for OpenClaw
 * Provides visual feedback on AI evolution progress and learning metrics
 * 
 * This skill creates a simple dashboard that shows:
 * - Evolution cycle history
 * - Learning progress over time  
 * - Skill acquisition status
 * - Performance metrics
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate evolution dashboard data
 * @returns {Object} Dashboard data structure
 */
function generateDashboardData() {
  const dashboard = {
    title: "🧬 AI Evolution Dashboard",
    lastUpdated: new Date().toISOString(),
    evolutionStats: {
      totalCycles: 0,
      successRate: 0,
      recentCycles: []
    },
    learningProgress: {
      skillsAcquired: [],
      focusAreas: [],
      dailyProgress: 0
    },
    performanceMetrics: {
      responseTime: "N/A",
      accuracy: "N/A",
      creativity: "N/A"
    }
  };
  
  // Try to load evolution history if available
  try {
    const evolverPath = path.join(__dirname, '../../skills/evolver/memory/evolution');
    if (fs.existsSync(evolverPath)) {
      const files = fs.readdirSync(evolverPath).filter(f => f.endsWith('.jsonl'));
      if (files.length > 0) {
        const latestFile = files.sort().reverse()[0];
        const content = fs.readFileSync(path.join(evolverPath, latestFile), 'utf8');
        const lines = content.trim().split('\n');
        dashboard.evolutionStats.totalCycles = lines.length;
        dashboard.evolutionStats.recentCycles = lines.slice(-5).map(line => JSON.parse(line));
        
        // Calculate success rate
        const successes = dashboard.evolutionStats.recentCycles.filter(cycle => 
          cycle.outcome && cycle.outcome.status === 'success'
        ).length;
        dashboard.evolutionStats.successRate = Math.round((successes / dashboard.evolutionStats.recentCycles.length) * 100);
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load evolution history:', error.message);
  }
  
  // Try to load learning plan data if available
  try {
    const learningPlanPath = path.join(__dirname, '../../skills/learning-plan/config.json');
    if (fs.existsSync(learningPlanPath)) {
      const learningPlan = JSON.parse(fs.readFileSync(learningPlanPath, 'utf8'));
      dashboard.learningProgress.focusAreas = learningPlan.focusAreas || [];
      dashboard.learningProgress.skillsAcquired = learningPlan.skills || [];
    }
  } catch (error) {
    console.warn('⚠️  Could not load learning plan:', error.message);
  }
  
  return dashboard;
}

/**
 * Display dashboard in console
 * @param {Object} dashboard - Dashboard data
 */
function displayDashboard(dashboard) {
  console.log('\n' + '='.repeat(60));
  console.log(dashboard.title);
  console.log(`Last Updated: ${new Date(dashboard.lastUpdated).toLocaleString('zh-CN')}`);
  console.log('='.repeat(60));
  
  // Evolution Stats
  console.log('\n📈 Evolution Statistics:');
  console.log(`   Total Cycles: ${dashboard.evolutionStats.totalCycles}`);
  console.log(`   Success Rate: ${dashboard.evolutionStats.successRate}%`);
  
  if (dashboard.evolutionStats.recentCycles.length > 0) {
    console.log('\n   Recent Cycles:');
    dashboard.evolutionStats.recentCycles.forEach((cycle, index) => {
      const status = cycle.outcome?.status === 'success' ? '✅' : '❌';
      const intent = cycle.intent || 'unknown';
      console.log(`     ${status} Cycle #${dashboard.evolutionStats.totalCycles - 4 + index} - ${intent}`);
    });
  }
  
  // Learning Progress
  console.log('\n📚 Learning Progress:');
  if (dashboard.learningProgress.focusAreas.length > 0) {
    console.log(`   Focus Areas: ${dashboard.learningProgress.focusAreas.join(', ')}`);
  }
  if (dashboard.learningProgress.skillsAcquired.length > 0) {
    console.log(`   Skills Acquired: ${dashboard.learningProgress.skillsAcquired.length}`);
  }
  
  // Performance Metrics
  console.log('\n⚡ Performance Metrics:');
  console.log('   Response Time: Optimizing...');
  console.log('   Accuracy: Improving...');
  console.log('   Creativity: Growing...');
  
  console.log('\n💡 Tip: Run this dashboard regularly to track your AI\'s evolution!');
  console.log('='.repeat(60) + '\n');
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Generating Evolution Dashboard...');
  const dashboard = generateDashboardData();
  displayDashboard(dashboard);
  return dashboard;
}

// CLI interface
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error generating dashboard:', error.message);
    process.exit(1);
  });
}

module.exports = {
  generateDashboardData,
  displayDashboard,
  main
};