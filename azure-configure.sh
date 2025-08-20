#!/bin/bash

echo "=== CampusPe Azure Configuration Script ==="
echo "This script helps configure your Azure App Service settings"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Your Azure App Service details
API_APP_NAME="campuspe-api-staging-hmfjgud5c6a7exe9"
WEB_APP_NAME="campuspe-web-staging-erd8dvb3ewcjc5g2"
RESOURCE_GROUP="CampusPe_Staging_group"

echo -e "${BLUE}📋 Azure App Service Configuration:${NC}"
echo "  API App: $API_APP_NAME"
echo "  Web App: $WEB_APP_NAME"
echo "  Resource Group: $RESOURCE_GROUP"
echo

# Function to check Azure CLI
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        echo -e "${RED}❌ Azure CLI not found. Please install it first.${NC}"
        echo "   Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    echo -e "${GREEN}✅ Azure CLI found${NC}"
}

# Function to check login status
check_azure_login() {
    if ! az account show &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not logged into Azure. Please login:${NC}"
        echo "   az login"
        exit 1
    fi
    echo -e "${GREEN}✅ Azure login verified${NC}"
    SUBSCRIPTION=$(az account show --query name -o tsv)
    echo "   Using subscription: $SUBSCRIPTION"
}

# Function to set startup commands
set_startup_commands() {
    echo -e "${BLUE}🔧 Setting startup commands...${NC}"
    
    # Set API startup command
    echo "Setting API startup command to: startup.sh"
    az webapp config set --resource-group "$RESOURCE_GROUP" --name "$API_APP_NAME" --startup-file "startup.sh"
    
    # Set Web startup command
    echo "Setting Web startup command to: startup.js"
    az webapp config set --resource-group "$RESOURCE_GROUP" --name "$WEB_APP_NAME" --startup-file "startup.js"
    
    echo -e "${GREEN}✅ Startup commands configured${NC}"
}

# Function to set app settings
set_app_settings() {
    echo -e "${BLUE}🔧 Setting application settings...${NC}"
    
    # API App Settings
    echo "Configuring API application settings..."
    az webapp config appsettings set --resource-group "$RESOURCE_GROUP" --name "$API_APP_NAME" --settings \
        NODE_ENV=production \
        PORT=8080 \
        HOST=0.0.0.0 \
        WEBSITE_NODE_DEFAULT_VERSION=~20
    
    # Web App Settings
    echo "Configuring Web application settings..."
    az webapp config appsettings set --resource-group "$RESOURCE_GROUP" --name "$WEB_APP_NAME" --settings \
        NODE_ENV=production \
        PORT=8080 \
        HOST=0.0.0.0 \
        WEBSITE_NODE_DEFAULT_VERSION=~20
    
    echo -e "${GREEN}✅ Application settings configured${NC}"
}

# Function to restart apps
restart_apps() {
    echo -e "${BLUE}🔄 Restarting applications...${NC}"
    
    echo "Restarting API application..."
    az webapp restart --resource-group "$RESOURCE_GROUP" --name "$API_APP_NAME"
    
    echo "Restarting Web application..."
    az webapp restart --resource-group "$RESOURCE_GROUP" --name "$WEB_APP_NAME"
    
    echo -e "${GREEN}✅ Applications restarted${NC}"
}

# Function to show deployment status
show_status() {
    echo -e "${BLUE}📊 Deployment Status:${NC}"
    echo
    
    # API Status
    API_URL="https://$API_APP_NAME.southindia-01.azurewebsites.net"
    echo "API Application: $API_URL"
    if curl -s --max-time 10 --head "$API_URL" > /dev/null; then
        echo -e "  Status: ${GREEN}✅ RESPONDING${NC}"
        STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_URL")
        echo "  HTTP Status: $STATUS_CODE"
    else
        echo -e "  Status: ${RED}❌ NOT RESPONDING${NC}"
    fi
    
    echo
    
    # Web Status
    WEB_URL="https://$WEB_APP_NAME.southindia-01.azurewebsites.net"
    echo "Web Application: $WEB_URL"
    if curl -s --max-time 10 --head "$WEB_URL" > /dev/null; then
        echo -e "  Status: ${GREEN}✅ RESPONDING${NC}"
        STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$WEB_URL")
        echo "  HTTP Status: $STATUS_CODE"
    else
        echo -e "  Status: ${RED}❌ NOT RESPONDING${NC}"
    fi
    
    echo
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Check application logs:"
    echo "   az webapp log tail --resource-group $RESOURCE_GROUP --name $API_APP_NAME"
    echo "   az webapp log tail --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME"
    echo "2. Deploy new code using Git or zip deployment"
    echo "3. Monitor health endpoints:"
    echo "   $API_URL/health"
    echo "   $WEB_URL/health"
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 To view logs, run these commands:${NC}"
    echo "API Logs:"
    echo "  az webapp log tail --resource-group $RESOURCE_GROUP --name $API_APP_NAME"
    echo
    echo "Web Logs:"
    echo "  az webapp log tail --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME"
    echo
    echo "Or view in Azure Portal:"
    echo "  https://portal.azure.com/#@/resource/subscriptions/[subscription-id]/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$API_APP_NAME/logStream"
    echo "  https://portal.azure.com/#@/resource/subscriptions/[subscription-id]/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME/logStream"
}

# Main execution
echo -e "${BLUE}🚀 Starting Azure configuration...${NC}"

check_azure_cli
check_azure_login

echo
read -p "Do you want to configure startup commands? (y/N): " configure_startup
if [[ $configure_startup =~ ^[Yy]$ ]]; then
    set_startup_commands
fi

echo
read -p "Do you want to configure application settings? (y/N): " configure_settings
if [[ $configure_settings =~ ^[Yy]$ ]]; then
    set_app_settings
fi

echo
read -p "Do you want to restart the applications? (y/N): " restart_apps_prompt
if [[ $restart_apps_prompt =~ ^[Yy]$ ]]; then
    restart_apps
    
    echo
    echo -e "${YELLOW}⏳ Waiting 60 seconds for apps to restart...${NC}"
    sleep 60
fi

echo
show_status
echo
show_logs

echo
echo -e "${GREEN}✅ Azure configuration complete!${NC}"
echo -e "${BLUE}🔗 Your applications:${NC}"
echo "  API: https://$API_APP_NAME.southindia-01.azurewebsites.net"
echo "  Web: https://$WEB_APP_NAME.southindia-01.azurewebsites.net"
