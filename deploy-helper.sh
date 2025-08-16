#!/bin/bash

# CampusPe Deployment Helper Script
# This script helps with manual deployment and verification

set -e

echo "🚀 CampusPe Deployment Helper"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    print_error "Please run this script from the root of the CampusPe project"
    exit 1
fi

print_status "Found CampusPe project structure"

# Function to test local builds
test_builds() {
    echo -e "\n${BLUE}🔨 Testing Local Builds${NC}"
    echo "========================"
    
    # Test API build
    print_info "Testing API build..."
    cd apps/api
    if npm run build; then
        print_status "API build successful"
    else
        print_error "API build failed"
        exit 1
    fi
    cd ../..
    
    # Test Web build
    print_info "Testing Web build..."
    cd apps/web
    if npm run build; then
        print_status "Web build successful"
    else
        print_error "Web build failed"
        exit 1
    fi
    cd ../..
}

# Function to check Azure deployment status
check_deployments() {
    echo -e "\n${BLUE}🌐 Checking Deployment Status${NC}"
    echo "==============================="
    
    # Check API health
    print_info "Checking API health..."
    if curl -s -f "https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/health" > /dev/null 2>&1; then
        print_status "API is responding"
    else
        print_warning "API is not responding or health endpoint not available"
    fi
    
    # Check Web frontend
    print_info "Checking Web frontend..."
    if curl -s -f "https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net" > /dev/null 2>&1; then
        print_status "Web frontend is responding"
    else
        print_warning "Web frontend is not responding"
    fi
}

# Function to trigger GitHub Actions
trigger_deployments() {
    echo -e "\n${BLUE}🚀 GitHub Actions Status${NC}"
    echo "========================"
    
    print_info "To trigger deployments manually:"
    echo "1. Go to: https://github.com/CampusPe/Campuspe_Staging/actions"
    echo "2. Select the workflow you want to run"
    echo "3. Click 'Run workflow' and select the 'main' branch"
    echo ""
    print_info "Automatic triggers:"
    echo "• Web deployment: Push changes to apps/web/"
    echo "• API deployment: Push changes to apps/api/"
}

# Function to show deployment URLs
show_urls() {
    echo -e "\n${BLUE}🌐 Deployment URLs${NC}"
    echo "=================="
    echo "Frontend: https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"
    echo "API:      https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
    echo ""
    echo "GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
    echo "Azure Portal:   https://portal.azure.com"
}

# Main menu
echo ""
echo "What would you like to do?"
echo "1. Test local builds"
echo "2. Check deployment status"
echo "3. Show deployment URLs"
echo "4. Show GitHub Actions info"
echo "5. All of the above"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        test_builds
        ;;
    2)
        check_deployments
        ;;
    3)
        show_urls
        ;;
    4)
        trigger_deployments
        ;;
    5)
        test_builds
        check_deployments
        show_urls
        trigger_deployments
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_status "Deployment helper completed!"
echo ""
print_info "For more information, see AZURE_DEPLOYMENT_GUIDE.md"
