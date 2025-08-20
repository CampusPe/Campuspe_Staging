#!/bin/bash

# Quick Azure PDF Service Deployment Script
# This script will quickly deploy the Azure PDF service using Azure Container Instances

set -e

echo "🚀 Quick Azure PDF Service Deployment..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login check
if ! az account show &> /dev/null; then
    echo "🔐 Please login to Azure CLI first:"
    az login
fi

# Configuration
RESOURCE_GROUP="campuspe-pdf-service-rg"
CONTAINER_NAME="campuspe-pdf-service"
LOCATION="eastus"
IMAGE_NAME="campuspe-pdf-service:latest"
DNS_NAME="campuspe-pdf-$(date +%s)"

echo "📋 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Container Name: $CONTAINER_NAME"
echo "  Location: $LOCATION"
echo "  DNS Name: $DNS_NAME"

# Create resource group if it doesn't exist
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Build and push to Azure Container Registry (if ACR exists) or use local build
echo "🏗️ Building Docker image..."
cd /Users/premthakare/Desktop/Campuspe_Staging/azure-pdf-service

# Build the image locally first
docker build -t $IMAGE_NAME .

# Try to find existing ACR or create a new one
ACR_NAME="campuspepdfacr"
echo "🔍 Checking for Azure Container Registry..."

if ! az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "📦 Creating Azure Container Registry..."
    az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true
    
    # Wait for ACR to be ready
    echo "⏳ Waiting for ACR to be ready..."
    sleep 30
fi

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)
echo "🏷️ ACR Login Server: $ACR_LOGIN_SERVER"

# Tag and push image
FULL_IMAGE_NAME="$ACR_LOGIN_SERVER/$IMAGE_NAME"
docker tag $IMAGE_NAME $FULL_IMAGE_NAME

echo "🔐 Logging into ACR..."
az acr login --name $ACR_NAME

echo "📤 Pushing image to ACR..."
docker push $FULL_IMAGE_NAME

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)

# Deploy to Azure Container Instances
echo "🚀 Deploying to Azure Container Instances..."
az container create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --image $FULL_IMAGE_NAME \
  --cpu 1 \
  --memory 2 \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label $DNS_NAME \
  --ports 3000 \
  --environment-variables NODE_ENV=production \
  --restart-policy Always

# Get the container's FQDN
CONTAINER_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --query ipAddress.fqdn --output tsv)

echo "✅ Deployment complete!"
echo "🌐 Service URL: http://$CONTAINER_FQDN:3000"
echo "🔗 Health Check: http://$CONTAINER_FQDN:3000/health"

# Test the deployment
echo "🧪 Testing deployment..."
sleep 30  # Wait for container to start

if curl -f "http://$CONTAINER_FQDN:3000/health" &> /dev/null; then
    echo "✅ Service is healthy and responding!"
    echo ""
    echo "📝 Add this to your Azure App Service environment variables:"
    echo "AZURE_PDF_SERVICE_URL=http://$CONTAINER_FQDN:3000"
    echo ""
    echo "🔧 Or use Azure CLI to set it:"
    echo "az webapp config appsettings set --resource-group YOUR_APP_RG --name YOUR_APP_NAME --settings AZURE_PDF_SERVICE_URL=http://$CONTAINER_FQDN:3000"
else
    echo "⚠️ Service health check failed. Check the container logs:"
    echo "az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME"
fi

echo ""
echo "🎉 Azure PDF Service deployment complete!"
echo "   Service URL: http://$CONTAINER_FQDN:3000"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Container Name: $CONTAINER_NAME"
