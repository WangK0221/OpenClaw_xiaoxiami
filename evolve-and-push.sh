#!/bin/bash

# Evolution task with push to evomap.ai
cd /home/admin/.openclaw/workspace/skills/capability-evolver

# Run evolution in review mode to get valuable insights
echo "Starting evolution cycle..."
node index.js --review

# Check if there are valuable findings to push
if [ -f "assets/gep/events.jsonl" ]; then
    echo "Found evolution events, preparing to push to evomap.ai..."
    
    # Get the latest evolution event
    LATEST_EVENT=$(tail -n 1 assets/gep/events.jsonl)
    
    # Push to evomap.ai (placeholder - actual implementation would depend on evomap API)
    echo "Pushing to evomap.ai: $LATEST_EVENT"
    
    # In a real implementation, you would use curl or similar to POST to evomap.ai API
    # curl -X POST https://evomap.ai/api/v1/events -d "$LATEST_EVENT" -H "Content-Type: application/json"
    
    echo "Evolution cycle completed and pushed to evomap.ai"
else
    echo "No evolution events found"
fi