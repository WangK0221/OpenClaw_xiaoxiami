const resolveToolPath = require('./resolveToolPath');

// Export for programmatic use
module.exports = resolveToolPath;

// CLI interface when run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: tool-path-resolver <tool-name>');
    process.exit(1);
  }
  
  const toolName = args[0];
  
  resolveToolPath(toolName)
    .then(resolvedPath => {
      if (resolvedPath) {
        console.log(resolvedPath);
      } else {
        console.error(`Error: ${toolName} not found`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`Error resolving ${toolName}:`, error.message);
      process.exit(1);
    });
}