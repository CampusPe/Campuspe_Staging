#!/bin/bash

echo "🧪 Testing Deployment Package Structure"
echo "======================================"

# Simulate the deployment package creation
echo "Creating test deployment package..."
rm -rf test-deployment-package
mkdir -p test-deployment-package

# Copy files exactly like the workflow
echo "Copying Next.js application files..."
cp -r apps/web/pages test-deployment-package/
cp -r apps/web/components test-deployment-package/ 2>/dev/null || echo "No components directory"
cp -r apps/web/styles test-deployment-package/ 2>/dev/null || echo "No styles directory"
cp -r apps/web/utils test-deployment-package/ 2>/dev/null || echo "No utils directory"
cp -r apps/web/public test-deployment-package/
cp -r apps/web/.next test-deployment-package/

# Copy configuration files
cp apps/web/package*.json test-deployment-package/
cp apps/web/next.config.js test-deployment-package/ 2>/dev/null || echo "No next.config.js found"

echo ""
echo "✅ Test deployment package structure:"
ls -la test-deployment-package/

echo ""
echo "🔍 Next.js directory verification:"
echo "pages: $(ls -d test-deployment-package/pages 2>/dev/null && echo 'EXISTS ✅' || echo 'MISSING ❌')"
echo ".next: $(ls -d test-deployment-package/.next 2>/dev/null && echo 'EXISTS ✅' || echo 'MISSING ❌')"
echo "public: $(ls -d test-deployment-package/public 2>/dev/null && echo 'EXISTS ✅' || echo 'MISSING ❌')"
echo "package.json: $(ls test-deployment-package/package.json 2>/dev/null && echo 'EXISTS ✅' || echo 'MISSING ❌')"

echo ""
echo "📄 Pages directory contents:"
if [ -d "test-deployment-package/pages" ]; then
    ls -la test-deployment-package/pages/
else
    echo "❌ Pages directory not found!"
fi

# Clean up
rm -rf test-deployment-package

echo ""
echo "🚀 Ready to deploy with fixed structure!"
