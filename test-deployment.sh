#!/bin/bash

# Test deployment package creation
echo "🧪 Testing deployment package creation..."

# Clean up previous test
rm -rf test-deployment-package

# Create test deployment package
mkdir test-deployment-package

echo "=== Apps/web structure ==="
ls -la apps/web/

# Copy using the same method as the workflow
cd apps/web
cp -r . ../../test-deployment-package/
cd ../..

echo "=== Test deployment package structure ==="
ls -la test-deployment-package/

# Check if .next directory exists
if [ ! -d "test-deployment-package/.next" ]; then
    echo "❌ Error: .next directory not found!"
    exit 1
fi

echo "✅ .next directory found successfully"
echo "📦 Test deployment package contents:"
ls -la test-deployment-package/

# Clean up
rm -rf test-deployment-package

echo "🎉 Test completed successfully!"
