#!/bin/bash
set -e

# Ensure we run from the script's directory
cd "$(dirname "$0")"

echo "Starting CampusPe Web..."

# Azure exposes port 8080 for Node apps
PORT="${PORT:-8080}"

# Run the prebuilt Next.js application
exec npx next start -p "$PORT" -H 0.0.0.0
