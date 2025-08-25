#!/bin/bash

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}🔍 BunnyCDN Key Verification Tool${NC}"
echo "This tool tests your BunnyCDN configuration with a new access key"
echo ""

# Check for the .env file
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

# Prompt for new access key
echo ""
echo -e "${YELLOW}Please enter your new BunnyCDN access key from the dashboard:${NC}"
read -p "> " NEW_ACCESS_KEY

if [ -z "$NEW_ACCESS_KEY" ]; then
  echo -e "${RED}Error: Access key cannot be empty${NC}"
  exit 1
fi

# Extract current configuration
STORAGE_ZONE=$(grep "BUNNY_STORAGE_ZONE_NAME" "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")
CDN_URL=$(grep "BUNNY_CDN_URL" "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")

echo -e "${BLUE}Configuration to test:${NC}"
echo -e "Storage Zone: ${YELLOW}$STORAGE_ZONE${NC}"
echo -e "Access Key: ${YELLOW}${NEW_ACCESS_KEY:0:8}...${NC}"
echo -e "CDN URL: ${YELLOW}$CDN_URL${NC}"
echo ""

# Create a backup of the .env file
cp "$ENV_FILE" "${ENV_FILE}.bak"
echo -e "${GREEN}Created backup: ${ENV_FILE}.bak${NC}"

# Update the .env file with the new access key
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s|BUNNY_STORAGE_ACCESS_KEY=.*|BUNNY_STORAGE_ACCESS_KEY=$NEW_ACCESS_KEY|" "$ENV_FILE"
else
  # Linux
  sed -i "s|BUNNY_STORAGE_ACCESS_KEY=.*|BUNNY_STORAGE_ACCESS_KEY=$NEW_ACCESS_KEY|" "$ENV_FILE"
fi

echo -e "${GREEN}✅ Updated BUNNY_STORAGE_ACCESS_KEY in $ENV_FILE${NC}"
echo ""

# Create test file
TEST_FILENAME="test_$(date +%s).txt"
TEST_CONTENT="This is a test file uploaded by curl on $(date)"
echo "$TEST_CONTENT" > "$TEST_FILENAME"
echo -e "${GREEN}Created test file: $TEST_FILENAME${NC}"

# Upload path in storage
UPLOAD_PATH="test/$TEST_FILENAME"
UPLOAD_URL="https://storage.bunnycdn.com/$STORAGE_ZONE/$UPLOAD_PATH"

echo -e "${BLUE}Uploading to:${NC} $UPLOAD_URL"
echo ""

# Try the upload
echo -e "${YELLOW}Testing upload with new access key...${NC}"
curl -v -X PUT -T "$TEST_FILENAME" "$UPLOAD_URL" -H "AccessKey: $NEW_ACCESS_KEY"
CURL_EXIT_CODE=$?

echo ""
if [ $CURL_EXIT_CODE -eq 0 ]; then
  # Check if the file exists by doing a HEAD request
  echo -e "${BLUE}Verifying file uploaded successfully...${NC}"
  
  VERIFY_RESULT=$(curl -s -I -X HEAD "$UPLOAD_URL" -H "AccessKey: $NEW_ACCESS_KEY")
  
  if echo "$VERIFY_RESULT" | grep -q "HTTP/1.1 200"; then
    CDN_DOWNLOAD_URL="${CDN_URL}/${UPLOAD_PATH}"
    echo -e "${GREEN}✅ Upload successful!${NC}"
    echo -e "${BLUE}CDN URL:${NC} $CDN_DOWNLOAD_URL"
    
    # Attempt to download from CDN URL
    echo -e "${BLUE}Testing download from CDN URL...${NC}"
    DOWNLOAD_RESULT=$(curl -s -I "$CDN_DOWNLOAD_URL")
    
    if echo "$DOWNLOAD_RESULT" | grep -q "HTTP/1.1 200"; then
      echo -e "${GREEN}✅ Download successful!${NC}"
      echo -e "${BOLD}${GREEN}🎉 Your BunnyCDN configuration is now working correctly!${NC}"
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
  
  echo -e "${YELLOW}Would you like to restore the previous access key? (y/n)${NC}"
  read -p "> " RESTORE_KEY
  
  if [[ "$RESTORE_KEY" == "y" ]] || [[ "$RESTORE_KEY" == "Y" ]]; then
    cp "${ENV_FILE}.bak" "$ENV_FILE"
    echo -e "${GREEN}✅ Restored previous configuration from ${ENV_FILE}.bak${NC}"
  fi
fi

# Clean up
rm "$TEST_FILENAME"
echo -e "${BLUE}Temporary test file deleted${NC}"
