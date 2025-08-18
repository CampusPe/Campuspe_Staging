# 🚀 Quick Start Deployment Guide

## ⚡ **30-Minute Setup Checklist**

### **Prerequisites ✅**
- [ ] WABB.in Business account created
- [ ] WhatsApp Business number verified
- [ ] CampusPe API deployed and accessible
- [ ] SSL certificate configured
- [ ] Environment variables ready

---

## **Step 1: Environment Setup (5 minutes)**

### Copy and configure environment file:
```bash
cp .env.whatsapp.template .env.local
```

### Update these critical variables:
```bash
# WABB Integration
WABB_WEBHOOK_URL_RESUME=https://wabb.in/api/webhook/YOUR_FLOW_ID
WABB_WEBHOOK_TOKEN=your-secure-token-here

# AI Services
CLAUDE_API_KEY=sk-ant-api03-your-key-here

# Your Domain
API_BASE_URL=https://your-campuspe-domain.com

# WhatsApp Business
WHATSAPP_PHONE_NUMBER=+1234567890
```

---

## **Step 2: Deploy Code Changes (5 minutes)**

```bash
# Install new dependencies
npm install

# Build the project
npm run build

# Deploy to your server
# (Use your existing deployment process)
```

---

## **Step 3: WABB Platform Quick Setup (15 minutes)**

### 3.1 Create Webhook Configuration
1. **Go to WABB Dashboard → Settings → Webhooks**
2. **Set Primary Webhook URL**: `https://your-domain.com/api/wabb-flows/webhook`
3. **Add Header**: `Authorization: Bearer YOUR_WEBHOOK_TOKEN`

### 3.2 Create Essential Flows (Use WABB Flow Builder)

#### **Flow 1: Resume Trigger**
- **Name**: Resume Builder
- **Trigger**: Keywords: `resume, cv, start`
- **Action**: Send welcome message + set attribute `resume_flow_step=waiting_for_email`

#### **Flow 2: Email Collection**
- **Name**: Email Validator
- **Trigger**: When `resume_flow_step=waiting_for_email`
- **Condition**: Validate email format
- **Actions**: Store email + ask for job description

#### **Flow 3: Job Collection**
- **Name**: Job Description Handler
- **Trigger**: When `resume_flow_step=waiting_for_job_description`
- **Action**: Trigger resume generation webhook

#### **Flow 4: Help & Cancel**
- **Name**: Support Commands
- **Trigger**: Keywords: `help, cancel, stop`
- **Action**: Send help message or reset flow

---

## **Step 4: Testing (5 minutes)**

### Quick Test Commands:
```bash
# Test webhook connectivity
curl -X POST https://your-domain.com/api/wabb-flows/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"phone":"1234567890","message":"test","type":"general_message"}'

# Test resume generation
curl -X POST https://your-domain.com/api/wabb/create-resume \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"1234567890",
    "email":"test@example.com",
    "jobDescription":"Looking for React developer with 2+ years experience"
  }'
```

### WhatsApp Flow Test:
1. Send "resume" to your WhatsApp Business number
2. Follow the conversation flow
3. Verify resume generation and delivery

---

## **Sample WABB Flow JSON Configurations**

### **Flow 1: Resume Builder Trigger**
```json
{
  "name": "Resume Builder",
  "trigger": {
    "type": "keyword",
    "keywords": ["resume", "cv", "start"],
    "match_type": "contains"
  },
  "actions": [
    {
      "type": "send_message",
      "text": "🎯 *CampusPe AI Resume Builder*\n\nHi {{contact_name}}! I'll help you create a professional resume.\n\n📧 Please share your email address to begin."
    },
    {
      "type": "set_attribute",
      "name": "resume_flow_step",
      "value": "waiting_for_email"
    },
    {
      "type": "webhook",
      "url": "https://your-domain.com/api/wabb-flows/webhook",
      "payload": {
        "phone": "{{contact_phone}}",
        "type": "resume_start",
        "name": "{{contact_name}}"
      }
    }
  ]
}
```

