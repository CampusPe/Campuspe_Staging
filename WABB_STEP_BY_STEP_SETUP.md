# Step-by-Step WABB Setup Guide

## 📋 **Prerequisites**
- WABB.in Business Account
- WhatsApp Business Number
- Your CampusPe API deployed and accessible
- Valid SSL certificate for webhook URLs

---

## 🚀 **Step 1: WABB Account Setup**

### 1.1 Create WABB Account
1. Visit https://wabb.in
2. Click "Sign Up" → Choose "Business Plan"
3. Enter your business details:
   - Business Name: "CampusPe"
   - Industry: "Education Technology"
   - Use Case: "Resume Builder & Job Assistance"

### 1.2 WhatsApp Business Integration
1. Go to WABB Dashboard → "Integrations"
2. Click "Connect WhatsApp Business"
3. Enter your WhatsApp Business phone number
4. Complete verification process
5. Set up business profile:
   - Display Name: "CampusPe Resume Assistant"
   - Description: "AI-Powered Resume Builder"
   - Category: "Education"

---

## 🔧 **Step 2: Configure Webhook Endpoints**

### 2.1 Set Primary Webhook URL
In WABB Dashboard → Settings → Webhooks:
```
Primary Webhook URL: https://your-domain.com/api/wabb-flows/webhook
Method: POST
Headers: 
  - Content-Type: application/json
  - Authorization: Bearer YOUR_WEBHOOK_TOKEN
```

### 2.2 Test Webhook Connectivity
```bash
# Test from WABB dashboard or run this curl command:
curl -X POST https://your-domain.com/api/wabb-flows/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_TOKEN" \
  -d '{
    "phone": "1234567890",
    "message": "test",
    "name": "Test User",
    "type": "general_message",
    "timestamp": "2024-08-18T10:00:00Z"
  }'
```

---

## 🎯 **Step 3: Create WABB Flows**

### 3.1 Create Flow 1: Resume Builder Main

1. **Go to WABB Dashboard → Flows → Create New Flow**

2. **Basic Settings:**
   - Flow Name: `Resume Builder Main`
   - Flow Type: `Keyword Trigger`
   - Status: `Active`

3. **Trigger Configuration:**
   - Trigger Type: `Keyword Match`
   - Keywords: `resume, cv, start, create resume, build resume`
   - Match Type: `Contains`
   - Case Sensitive: `No`

4. **Action 1: Welcome Message**
   - Action Type: `Send Message`
   - Message Text:
   ```
   🎯 *CampusPe AI Resume Builder*

   Hi {{contact_name}}! I'll help you create a professional, job-tailored resume in minutes.

   📋 *What I need from you:*
   1. Your email address
   2. Complete job description

   🚀 *Ready to start?* Reply with your email address.

   ❌ Type 'cancel' anytime to stop.
   ```

5. **Action 2: Set Flow State**
   - Action Type: `Set Contact Attribute`
   - Attribute Name: `resume_flow_step`
   - Attribute Value: `waiting_for_email`

6. **Action 3: Webhook Notification**
   - Action Type: `HTTP Webhook`
   - URL: `https://your-domain.com/api/wabb-flows/webhook`
   - Method: `POST`
   - Headers: `Content-Type: application/json`
   - Payload:
   ```json
   {
     "phone": "{{contact_phone}}",
     "message": "{{message_text}}",
     "name": "{{contact_name}}",
     "type": "resume_start",
     "flow_step": "initiated",
     "timestamp": "{{timestamp}}"
   }
   ```

7. **Save and Activate Flow**

### 3.2 Create Flow 2: Email Collection

1. **Create New Flow:**
   - Flow Name: `Email Collection`
   - Flow Type: `Conditional Flow`
   - Trigger: `When contact attribute 'resume_flow_step' equals 'waiting_for_email'`

2. **Condition: Email Validation**
   - Condition Type: `Regex Match`
   - Field: `{{last_message}}`
   - Regex Pattern: `^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$`
   - If True: Continue to valid email actions
   - If False: Continue to invalid email actions

