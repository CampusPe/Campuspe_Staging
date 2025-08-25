#!/bin/bash

# This script creates a test file for BunnyCDN upload using cURL directly
# This helps verify if the issue is with our BunnyCDN credentials or our Node.js code

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}🧪 BunnyCDN Direct Upload Test Script${NC}"
echo "This script will test uploading to BunnyCDN using cURL"
echo ""

# Get credentials from env file
if [ -f "apps/api/.env" ]; then
  ENV_FILE="apps/api/.env"
  echo -e "${GREEN}Found .env file at apps/api/.env${NC}"
else
  echo -e "${RED}Error: Cannot find .env file in apps/api/.env${NC}"
  exit 1
fi

# Extract BunnyCDN credentials
BUNNY_STORAGE_ZONE=$(grep "BUNNY_STORAGE_ZONE_NAME" "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")
BUNNY_ACCESS_KEY=$(grep "BUNNY_STORAGE_ACCESS_KEY" "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")
BUNNY_HOSTNAME=$(grep "BUNNY_STORAGE_HOSTNAME" "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")
BUNNY_CDN_URL=$(grep "BUNNY_CDN_URL" "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")

# If hostname is empty, use default
if [ -z "$BUNNY_HOSTNAME" ]; then
  BUNNY_HOSTNAME="storage.bunnycdn.com"
fi

echo -e "${BLUE}BunnyCDN Configuration:${NC}"
echo -e "Storage Zone: ${YELLOW}$BUNNY_STORAGE_ZONE${NC}"
echo -e "Access Key: ${YELLOW}$(echo $BUNNY_ACCESS_KEY | cut -c1-8)...${NC}"
echo -e "Hostname: ${YELLOW}$BUNNY_HOSTNAME${NC}"
echo -e "CDN URL: ${YELLOW}$BUNNY_CDN_URL${NC}"
echo ""

# Create a simple test file
TEST_FILENAME="test_$(date +%s).txt"
TEST_CONTENT="This is a test file uploaded by cURL on $(date)"
echo "$TEST_CONTENT" > "$TEST_FILENAME"
echo -e "${GREEN}Created test file: $TEST_FILENAME${NC}"

# Upload path in storage
UPLOAD_PATH="test/$TEST_FILENAME"
UPLOAD_URL="https://$BUNNY_HOSTNAME/$BUNNY_STORAGE_ZONE/$UPLOAD_PATH"

echo -e "${BLUE}Uploading to:${NC} $UPLOAD_URL"
echo ""

# Upload using cURL
echo -e "${YELLOW}Running cURL command...${NC}"
echo -e "${BOLD}curl -v -X PUT -T \"$TEST_FILENAME\" \"$UPLOAD_URL\" -H \"AccessKey: ***\"${NC}"
echo ""

curl -v -X PUT -T "$TEST_FILENAME" "$UPLOAD_URL" -H "AccessKey: $BUNNY_ACCESS_KEY"
CURL_EXIT_CODE=$?

echo ""
if [ $CURL_EXIT_CODE -eq 0 ]; then
  # Check if the file exists by doing a HEAD request
  echo -e "${BLUE}Verifying file uploaded successfully...${NC}"
  
  VERIFY_RESULT=$(curl -s -I -X HEAD "$UPLOAD_URL" -H "AccessKey: $BUNNY_ACCESS_KEY")
  
  if echo "$VERIFY_RESULT" | grep -q "HTTP/1.1 200"; then
    CDN_URL="${BUNNY_CDN_URL}/${UPLOAD_PATH}"
    echo -e "${GREEN}✅ Upload successful!${NC}"
    echo -e "${BLUE}CDN URL:${NC} $CDN_URL"
    
    # Attempt to download from CDN URL
    echo -e "${BLUE}Testing download from CDN URL...${NC}"
    DOWNLOAD_RESULT=$(curl -s -I "$CDN_URL")
    
    if echo "$DOWNLOAD_RESULT" | grep -q "HTTP/1.1 200"; then
      echo -e "${GREEN}✅ Download successful!${NC}"
    else
      echo -e "${RED}❌ Download failed from CDN URL${NC}"
      echo "$DOWNLOAD_RESULT"
    fi
  else
    echo -e "${RED}❌ File verification failed${NC}"
    echo "$VERIFY_RESULT"
  fi
else
  echo -e "${RED}❌ Upload failed with exit code: $CURL_EXIT_CODE${NC}"
fi

# Clean up
rm "$TEST_FILENAME"
echo -e "${BLUE}Temporary test file deleted${NC}"
