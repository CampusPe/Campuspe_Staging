#!/bin/bash

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}🚀 BunnyCDN Configuration Script${NC}"
echo -e "This script will configure the necessary environment variables for BunnyCDN integration"
echo ""

# Get the .env file path
ENV_FILE=".env"
if [ -f "apps/api/.env" ]; then
  ENV_FILE="apps/api/.env"
  echo -e "${GREEN}Found .env file at apps/api/.env${NC}"
else
  echo -e "${YELLOW}Using root .env file${NC}"
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}Creating new .env file at $ENV_FILE${NC}"
  touch "$ENV_FILE"
fi

# Check if BunnyCDN variables are already set
if grep -q "BUNNY_STORAGE_ZONE_NAME" "$ENV_FILE" && \
   grep -q "BUNNY_STORAGE_ACCESS_KEY" "$ENV_FILE" && \
   grep -q "BUNNY_CDN_URL" "$ENV_FILE"; then
  echo -e "${GREEN}BunnyCDN environment variables already exist in $ENV_FILE${NC}"
  
  # Show current values
  ZONE_NAME=$(grep "BUNNY_STORAGE_ZONE_NAME" "$ENV_FILE" | cut -d '=' -f2)
  CDN_URL=$(grep "BUNNY_CDN_URL" "$ENV_FILE" | cut -d '=' -f2)
  
  echo -e "Current configuration:"
  echo -e "  ${BLUE}Storage Zone:${NC} $ZONE_NAME"
  echo -e "  ${BLUE}CDN URL:${NC} $CDN_URL"
  echo -e "  ${BLUE}Access Key:${NC} ********"
  
  read -p "Do you want to update these values? (y/n): " update_vars
  if [[ $update_vars != "y" && $update_vars != "Y" ]]; then
    echo -e "${GREEN}Keeping existing BunnyCDN configuration.${NC}"
    exit 0
  fi
fi

# Prompt for BunnyCDN configuration
echo -e "\n${BOLD}Please enter your BunnyCDN configuration:${NC}"
read -p "Storage Zone Name: " storage_zone
read -p "BunnyCDN Access Key: " access_key
read -p "CDN URL (e.g., https://yourzone.b-cdn.net): " cdn_url

# Validate inputs
if [ -z "$storage_zone" ] || [ -z "$access_key" ] || [ -z "$cdn_url" ]; then
  echo -e "${RED}Error: All fields are required.${NC}"
  exit 1
fi

# Update or add environment variables
if grep -q "BUNNY_STORAGE_ZONE_NAME" "$ENV_FILE"; then
  sed -i '' "s/BUNNY_STORAGE_ZONE_NAME=.*/BUNNY_STORAGE_ZONE_NAME=$storage_zone/" "$ENV_FILE"
else
  echo "BUNNY_STORAGE_ZONE_NAME=$storage_zone" >> "$ENV_FILE"
fi

if grep -q "BUNNY_STORAGE_ACCESS_KEY" "$ENV_FILE"; then
  sed -i '' "s/BUNNY_STORAGE_ACCESS_KEY=.*/BUNNY_STORAGE_ACCESS_KEY=$access_key/" "$ENV_FILE"
else
  echo "BUNNY_STORAGE_ACCESS_KEY=$access_key" >> "$ENV_FILE"
fi

if grep -q "BUNNY_CDN_URL" "$ENV_FILE"; then
  sed -i '' "s#BUNNY_CDN_URL=.*#BUNNY_CDN_URL=$cdn_url#" "$ENV_FILE"
else
  echo "BUNNY_CDN_URL=$cdn_url" >> "$ENV_FILE"
fi

if grep -q "BUNNY_STORAGE_HOSTNAME" "$ENV_FILE"; then
  sed -i '' "s/BUNNY_STORAGE_HOSTNAME=.*/BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com/" "$ENV_FILE"
else
  echo "BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com" >> "$ENV_FILE"
fi

echo -e "\n${GREEN}✅ BunnyCDN configuration successfully updated!${NC}"
echo -e "The following environment variables have been added/updated:"
echo -e "  ${BLUE}BUNNY_STORAGE_ZONE_NAME=${NC}$storage_zone"
echo -e "  ${BLUE}BUNNY_STORAGE_ACCESS_KEY=${NC}********"
echo -e "  ${BLUE}BUNNY_CDN_URL=${NC}$cdn_url"
echo -e "  ${BLUE}BUNNY_STORAGE_HOSTNAME=${NC}storage.bunnycdn.com"

echo -e "\n${YELLOW}Note: Restart your server for changes to take effect.${NC}"
