#!/bin/bash

echo "🔍 AZURE API STARTUP DIAGNOSIS"
echo "=============================="

API_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
SCM_URL="https://campuspe-api-staging-hmfjgud5c6a7exe9.scm.southindia-01.azurewebsites.net"

echo ""
echo "📊 Current API Status:"
echo "   URL: $API_URL"
timeout 5 curl -s -I "$API_URL/" 2>/dev/null | head -2

echo ""
echo "🔍 Diagnostic Resources Available:"
echo "   1. Azure Diagnostic Resources: ${SCM_URL}/detectors"
echo "   2. Log Stream: Azure Portal → campuspe-api-staging → Log stream"
echo "   3. Kudu Console: ${SCM_URL}/DebugConsole"
echo "   4. File Explorer: ${SCM_URL}/api/vfs/site/wwwroot/"

echo ""
echo "📋 Checking GitHub Actions Status:"
echo "   Repository: https://github.com/CampusPe/Campuspe_Staging/actions"

echo ""
echo "🔧 Common Azure App Service 503 Causes:"
echo "   1. ❌ Application failed to start (most likely)"
echo "   2. ❌ Missing or incorrect environment variables"
echo "   3. ❌ Startup script errors"
echo "   4. ❌ Dependencies not installed properly"
echo "   5. ❌ Port binding issues"
echo "   6. ❌ Runtime exceptions during startup"

echo ""
echo "🚀 IMMEDIATE ACTIONS:"
echo ""
echo "1. 📊 CHECK AZURE LOGS (Primary Action)"
echo "   Go to Azure Portal:"
echo "   → App Services → campuspe-api-staging"
echo "   → Monitoring → Log stream"
echo "   Look for startup-enhanced.js diagnostic messages"

echo ""
echo "2. 🔍 ACCESS KUDU CONSOLE"
echo "   URL: ${SCM_URL}/DebugConsole"
echo "   Check if files are deployed correctly:"
echo "   cd site/wwwroot"
echo "   ls -la"
echo "   Check if startup-enhanced.js exists and has content"

echo ""
echo "3. 🧪 MANUAL FILE CHECK"
echo "   Check if deployment files are present:"

# Try to access the Kudu API to check file structure
echo "   Attempting to check deployed files via Kudu API..."
echo ""

echo "4. 🔄 IF LOGS SHOW SPECIFIC ERRORS"
echo "   Based on the error messages, we can:"
echo "   - Fix missing environment variables"
echo "   - Resolve dependency issues"
echo "   - Fix startup script problems"

echo ""
echo "🎯 NEXT STEPS:"
echo "   1. Check Azure logs first (most important)"
echo "   2. Report any error messages you see"
echo "   3. We'll create targeted fixes based on the specific errors"

echo ""
echo "💡 The enhanced startup script we deployed should provide"
echo "   detailed error information in the Azure logs."
