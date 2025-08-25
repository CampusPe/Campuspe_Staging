#!/bin/bash

# This script updates the BunnyCDN configuration by fixing the access key format

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}🔧 BunnyCDN Configuration Fix Script${NC}"
echo "This script will fix the BunnyCDN access key format in your .env file"
echo ""

# Find the .env file
if [ -f "apps/api/.env" ]; then
  ENV_FILE="apps/api/.env"
  echo -e "${GREEN}Found .env file at apps/api/.env${NC}"
else
  if [ -f ".env" ]; then
    ENV_FILE=".env"
    echo -e "${GREEN}Found .env file at .env${NC}"
  else
    echo -e "${RED}Error: Cannot find .env file in apps/api/.env or .env${NC}"
    exit 1
  fi
fi

# Extract BunnyCDN access key
BUNNY_ACCESS_KEY=$(grep "BUNNY_STORAGE_ACCESS_KEY" "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")

if [ -z "$BUNNY_ACCESS_KEY" ]; then
  echo -e "${RED}Error: BUNNY_STORAGE_ACCESS_KEY not found in .env file${NC}"
  exit 1
fi

echo -e "${BLUE}Current Access Key:${NC} ${YELLOW}$BUNNY_ACCESS_KEY${NC}"

# Check if access key contains hyphens
if echo "$BUNNY_ACCESS_KEY" | grep -q "-"; then
  # Remove hyphens from the access key
  FIXED_ACCESS_KEY=$(echo "$BUNNY_ACCESS_KEY" | tr -d '-')
  echo -e "${BLUE}Fixed Access Key:${NC} ${GREEN}$FIXED_ACCESS_KEY${NC}"
  
  # Create a backup of the .env file
  cp "$ENV_FILE" "${ENV_FILE}.bak"
  echo -e "${GREEN}Created backup: ${ENV_FILE}.bak${NC}"
  
  # Replace the access key in the .env file
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|BUNNY_STORAGE_ACCESS_KEY=.*|BUNNY_STORAGE_ACCESS_KEY=$FIXED_ACCESS_KEY|" "$ENV_FILE"
  else
    # Linux
    sed -i "s|BUNNY_STORAGE_ACCESS_KEY=.*|BUNNY_STORAGE_ACCESS_KEY=$FIXED_ACCESS_KEY|" "$ENV_FILE"
  fi
  
  echo -e "${GREEN}✅ Successfully updated BUNNY_STORAGE_ACCESS_KEY in $ENV_FILE${NC}"
  echo "The access key has been updated to remove hyphens, which can cause authentication issues with BunnyCDN."
  
  # If this is a Node.js project, suggest restarting the server
  if [ -f "package.json" ]; then
    echo -e "${YELLOW}⚠️ Remember to restart your Node.js server for changes to take effect!${NC}"
  fi
else
  echo -e "${GREEN}✅ Access key is already in the correct format (no hyphens)${NC}"
  echo "No changes needed."
fi
