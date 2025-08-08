#!/bin/bash
set -e

# Ensure we run from the script's directory
cd "$(dirname "$0")"

echo "Starting CampusPe API..."

# Run the prebuilt Node.js server
exec node dist/app.js
