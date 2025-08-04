#!/bin/bash
cd /Users/premthakare/Desktop/Campuspe_Staging/apps/api
export CLAUDE_API_KEY="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"
export ANTHROPIC_API_KEY="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"
echo "Starting server with Claude API key: ${CLAUDE_API_KEY:0:20}..."
/opt/homebrew/bin/node /Users/premthakare/Desktop/Campuspe_Staging/apps/api/dist/app.js
