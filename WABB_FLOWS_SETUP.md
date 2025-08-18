# WABB Flow Configuration Guide

## Flow 1: Resume Builder Main Flow

### Flow Configuration:
- **Flow Name:** "Resume Builder Main"
- **Flow Type:** "Keyword Trigger Flow"
- **Status:** Active

### Trigger Configuration:
```json
{
  "trigger_type": "keyword",
  "keywords": ["resume", "cv", "start", "create resume", "build resume"],
  "match_type": "contains",
  "case_sensitive": false
}
```

### Flow Actions:

#### Action 1: Send Welcome Message
```json
{
  "action_type": "send_message",
  "message": "🎯 *CampusPe AI Resume Builder*\n\nHi {{contact_name}}! I'll help you create a professional, job-tailored resume in minutes.\n\n📋 *What I need from you:*\n1. Your email address\n2. Complete job description\n\n🚀 *Ready to start?* Reply with your email address.\n\n❌ Type 'cancel' anytime to stop."
}
```

#### Action 2: Set Contact Attribute
```json
{
  "action_type": "set_attribute",
  "attribute_name": "resume_flow_step",
  "attribute_value": "waiting_for_email"
}
```

#### Action 3: Send Webhook to CampusPe
```json
{
  "action_type": "webhook",
  "webhook_url": "https://your-domain.com/api/wabb/webhook",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_WEBHOOK_TOKEN"
  },
  "payload": {
    "phone": "{{contact_phone}}",
    "message": "{{message_text}}",
    "name": "{{contact_name}}",
    "type": "resume_start",
    "flow_step": "initiated",
    "timestamp": "{{timestamp}}"
  }
}
```

---

## Flow 2: Email Collection Flow

### Flow Configuration:
- **Flow Name:** "Email Collection"
- **Flow Type:** "Conditional Flow"
- **Trigger:** When contact attribute `resume_flow_step` = "waiting_for_email"

### Condition: Email Validation
```json
{
  "condition_type": "regex_match",
  "field": "{{message_text}}",
  "regex": "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$",
  "if_true": "email_valid_flow",
  "if_false": "email_invalid_flow"
}
```

### Email Valid Flow Actions:

#### Action 1: Confirm Email
```json
{
  "action_type": "send_message",
  "message": "✅ *Email Confirmed:* {{message_text}}\n\n📋 *Step 2 of 2:* Now please share the complete job description.\n\nPaste the entire job posting including:\n• Job title & company\n• Requirements & qualifications\n• Responsibilities\n• Skills needed\n\n💡 *Tip:* The more details you provide, the better I can tailor your resume!"
}
```

#### Action 2: Store Email
```json
{
  "action_type": "set_attribute",
  "attribute_name": "user_email",
  "attribute_value": "{{message_text}}"
}
```

#### Action 3: Update Flow Step
```json
{
  "action_type": "set_attribute",
  "attribute_name": "resume_flow_step",
  "attribute_value": "waiting_for_job_description"
}
```

#### Action 4: Webhook Notification
```json
{
  "action_type": "webhook",
  "webhook_url": "https://your-domain.com/api/wabb/webhook",
  "method": "POST",
  "payload": {
    "phone": "{{contact_phone}}",
    "message": "{{message_text}}",
    "name": "{{contact_name}}",
    "type": "email_collected",
    "email": "{{message_text}}",
    "flow_step": "email_confirmed",
    "timestamp": "{{timestamp}}"
  }
}
```

### Email Invalid Flow Actions:

#### Action 1: Error Message
```json
{
  "action_type": "send_message",
  "message": "❌ *Invalid Email Format*\n\nPlease provide a valid email address.\n\n📧 *Example:* john.doe@gmail.com\n\n🔄 Try again or type 'cancel' to stop."
}
```

#### Action 2: Increment Attempt Counter
```json
{
  "action_type": "increment_attribute",
  "attribute_name": "email_attempts",
  "increment_by": 1
}
```

---

## Flow 3: Job Description Collection Flow

### Flow Configuration:
- **Flow Name:** "Job Description Collection"
- **Flow Type:** "Conditional Flow"
- **Trigger:** When contact attribute `resume_flow_step` = "waiting_for_job_description"

### Condition: Length Validation
```json
{
  "condition_type": "text_length",
  "field": "{{message_text}}",
  "min_length": 50,
  "if_true": "job_description_valid_flow",
  "if_false": "job_description_invalid_flow"
}
```

### Job Description Valid Flow Actions:

#### Action 1: Processing Message
```json
{
  "action_type": "send_message",
  "message": "🚀 *Resume Generation Started!*\n\n✅ Email: {{user_email}}\n✅ Job Description: Received ({{message_length}} characters)\n\n🤖 *AI is now working on:*\n• Analyzing job requirements\n• Fetching your CampusPe profile\n• Matching skills to job needs\n• Creating tailored content\n• Generating professional PDF\n\n⏳ *This takes 30-60 seconds...*\n\nI'll notify you when it's ready! 📄✨"
}
```

