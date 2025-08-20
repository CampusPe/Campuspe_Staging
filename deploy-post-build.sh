#!/bin/bash
echo "🚀 Starting Azure post-build deployment script..."

# Navigate to the deployment root
cd $DEPLOYMENT_TARGET

echo "📁 Current directory: $(pwd)"
echo "📋 Directory contents:"
ls -la

# Build the TypeScript application if source exists
if [ -d "apps/api/src" ]; then
    echo "🔨 Building TypeScript application..."
    npm run build
    
    # Check if build was successful
    if [ -f "apps/api/dist/app.js" ]; then
        echo "✅ TypeScript build successful"
    else
        echo "❌ TypeScript build failed"
        exit 1
    fi
else
    echo "ℹ️  No TypeScript source found, assuming pre-built artifacts"
fi

# Install only production dependencies
echo "📦 Installing production dependencies..."
npm ci --omit=dev

echo "✅ Post-build deployment completed successfully!"

# Set the correct startup file
echo "⚙️  Configuring startup..."
echo "Using startup.sh for application start"
