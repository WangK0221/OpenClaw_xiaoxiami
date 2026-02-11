#!/usr/bin/env node

/**
 * Learning Analytics for OpenClaw AI Evolution
 * Provides insights into learning progress, skill development, and evolution effectiveness
 */

const fs = require('fs');
const path = require('path');

/**
 * Analyze learning progress from memory files
 * @param {string} date - Date to analyze (YYYY-MM-DD format)
 * @returns {Object} Analytics report
 */
function analyzeLearningProgress(date) {
  const memoryPath = path.join(__dirname, '../../memory', `${date}.md`);
  const analytics = {
    date: date,
    skills_practiced: [],
    topics_covered: [],
    progress_score: 0,
    recommendations: []
  };
  
  try {
    if (fs.existsSync(memoryPath)) {
      const content = fs.readFileSync(memoryPath, 'utf8');
      
      // Extract skills practiced
      const skillsMatch = content.match(/(?:skill|skills|capability|capabilities)[\s\S]*?([\w\s,]+)/i);
      if (skillsMatch && skillsMatch[1]) {
        analytics.skills_practiced = skillsMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      
      // Extract topics covered
      const topicsMatch = content.match(/(?:topic|topics|focus|area|areas)[\s\S]*?([\w\s,]+)/i);
      if (topicsMatch && topicsMatch[1]) {
        analytics.topics_covered = topicsMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0);
      }
      
      // Calculate progress score based on activity
      const lines = content.split('\n').length;
      analytics.progress_score = Math.min(100, Math.round(lines / 10));
      
      // Generate recommendations
      if (analytics.skills_practiced.length === 0) {
        analytics.recommendations.push('Consider documenting specific skills practiced each day');
      }
      if (analytics.topics_covered.length === 0) {
        analytics.recommendations.push('Track focus areas to identify learning patterns');
      }
      if (analytics.progress_score < 30) {
        analytics.recommendations.push('Increase daily learning activities for better evolution');
      }
    } else {
      analytics.recommendations.push(`No memory file found for ${date}`);
    }
  } catch (error) {
    analytics.recommendations.push(`Error analyzing memory: ${error.message}`);
  }
  
  return analytics;
}

/**
 * Generate weekly learning report
 * @param {string} endDate - End date for the week (YYYY-MM-DD format)
 * @returns {Object} Weekly report
 */
function generateWeeklyReport(endDate) {
  const endDateObj = new Date(endDate);
  const report = {
    period: `Week ending ${endDate}`,
    daily_analytics: [],
    weekly_summary: {
      total_skills_practiced: new Set(),
      total_topics_covered: new Set(),
      average_progress_score: 0,
      overall_recommendations: []
    }
  };
  
  // Get last 7 days
  for (let i = 6; i >= 0; i--) {
    const dateObj = new Date(endDateObj);
    dateObj.setDate(dateObj.getDate() - i);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    const dailyAnalytics = analyzeLearningProgress(dateStr);
    report.daily_analytics.push(dailyAnalytics);
    
    // Aggregate data
    dailyAnalytics.skills_practiced.forEach(skill => 
      report.weekly_summary.total_skills_practiced.add(skill)
    );
    dailyAnalytics.topics_covered.forEach(topic => 
      report.weekly_summary.total_topics_covered.add(topic)
    );
    report.weekly_summary.average_progress_score += dailyAnalytics.progress_score;
  }
  
  report.weekly_summary.total_skills_practiced = 
    Array.from(report.weekly_summary.total_skills_practiced);
  report.weekly_summary.total_topics_covered = 
    Array.from(report.weekly_summary.total_topics_covered);
  report.weekly_summary.average_progress_score = 
    Math.round(report.weekly_summary.average_progress_score / 7);
  
  // Generate weekly recommendations
  if (report.weekly_summary.total_skills_practiced.length < 3) {
    report.weekly_summary.overall_recommendations.push('Diversify skill practice across more domains');
  }
  if (report.weekly_summary.average_progress_score < 50) {
    report.weekly_summary.overall_recommendations.push('Increase daily learning intensity');
  }
  
  return report;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const today = new Date().toISOString().split('T')[0];
  
  if (args.includes('--daily')) {
    const date = args[args.indexOf('--daily') + 1] || today;
    const analytics = analyzeLearningProgress(date);
    console.log(JSON.stringify(analytics, null, 2));
  } else if (args.includes('--weekly')) {
    const endDate = args[args.indexOf('--weekly') + 1] || today;
    const report = generateWeeklyReport(endDate);
    console.log(JSON.stringify(report, null, 2));
  } else {
    // Default: show today's analytics
    const analytics = analyzeLearningProgress(today);
    console.log('📊 Learning Analytics Report');
    console.log('===========================');
    console.log(`Date: ${analytics.date}`);
    console.log(`Progress Score: ${analytics.progress_score}/100`);
    console.log(`Skills Practiced: ${analytics.skills_practiced.length > 0 ? analytics.skills_practiced.join(', ') : 'None recorded'}`);
    console.log(`Topics Covered: ${analytics.topics_covered.length > 0 ? analytics.topics_covered.join(', ') : 'None recorded'}`);
    if (analytics.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analytics.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
  }
}

// CLI entry point
if (require.main === module) {
  main();
}

module.exports = {
  analyzeLearningProgress,
  generateWeeklyReport
};