#### Action 2: Store Job Description
```json
{
  "action_type": "set_attribute",
  "attribute_name": "job_description",
  "attribute_value": "{{message_text}}"
}
```

#### Action 3: Update Flow Step
```json
{
  "action_type": "set_attribute",
  "attribute_name": "resume_flow_step",
  "attribute_value": "processing"
}
```

#### Action 4: Generate Resume Webhook
```json
{
  "action_type": "webhook",
  "webhook_url": "https://your-domain.com/api/wabb/create-resume",
  "method": "POST",
  "payload": {
    "phone": "{{contact_phone}}",
    "email": "{{user_email}}",
    "jobDescription": "{{job_description}}",
    "name": "{{contact_name}}",
    "timestamp": "{{timestamp}}"
  }
}
```

### Job Description Invalid Flow Actions:

#### Action 1: Error Message
```json
{
  "action_type": "send_message",
  "message": "❌ *Job Description Too Short*\n\nPlease provide a more detailed job description (at least 50 characters).\n\nInclude:\n• Job title & company\n• Key requirements\n• Responsibilities\n• Required skills\n\n🔄 Try again or type 'cancel' to stop."
}
```

---

## Flow 4: Help & Support Flow

### Flow Configuration:
- **Flow Name:** "Help & Support"
- **Flow Type:** "Keyword Trigger Flow"
- **Keywords:** ["help", "support", "assist", "how", "guide"]

### Actions:

#### Action 1: Help Message
```json
{
  "action_type": "send_message",
  "message": "📖 *CampusPe Resume Builder Help*\n\n🤖 **Commands:**\n• 'resume' or 'start' - Begin resume creation\n• 'help' - Show this help message\n• 'cancel' or 'stop' - Cancel current process\n\n📝 **How to use:**\n1️⃣ Type 'resume' to start\n2️⃣ Provide your email address\n3️⃣ Share the complete job description\n4️⃣ Wait 30-60 seconds for AI magic\n5️⃣ Receive your tailored resume!\n\n✅ **Requirements:**\n• Valid email address\n• Complete job description (50+ chars)\n• CampusPe profile (recommended)\n\n🌐 **Create Profile:** CampusPe.com\n📞 **Support:** support@campuspe.com\n\n🚀 Ready? Type 'resume' to begin!"
}
```

---

## Flow 5: Cancel/Reset Flow

### Flow Configuration:
- **Flow Name:** "Cancel Reset"
- **Flow Type:** "Keyword Trigger Flow"
- **Keywords:** ["cancel", "stop", "reset", "quit", "exit"]

### Actions:

#### Action 1: Reset Message
```json
{
  "action_type": "send_message",
  "message": "❌ *Process Cancelled*\n\nNo worries! You can start again anytime.\n\n🔄 **Ready to try again?**\n• Type 'resume' to start over\n• Type 'help' for guidance\n\n😊 We're here whenever you need us!"
}
```

#### Action 2: Clear Attributes
```json
{
  "action_type": "clear_attributes",
  "attributes": [
    "resume_flow_step",
    "user_email", 
    "job_description",
    "email_attempts"
  ]
}
```

#### Action 3: Reset Webhook
```json
{
  "action_type": "webhook",
  "webhook_url": "https://your-domain.com/api/wabb/webhook",
  "method": "POST",
  "payload": {
    "phone": "{{contact_phone}}",
    "message": "{{message_text}}",
    "name": "{{contact_name}}",
    "type": "conversation_reset",
    "timestamp": "{{timestamp}}"
  }
}
```

---

## Flow 6: Fallback/Default Flow

### Flow Configuration:
- **Flow Name:** "Default Fallback"
- **Flow Type:** "Fallback Flow"
- **Priority:** Lowest

### Actions:

#### Action 1: Welcome/Guide Message
```json
{
  "action_type": "send_message",
  "message": "👋 *Welcome to CampusPe!*\n\nI'm your AI Resume Assistant. I can help you create professional, job-tailored resumes instantly! 🤖\n\n🚀 **Quick Commands:**\n• Type 'resume' - Create a tailored resume\n• Type 'help' - Get detailed instructions\n• Type 'support' - Contact our team\n\n💡 **Did you know?** I can analyze any job posting and create a resume that matches the requirements perfectly!\n\n🔗 Visit CampusPe.com to update your profile for better results."
}
```

---

## Flow Testing Checklist:

### ✅ **Before Activation:**
- [ ] All webhook URLs are configured correctly
- [ ] Test each flow with sample inputs
- [ ] Verify attribute storage and retrieval
- [ ] Check error handling paths
- [ ] Test cancellation flows
- [ ] Validate webhook payloads
- [ ] Test with different phone number formats

### ✅ **After Activation:**
- [ ] Send test messages to verify flows
- [ ] Check webhook delivery logs
- [ ] Monitor conversation analytics
- [ ] Test complete user journey
- [ ] Verify resume generation and delivery
- [ ] Check error scenarios and recovery
