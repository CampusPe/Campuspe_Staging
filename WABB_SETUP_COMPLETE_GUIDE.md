# Complete WABB WhatsApp Integration Guide

## 🔧 Bug Fix Applied

**Issue:** 500 Internal Server Error when sharing resume on WhatsApp
**Root Cause:** Using `fetch()` which is not available in Node.js by default
**Solution:** Replaced with `axios` HTTP client + added comprehensive error logging

## 📱 Step-by-Step WABB Setup Guide

### Step 1: Access WABB Dashboard

1. Login to your WABB account at https://wabb.in
2. Navigate to "Automation" → "Webhooks"
3. Click "Create New Webhook"

### Step 2: Create Webhook Endpoint

```
Webhook URL: https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXygjq9/
Method: POST
Content-Type: application/json
```

### Step 3: Set Up Automation Flow

#### **Trigger Configuration:**

```yaml
Name: Resume Document Sender
Trigger: Webhook receives POST request
Webhook URL: /catch/220/ORlQYXygjq9/
```

#### **Action 1: Extract Phone Number**

```yaml
Type: Variable Assignment
Variable Name: phone_number
Source: Webhook payload → number field
Example: "919156621088"
```

#### **Action 2: Extract Document URL**

```yaml
Type: Variable Assignment
Variable Name: document_url
Source: Webhook payload → document field
Example: "https://your-domain.com/api/generated-resume/download-public/resume-123"
```

#### **Action 3: Create/Update Contact**

```yaml
Type: Contact Management
Action: Create or Update
Phone Number: { { phone_number } }
Name: CampusPe User (Auto-generated)
```

#### **Action 4: Send WhatsApp Document**

```yaml
Type: Send Message
Message Type: Document
Recipient: { { phone_number } }
Document URL: { { document_url } }
Caption: |
  🎉 *Your Tailored Resume is Ready!*

  📄 This resume has been customized based on the job requirements you provided.

  💼 *Next Steps:*
  • Download and review your resume
  • Apply to the job position
  • Update your CampusPe profile for better matches

  🚀 Best of luck with your application!
  🔗 CampusPe.com
```

### Step 4: Test Your Webhook

#### **Test Payload:**

```json
{
  "number": "919156621088",
  "document": "https://your-domain.com/api/generated-resume/download-public/test-resume-123"
}
```

#### **Expected Response:**

```json
{
  "success": true,
  "message": "Document sent successfully",
  "recipient": "919156621088"
}
```

## 🛠️ Backend Integration

### **Fixed API Endpoint:**

```typescript
// File: /apps/api/src/routes/generated-resume.ts
POST /api/generated-resume/wabb-send-document

// Request Body:
{
  "resumeId": "resume-123",
  "number": "919156621088"
}

// What it does:
1. Validates resume exists and is completed
2. Generates public download URL
3. Sends webhook to WABB with {number, document}
4. Tracks share analytics in database
5. Returns success/error response
```

### **Environment Variables:**

```bash
# Add to your .env file
API_BASE_URL=https://your-domain.com
WABB_WEBHOOK_URL=https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXygjq9/
```

## 🧪 Testing Guide

### **Step 1: Test Resume Generation**

```bash
# 1. Start your API server
cd apps/api
npm run dev

# 2. Generate a test resume (use your frontend or API directly)
curl -X POST http://localhost:3001/api/ai-resume/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"jobDescription": "Software Engineer role requiring JavaScript and React"}'

# 3. Note the resumeId from the response
```

### **Step 2: Test WABB Integration**

```bash
# Test the WABB endpoint directly
curl -X POST http://localhost:3001/api/generated-resume/wabb-send-document \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "YOUR_RESUME_ID",
    "number": "919156621088"
  }'

# Expected response:
{
  "success": true,
  "message": "Resume sent successfully via WhatsApp",
  "data": {
    "resumeId": "YOUR_RESUME_ID",
    "phoneNumber": "919156621088",
    "documentUrl": "https://your-domain.com/api/generated-resume/download-public/YOUR_RESUME_ID",
    "fileName": "resume_tailored_2025.pdf"
  }
}
```

### **Step 3: Verify Frontend Integration**

