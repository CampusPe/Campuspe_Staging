# Bunny.net Cloud Storage Setup Guide for CampusPe

## 🐰 Why Bunny.net?

Bunny.net is chosen for PDF storage because:

- ✅ **Global CDN**: Fast downloads worldwide
- ✅ **Cost-effective**: Cheaper than AWS S3/Google Cloud
- ✅ **Simple API**: Easy integration and management
- ✅ **Reliable**: 99.9% uptime guarantee
- ✅ **GDPR Compliant**: European data protection standards

## 🚀 Step-by-Step Setup

### Step 1: Create Bunny.net Account

1. Go to https://bunny.net
2. Click "Get Started" and create your account
3. Verify your email address
4. Log into your dashboard

### Step 2: Create Storage Zone

1. In the Bunny.net dashboard, go to **"Storage"** → **"Storage Zones"**
2. Click **"Add Storage Zone"**
3. Configure your storage zone:
   ```
   Zone Name: campuspe-resumes
   Region: Choose closest to your users (e.g., US East, Europe)
   Replication: Enable for better availability (optional)
   ```
4. Click **"Add Storage Zone"**
5. **Note down the Storage Zone Name** (e.g., `campuspe-resumes`)

### Step 3: Get Access Key

1. In your storage zone, go to **"FTP & API Access"**
2. Click **"Generate Password"** to create an access key
3. **Copy and save** the generated password/access key
4. This will be your `BUNNY_STORAGE_ACCESS_KEY`

### Step 4: Set Up CDN (Pull Zone)

1. Go to **"CDN"** → **"Pull Zones"**
2. Click **"Add Pull Zone"**
3. Configure the CDN:
   ```
   Name: campuspe-resumes-cdn
   Origin URL: Leave empty (we'll use storage)
   ```
4. After creation, go to the pull zone settings
5. In **"Origin"** tab, select **"Connect Storage Zone"**
6. Choose your storage zone: `campuspe-resumes`
7. **Note down the CDN URL** (e.g., `https://campuspe-resumes.b-cdn.net`)

### Step 5: Configure Environment Variables

Add to your `/apps/api/.env` file:

```bash
# Bunny.net Cloud Storage Configuration
BUNNY_STORAGE_ZONE_NAME=campuspe-resumes
BUNNY_STORAGE_ACCESS_KEY=your-generated-access-key-here
BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com
BUNNY_CDN_URL=https://campuspe-resumes.b-cdn.net

# API Base URL (for fallback downloads)
API_BASE_URL=https://your-domain.com
```

### Step 6: Test the Configuration

```bash
# Start your API server
cd apps/api
npm run dev

# Test Bunny.net connection
curl http://localhost:5001/api/generated-resume/test-bunny-storage

# Expected response:
{
  "success": true,
  "message": "Bunny.net storage test completed",
  "data": {
    "connection": {
      "success": true,
      "message": "Bunny.net connection successful"
    },
    "configuration": {
      "configured": true,
      "storageZone": "campuspe-resumes",
      "cdnUrl": "https://campuspe-resumes.b-cdn.net"
    }
  }
}
```

## 📁 Storage Structure

Your PDFs will be organized in Bunny.net as follows:

```
campuspe-resumes/
├── resumes/
│   ├── resume_1691234567_abc123def/
│   │   └── tailored_resume_software_engineer.pdf
│   ├── resume_1691234789_xyz789abc/
│   │   └── tailored_resume_data_scientist.pdf
│   └── ...
└── test/
    └── connection_test_files
```

## 🔗 How It Works

### **PDF Upload Flow:**

1. **User generates resume** → AI creates PDF in memory
2. **Upload to Bunny.net** → PDF uploaded to cloud storage
3. **Save to database** → Resume record with cloud URL stored
4. **WhatsApp sharing** → Direct cloud URL sent (faster)
5. **Download requests** → Served from cloud (faster, no server load)

### **Fallback Strategy:**

- **Primary**: Bunny.net cloud storage (fast, reliable)
- **Fallback**: Local server storage (if cloud fails)
- **Cache**: Base64 in database (for small files, fastest)

### **URL Structure:**

```
Direct Cloud URL: https://campuspe-resumes.b-cdn.net/resumes/resume_123/file.pdf
API Fallback URL: https://your-domain.com/api/generated-resume/download-public/resume_123
```

## 💰 Pricing Information

**Bunny.net Storage Pricing (as of 2025):**

- Storage: $0.01 per GB per month
- Bandwidth: $0.01 per GB (first 500GB free monthly)
- API Requests: $0.40 per million requests

**Example Costs:**

- 1,000 resumes (1MB each) = 1GB storage = $0.01/month
- 10,000 downloads = 10GB bandwidth = $0.10
- Very cost-effective for typical usage!

## 🔧 Advanced Configuration

### **Custom Domain (Optional):**

