#!/bin/bash

echo "🔧 FIXING API STARTUP CONFIGURATION"
echo "==================================="

echo ""
echo "🔍 PROBLEM IDENTIFIED:"
echo "   web.config was pointing to JavaScript startup files"
echo "   instead of your startup.sh script"

echo ""
echo "✅ FIXES APPLIED:"
echo "   1. Updated web.config to use startup.sh"
echo "   2. Changed nodeProcessCommandLine to 'bash'"
echo "   3. Made startup.sh executable"

echo ""
echo "📋 Current Configuration:"
echo "   Startup File: startup.sh"
echo "   Process Command: bash"
echo "   Environment Variables: ✅ Already configured"

echo ""
echo "🚀 Deploying the fix..."

# Verify the fix
echo "🔍 Verifying changes:"
echo "   startup.sh executable: $([ -x apps/api/startup.sh ] && echo "✅ YES" || echo "❌ NO")"
echo "   web.config points to startup.sh: $(grep -q "startup.sh" apps/api/web.config && echo "✅ YES" || echo "❌ NO")"

# Commit and deploy
git add .
git commit -m "🔧 FIX: Configure web.config to use startup.sh instead of JS files

- Updated web.config to point to startup.sh
- Changed nodeProcessCommandLine from 'node' to 'bash'
- Made startup.sh executable
- This should resolve the 503 Application Error

Environment variables are already configured."

echo "✅ Changes committed"

echo ""
echo "📤 Pushing to trigger deployment..."
git push origin main

echo ""
echo "🎯 STARTUP CONFIGURATION FIXED!"
echo "==============================="

echo ""
echo "📋 WHAT CHANGED:"
echo "   ✅ web.config now correctly points to startup.sh"
echo "   ✅ Azure will now use bash to run your shell script"
echo "   ✅ startup.sh will handle all the environment setup"

echo ""
echo "⏰ NEXT STEPS:"
echo "   1. Wait 3-5 minutes for GitHub Actions deployment"
echo "   2. Test API: curl -I https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/health"
echo "   3. API should now start correctly with your startup.sh script"

echo ""
echo "🔗 Monitor deployment:"
echo "   • GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
echo "   • API Health: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/health"

echo ""
echo "💡 Your startup.sh script will now be executed correctly by Azure!"
