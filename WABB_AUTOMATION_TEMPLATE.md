# WABB Automation Flow Template

## 🎯 Automation Name: CampusPe Resume Sender

### **Trigger Settings:**

```yaml
Type: Webhook
Method: POST
URL Path: /catch/220/ORlQYXygjq9/
Content-Type: application/json
```

### **Expected Webhook Payload:**

```json
{
  "number": "919156621088",
  "document": "https://your-domain.com/api/generated-resume/download-public/resume-123"
}
```

---

## 📋 Automation Steps

### **Step 1: Initialize Variables**

```yaml
Action: Set Variables
Variables:
  - phone_number: { { webhook.number } }
  - document_url: { { webhook.document } }
  - user_name: "CampusPe User"
```

### **Step 2: Validate Input**

```yaml
Action: Condition Check
If: phone_number exists AND document_url exists
Then: Continue to Step 3
Else: End with error log
```

### **Step 3: Format Phone Number**

```yaml
Action: Text Processing
Variable: clean_phone
Operation: Remove all non-numeric characters
Input: { { phone_number } }
Output: Clean phone number (e.g., 919156621088)
```

### **Step 4: Create/Update Contact**

```yaml
Action: Contact Management
Type: Create or Update Contact
Phone: { { clean_phone } }
Name: { { user_name } }
Tags: ["CampusPe", "Resume", "Automated"]
```

### **Step 5: Send Resume Document**

```yaml
Action: Send WhatsApp Message
Type: Document
To: { { clean_phone } }
Document URL: { { document_url } }
Caption: |
  🎉 *Your Tailored Resume is Ready!*

  📄 This resume has been customized specifically for the job you're interested in.

  💼 *What's included:*
  • Optimized keywords for the job
  • Highlighted relevant experience
  • Professional formatting
  • ATS-friendly design

  📥 *Instructions:*
  1. Download the resume
  2. Review the content
  3. Apply to the job position

  🚀 *Best of luck with your application!*

  🔗 Get more opportunities at CampusPe.com
```

### **Step 6: Log Success**

```yaml
Action: Create Log Entry
Level: INFO
Message: "Resume sent successfully to {{clean_phone}}"
Data:
  - phone: { { clean_phone } }
  - document: { { document_url } }
  - timestamp: { { current_time } }
```

### **Step 7: Update Analytics (Optional)**

```yaml
Action: Webhook Call
URL: https://your-domain.com/api/analytics/whatsapp-sent
Method: POST
Body:
  phone: { { clean_phone } }
  type: "resume_document"
  status: "delivered"
```

---

## 🔧 Error Handling

### **On Document Download Failure:**

```yaml
Action: Send WhatsApp Message
Type: Text
To: { { clean_phone } }
Message: |
  ❌ *Resume Delivery Failed*

  Sorry, there was an issue sending your resume document.

  💡 *Alternative options:*
  • Visit CampusPe.com to download
  • Contact support for assistance

  We apologize for the inconvenience! 🙏
```

### **On Invalid Phone Number:**

```yaml
Action: Create Log Entry
Level: ERROR
Message: "Invalid phone number: {{phone_number}}"
```

---

## 📊 Testing Configuration

### **Test Webhook Payload:**

```json
{
  "number": "YOUR_WHATSAPP_NUMBER",
  "document": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
}
```

### **Test Steps:**

1. **Save automation** in WABB dashboard
2. **Activate automation** (make sure it's enabled)
3. **Send test webhook** using above payload
4. **Check WhatsApp** for document message
5. **Verify logs** in WABB dashboard
6. **Test with real resume** from your application

---

## ⚙️ Advanced Settings

### **Rate Limiting:**

- Max 10 messages per minute per phone number
- Queue excess requests

### **Retry Logic:**

- Retry failed sends up to 3 times
- Wait 30 seconds between retries

### **Business Hours:**

- Optional: Only send between 9 AM - 9 PM
- Queue night messages for next morning

### **Blacklist Check:**

- Optional: Check if number opted out
- Skip sending if blacklisted

---

## 🎯 Success Criteria

Your automation is working correctly when:

✅ **Webhook receives** POST request with number and document
✅ **Variables extracted** correctly from payload
✅ **Contact created/updated** in WABB
✅ **Document message sent** to WhatsApp
✅ **User receives** resume document
✅ **Logs show** successful execution
✅ **No error messages** in WABB dashboard

---

## 📞 Quick Setup Commands

### **Create Webhook in WABB:**

1. Go to Automation → Webhooks
2. Click "New Webhook"
3. Copy the URL: `https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXygjq9/`
4. Set Method: POST
5. Save webhook

### **Test Webhook:**

```bash
curl -X POST "https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXygjq9/" \
  -H "Content-Type: application/json" \
  -d '{"number":"YOUR_PHONE","document":"https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}'
```

### **Monitor Execution:**

- Check "Automation Logs" in WABB dashboard
- Look for successful webhook executions
- Verify message delivery status

The automation should now work seamlessly with your resume sharing feature! 🎉