3. **Valid Email Actions:**

   **Action 1: Confirmation Message**
   ```
   ✅ *Email Confirmed:* {{last_message}}

   📋 *Step 2 of 2:* Now please share the complete job description.

   Paste the entire job posting including:
   • Job title & company
   • Requirements & qualifications
   • Responsibilities
   • Skills needed

   💡 *Tip:* The more details you provide, the better I can tailor your resume!
   ```

   **Action 2: Store Email**
   - Action Type: `Set Contact Attribute`
   - Attribute Name: `user_email`
   - Attribute Value: `{{last_message}}`

   **Action 3: Update Flow Step**
   - Action Type: `Set Contact Attribute`
   - Attribute Name: `resume_flow_step`
   - Attribute Value: `waiting_for_job_description`

   **Action 4: Webhook**
   ```json
   {
     "phone": "{{contact_phone}}",
     "message": "{{last_message}}",
     "name": "{{contact_name}}",
     "type": "email_collected",
     "email": "{{last_message}}",
     "flow_step": "email_confirmed",
     "timestamp": "{{timestamp}}"
   }
   ```

4. **Invalid Email Actions:**
   
   **Action 1: Error Message**
   ```
   ❌ *Invalid Email Format*

   Please provide a valid email address.

   📧 *Example:* john.doe@gmail.com

   🔄 Try again or type 'cancel' to stop.
   ```

### 3.3 Create Flow 3: Job Description Collection

1. **Create New Flow:**
   - Flow Name: `Job Description Collection`
   - Flow Type: `Conditional Flow`
   - Trigger: `When contact attribute 'resume_flow_step' equals 'waiting_for_job_description'`

2. **Condition: Length Validation**
   - Condition Type: `Text Length`
   - Field: `{{last_message}}`
   - Minimum Length: `50`
   - If True: Valid job description flow
   - If False: Invalid job description flow

3. **Valid Description Actions:**

   **Action 1: Processing Message**
   ```
   🚀 *Resume Generation Started!*

   ✅ Email: {{user_email}}
   ✅ Job Description: Received ({{message_length}} characters)

   🤖 *AI is now working on:*
   • Analyzing job requirements
   • Fetching your CampusPe profile
   • Matching skills to job needs
   • Creating tailored content
   • Generating professional PDF

   ⏳ *This takes 30-60 seconds...*

   I'll notify you when it's ready! 📄✨
   ```

   **Action 2: Store Job Description**
   - Attribute Name: `job_description`
   - Attribute Value: `{{last_message}}`

   **Action 3: Update Flow Step**
   - Attribute Name: `resume_flow_step`
   - Attribute Value: `processing`

   **Action 4: Resume Generation Webhook**
   ```json
   {
     "phone": "{{contact_phone}}",
     "email": "{{user_email}}",
     "jobDescription": "{{last_message}}",
     "name": "{{contact_name}}",
     "type": "job_description_collected",
     "timestamp": "{{timestamp}}"
   }
   ```

### 3.4 Create Flow 4: Help & Support

1. **Create New Flow:**
   - Flow Name: `Help & Support`
   - Flow Type: `Keyword Trigger`
   - Keywords: `help, support, assist, how, guide`

2. **Action: Help Message**
   ```
   📖 *CampusPe Resume Builder Help*

   🤖 **Commands:**
   • 'resume' or 'start' - Begin resume creation
   • 'help' - Show this help message
   • 'cancel' or 'stop' - Cancel current process

   📝 **How to use:**
   1️⃣ Type 'resume' to start
   2️⃣ Provide your email address
   3️⃣ Share the complete job description
   4️⃣ Wait 30-60 seconds for AI magic
   5️⃣ Receive your tailored resume!

   ✅ **Requirements:**
   • Valid email address
   • Complete job description (50+ chars)
   • CampusPe profile (recommended)

   🌐 **Create Profile:** CampusPe.com
   📞 **Support:** support@campuspe.com

   🚀 Ready? Type 'resume' to begin!
   ```

### 3.5 Create Flow 5: Cancel/Reset

1. **Create New Flow:**
   - Flow Name: `Cancel Reset`
   - Flow Type: `Keyword Trigger`
   - Keywords: `cancel, stop, reset, quit, exit`