```javascript
// In your browser console, test the frontend:
// 1. Generate a resume through the UI
// 2. Open Resume History
// 3. Click "Share WhatsApp" on any resume
// 4. Enter your phone number (with country code)
// 5. Click "Share Resume"
// 6. Check browser console for any errors
// 7. Check your WhatsApp for the document
```

## 🔍 Debugging Guide

### **Common Issues & Solutions:**

#### **1. 500 Internal Server Error**

```bash
# Check server logs for detailed error:
# Look for console.log messages starting with 📱, 📞, 📄, 🔗

# Common causes:
- axios not installed: npm install axios
- GeneratedResume model not found
- Database connection issues
- Invalid resumeId
```

#### **2. Resume Not Found**

```bash
# Verify resume exists in database:
db.generatedresumes.findOne({resumeId: "YOUR_RESUME_ID"})

# Check if resume status is 'completed':
db.generatedresumes.findOne({resumeId: "YOUR_RESUME_ID", status: "completed"})
```

#### **3. WABB Webhook Fails**

```bash
# Check WABB webhook logs in your dashboard
# Common issues:
- Webhook URL incorrect
- Document URL not accessible
- Phone number format wrong (should be numbers only)
- WABB automation not active
```

#### **4. Public Download URL Not Working**

```bash
# Test public download URL:
curl -I https://your-domain.com/api/generated-resume/download-public/YOUR_RESUME_ID

# Should return 200 OK with Content-Type: application/pdf
```

### **Debug Logs to Check:**

```javascript
// Backend logs (check console):
📱 WABB Send Document Request: {resumeId, number}
📞 Sending to phone: 919156621088
📄 Resume: resume_tailored_2025.pdf
🔗 Download URL: https://your-domain.com/api/...
✅ WABB webhook successful
❌ WABB webhook error: [error details]

// Frontend logs (check browser console):
Error sharing on WhatsApp: AxiosError
// Look for response.data.message for specific error
```

## 📊 Monitoring & Analytics

### **Database Tracking:**

```javascript
// Check share analytics:
db.generatedresumes.findOne(
  {resumeId: "YOUR_RESUME_ID"},
  {
    whatsappSharedCount: 1,
    whatsappRecipients: 1,
    lastSharedAt: 1
  }
)

// Expected output:
{
  whatsappSharedCount: 1,
  whatsappRecipients: [
    {
      phoneNumber: "919156621088",
      sharedAt: ISODate("2025-08-06T..."),
      status: "sent"
    }
  ],
  lastSharedAt: ISODate("2025-08-06T...")
}
```

### **WABB Dashboard Monitoring:**

- Check "Automation Logs" for webhook executions
- Monitor "Message Status" for delivery confirmations
- View "Analytics" for usage statistics

## 🚀 Production Deployment Checklist

- [ ] **Environment Variables Set:** API_BASE_URL, WABB_WEBHOOK_URL
- [ ] **HTTPS Enabled:** Required for WABB webhooks
- [ ] **Database Indexes:** GeneratedResume collection properly indexed
- [ ] **Rate Limiting:** Implement for public download URLs
- [ ] **Error Monitoring:** Set up logging for webhook failures
- [ ] **WABB Webhook Active:** Automation flow enabled and tested
- [ ] **Phone Number Validation:** Frontend validates phone format
- [ ] **File Cleanup:** Implement periodic cleanup of old files

## 🎯 Success Verification

Your integration is working correctly when:

1. ✅ **Resume generates** without errors
2. ✅ **Frontend shows** resume in history with download/share options
3. ✅ **WhatsApp share** completes without 500 errors
4. ✅ **WABB receives** webhook with correct number and document URL
5. ✅ **WhatsApp message** delivers with resume document
6. ✅ **Analytics update** in database (share count increases)
7. ✅ **Public URL works** (document downloads successfully)

## 📞 Support

If you continue to face issues:

1. **Check server logs** for detailed error messages
2. **Test each component** individually (resume generation → public URL → WABB webhook)
3. **Verify WABB automation** is active and correctly configured
4. **Test with different phone numbers** to rule out recipient issues
5. **Monitor WABB dashboard** for webhook execution logs

The integration should now work seamlessly! 🎉