1. In your pull zone settings, go to **"Hostnames"**
2. Add your custom domain: `resumes.your-domain.com`
3. Update DNS CNAME record: `resumes → campuspe-resumes.b-cdn.net`
4. Update `BUNNY_CDN_URL=https://resumes.your-domain.com`

### **Security Settings:**

```bash
# Enable hotlink protection (optional)
# In pull zone → Security → Hotlink Protection
# Add allowed domains: your-domain.com, api.your-domain.com

# Token authentication (optional, for extra security)
# In pull zone → Security → Token Authentication
# Generate token and update code accordingly
```

### **Performance Optimization:**

```bash
# Enable Gzip compression
# In pull zone → Optimization → Compression → Enable

# Cache settings
# In pull zone → Caching → Cache Expiry
# Set to 1 month for PDFs (they don't change)

# Geographic replication
# In storage zone → Enable replication for faster global access
```

## 🧪 Testing Checklist

### **1. Connection Test:**

```bash
curl http://localhost:5001/api/generated-resume/test-bunny-storage
```

### **2. Upload Test:**

```bash
# Generate a resume through your app
# Check if cloudUrl is populated in database:
db.generatedresumes.findOne({}, {cloudUrl: 1, fileName: 1})
```

### **3. Download Test:**

```bash
# Test direct cloud URL access
curl -I "https://campuspe-resumes.b-cdn.net/resumes/resume_123/file.pdf"
# Should return 200 OK with Content-Type: application/pdf
```

### **4. WhatsApp Test:**

```bash
# Use WABB endpoint with a real resume
curl -X POST http://localhost:5001/api/generated-resume/wabb-send-document \
  -H "Content-Type: application/json" \
  -d '{"resumeId":"REAL_RESUME_ID","number":"YOUR_PHONE"}'

# Check WhatsApp for document with direct cloud URL
```

## 🐛 Troubleshooting

### **"Bunny.net storage not configured" Error:**

- Check all environment variables are set correctly
- Restart your API server after updating .env
- Verify no extra spaces in environment variable values

### **"Connection test failed" Error:**

- Verify access key is correct (regenerate if needed)
- Check storage zone name matches exactly
- Ensure your Bunny.net account is active

### **"Upload failed" Error:**

- Check storage zone exists and is active
- Verify access key has write permissions
- Check file size (Bunny.net has upload limits)

### **PDF Not Accessible:**

- Ensure pull zone is connected to storage zone
- Check CDN URL is correct
- Verify file was uploaded successfully
- Test with `curl -I` to check headers

### **WhatsApp Document Not Sending:**

- Verify URL is publicly accessible
- Check WABB webhook logs
- Ensure document URL returns proper Content-Type
- Test URL in browser first

## 📊 Monitoring & Analytics

### **Storage Usage:**

- Monitor through Bunny.net dashboard
- Set up billing alerts for usage spikes
- Regular cleanup of old/unused files

### **Performance Metrics:**

```javascript
// Track upload success rates
const uploadStats = await GeneratedResume.aggregate([
  {
    $group: {
      _id: null,
      cloudUploads: { $sum: { $cond: ["$cloudUrl", 1, 0] } },
      localFallbacks: { $sum: { $cond: ["$filePath", 1, 0] } },
      total: { $sum: 1 },
    },
  },
]);

// Monitor download sources
const downloadSources = await GeneratedResume.aggregate([
  {
    $group: {
      _id: { $cond: ["$cloudUrl", "cloud", "local"] },
      count: { $sum: 1 },
    },
  },
]);
```

## 🎯 Benefits Achieved

### **For Users:**

- ⚡ **Faster Downloads**: CDN-powered global delivery
- 🌍 **Global Access**: Works from anywhere in the world
- 📱 **Better WhatsApp**: Direct document links (no server load)
- 🔄 **High Availability**: 99.9% uptime guarantee

### **For Your Infrastructure:**

- 💾 **Reduced Server Load**: No file serving from your API
- 💰 **Cost Savings**: Cheaper than traditional cloud storage
- 📈 **Scalability**: Handle millions of files effortlessly
- 🔒 **Backup Strategy**: Files stored independently of your servers

### **For Development:**

- 🛠️ **Easy Integration**: Simple REST API
- 📊 **Better Analytics**: Track usage through Bunny.net dashboard
- 🔧 **Maintenance-Free**: No server storage management
- 🚀 **Performance**: Faster than local file serving

## 🔮 Future Enhancements

1. **Automatic Cleanup**: Delete files older than X days
2. **Smart Caching**: Store frequently accessed files in base64
3. **Geographic Distribution**: Multiple storage zones by region
4. **Advanced Security**: Token-based access for sensitive documents
5. **Analytics Integration**: Track download patterns and optimization

Your resume storage is now cloud-powered and production-ready! 🎉