2. **Actions:**

   **Action 1: Reset Message**
   ```
   ❌ *Process Cancelled*

   No worries! You can start again anytime.

   🔄 **Ready to try again?**
   • Type 'resume' to start over
   • Type 'help' for guidance

   😊 We're here whenever you need us!
   ```

   **Action 2: Clear Attributes**
   - Clear these attributes: `resume_flow_step, user_email, job_description`

   **Action 3: Reset Webhook**
   ```json
   {
     "phone": "{{contact_phone}}",
     "message": "{{last_message}}",
     "name": "{{contact_name}}",
     "type": "conversation_reset",
     "timestamp": "{{timestamp}}"
   }
   ```

### 3.6 Create Flow 6: Default Fallback

1. **Create New Flow:**
   - Flow Name: `Default Fallback`
   - Flow Type: `Fallback Flow`
   - Priority: `Lowest`

2. **Action: Welcome Message**
   ```
   👋 *Welcome to CampusPe!*

   Hi {{contact_name}}! I'm your AI Resume Assistant.

   🤖 **What I can do:**
   • Create job-tailored resumes
   • Analyze job requirements
   • Optimize for ATS systems
   • Generate professional PDFs

   🚀 **Get Started:**
   • Type "resume" - Start building
   • Type "help" - Get detailed guide

   🔗 Visit CampusPe.com for more features!
   ```

---

## 🔍 **Step 4: Testing & Validation**

### 4.1 Test Each Flow

1. **Test Resume Flow:**
   ```
   You: "resume"
   Bot: Welcome message + asks for email
   You: "test@example.com"
   Bot: Confirms email + asks for job description
   You: [Paste long job description]
   Bot: Processing message → Resume generation starts
   ```

2. **Test Help Flow:**
   ```
   You: "help"
   Bot: Shows help message with commands
   ```

3. **Test Cancel Flow:**
   ```
   You: "cancel"
   Bot: Cancels process + resets state
   ```

### 4.2 Verify Webhook Logs

1. Check WABB Dashboard → Logs → Webhooks
2. Verify all webhook calls are successful (200 status)
3. Check your server logs for webhook processing

### 4.3 Test Complete User Journey

1. Start fresh conversation
2. Complete entire resume generation process
3. Verify PDF generation and delivery
4. Test error scenarios (invalid email, short job description)

---

## 📊 **Step 5: Monitoring & Analytics**

### 5.1 WABB Analytics
- Monitor flow completion rates
- Track user drop-off points
- Analyze message engagement

### 5.2 Custom Analytics
Access your flow statistics:
```
GET https://your-domain.com/api/wabb-flows/stats
```

### 5.3 Set Up Alerts
- Webhook failure alerts
- High error rate notifications
- Low completion rate warnings

---

## 🚨 **Troubleshooting Common Issues**

### Issue 1: Webhooks Not Working
- ✅ Check webhook URL is accessible
- ✅ Verify HTTPS certificate
- ✅ Check WABB webhook logs
- ✅ Verify request headers and authentication

### Issue 2: Flows Not Triggering
- ✅ Check keyword matching settings
- ✅ Verify flow is active
- ✅ Check flow priority order
- ✅ Test with exact keywords

### Issue 3: Resume Generation Failing
- ✅ Check user email exists in database
- ✅ Verify AI API keys are valid
- ✅ Check server logs for errors
- ✅ Test with known good user profiles

### Issue 4: Messages Not Delivered
- ✅ Check WhatsApp Business status
- ✅ Verify phone number format
- ✅ Check message content compliance
- ✅ Monitor delivery rates

---

## 🎯 **Next Steps After Setup**

1. **Soft Launch**: Test with 5-10 users first
2. **Monitor Performance**: Watch completion rates and errors
3. **Gather Feedback**: Ask users about experience
4. **Optimize Flows**: Improve based on user behavior
5. **Scale Gradually**: Increase user base progressively

---

## 📞 **Support Contacts**

- **WABB Support**: support@wabb.in
- **Technical Issues**: Check server logs and webhook responses
- **User Experience**: Monitor flow analytics and user feedback

Remember to keep your webhook tokens secure and never expose them in client-side code! 🔒