### **Flow 2: Email Collection**
```json
{
  "name": "Email Collection",
  "trigger": {
    "type": "attribute",
    "attribute": "resume_flow_step",
    "value": "waiting_for_email"
  },
  "conditions": [
    {
      "field": "{{last_message}}",
      "type": "regex",
      "pattern": "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$",
      "true_actions": [
        {
          "type": "send_message",
          "text": "✅ Email confirmed: {{last_message}}\n\n📋 Now please share the complete job description."
        },
        {
          "type": "set_attribute",
          "name": "user_email",
          "value": "{{last_message}}"
        },
        {
          "type": "set_attribute",
          "name": "resume_flow_step",
          "value": "waiting_for_job_description"
        }
      ],
      "false_actions": [
        {
          "type": "send_message",
          "text": "❌ Invalid email format. Please provide a valid email address.\n\nExample: john@example.com"
        }
      ]
    }
  ]
}
```

### **Flow 3: Job Description Processing**
```json
{
  "name": "Job Description Handler",
  "trigger": {
    "type": "attribute",
    "attribute": "resume_flow_step",
    "value": "waiting_for_job_description"
  },
  "conditions": [
    {
      "field": "{{last_message}}",
      "type": "min_length",
      "value": 50,
      "true_actions": [
        {
          "type": "send_message",
          "text": "🚀 Resume generation started!\n\n⏳ This takes 30-60 seconds...\n\nI'll notify you when ready! 📄✨"
        },
        {
          "type": "webhook",
          "url": "https://your-domain.com/api/wabb-flows/webhook",
          "payload": {
            "phone": "{{contact_phone}}",
            "email": "{{user_email}}",
            "jobDescription": "{{last_message}}",
            "type": "job_description_collected",
            "name": "{{contact_name}}"
          }
        }
      ],
      "false_actions": [
        {
          "type": "send_message",
          "text": "❌ Job description too short. Please provide more details (at least 50 characters)."
        }
      ]
    }
  ]
}
```

---

## **Production Checklist**

### **Before Going Live ✅**
- [ ] All webhook URLs are HTTPS and accessible
- [ ] WABB flows are created and activated
- [ ] Environment variables are configured
- [ ] Database connections are working
- [ ] AI API keys are valid and have credits
- [ ] Test complete user journey works
- [ ] Error handling is tested
- [ ] Monitoring and logging are set up

### **After Going Live ✅**
- [ ] Monitor webhook delivery rates
- [ ] Check resume generation success rates
- [ ] Track user engagement metrics
- [ ] Set up alerts for failures
- [ ] Monitor server performance
- [ ] Gather user feedback
- [ ] Plan scaling based on usage

---

## **Monitoring Dashboard URLs**

Once deployed, access these endpoints for monitoring:

```
Flow Statistics: https://your-domain.com/api/wabb-flows/stats
Admin Dashboard: https://your-domain.com/api/whatsapp-admin/stats
Recent Activities: https://your-domain.com/api/whatsapp-admin/recent-activities
```

---

## **Troubleshooting Quick Fixes**

### **Webhooks Not Working**
```bash
# Test webhook connectivity
curl -v https://your-domain.com/api/wabb-flows/webhook

# Check WABB webhook logs in dashboard
# Verify SSL certificate is valid
```

### **Resume Generation Failing**
```bash
# Check AI API credits and limits
# Verify user exists in database
# Check server logs for errors
```

### **Messages Not Delivered**
```bash
# Verify WhatsApp Business account status
# Check WABB message delivery logs
# Ensure message format compliance
```

---

## **Support & Next Steps**

### **Immediate Support**
- **Technical Issues**: Check server logs and webhook responses
- **WABB Platform**: support@wabb.in
- **AI Services**: Check API documentation and limits

### **Scaling Considerations**
- **Redis Integration**: For production-scale conversation state management
- **Queue System**: For handling high-volume resume generation
- **CDN Setup**: For faster PDF delivery
- **Load Balancing**: For handling multiple webhook requests

### **Feature Roadmap**
- **Multi-language Support**: Resumes in different languages
- **Voice Input**: Speak instead of type job descriptions
- **Smart Templates**: Industry-specific resume formats
- **Integration Analytics**: Detailed user journey analysis

---

🎉 **Congratulations!** You now have a fully functional WhatsApp Resume Builder that integrates seamlessly with your CampusPe platform. Users can create professional, job-tailored resumes entirely through WhatsApp without ever visiting your website!

The integration provides a modern, mobile-first experience that will significantly increase user engagement and resume generation rates. 🚀
