# WABB WhatsApp Resume Builder Integration Guide

## Overview
This guide explains how to set up and configure the WABB (WhatsApp Business Bot) integration for the CampusPe AI Resume Builder. Users can create tailored resumes entirely through WhatsApp without visiting the platform.

## Architecture Flow

```
WhatsApp User → WABB Platform → CampusPe Webhook → AI Resume Builder → WhatsApp Delivery
```

## Features

### 🤖 Conversational AI Flow
- **Smart Conversation Management**: Step-by-step guidance
- **Input Validation**: Email and job description verification
- **Error Handling**: Clear error messages and retry mechanisms
- **State Management**: Maintains conversation context

### 🎯 AI-Powered Resume Generation
- **Job Analysis**: Claude AI analyzes job requirements
- **Profile Matching**: Fetches user data from CampusPe platform
- **Tailored Content**: 70% job-focused, 30% user background
- **ATS Optimization**: Keywords and formatting for ATS systems

### 📱 WhatsApp Integration
- **Real-time Processing**: Instant responses and status updates
- **PDF Delivery**: Direct resume delivery to WhatsApp
- **Download Links**: Persistent download URLs
- **Progress Tracking**: Step-by-step status updates

## Setup Instructions

### 1. WABB Platform Configuration

#### A. Webhook Configuration
Set up the following webhooks in your WABB dashboard:

**Primary Webhook URL:**
```
https://your-domain.com/api/wabb/webhook
```

**Backup/Fallback URL:**
```
https://your-domain.com/api/webhook/wabb-webhook
```

#### B. Webhook Events
Enable these webhook events:
- `message.received` - When user sends a message
- `message.delivered` - When our message is delivered
- `message.read` - When user reads our message

#### C. WABB Flow Builder
Create flows in WABB with these triggers:

**Flow 1: Resume Builder Trigger**
```
Trigger: User sends "resume", "cv", "start"
Action: Send webhook to CampusPe with purpose="resume_start"
```

**Flow 2: Help Trigger**
```
Trigger: User sends "help", "assist"
Action: Send webhook to CampusPe with purpose="help_request"
```

**Flow 3: General Message Handler**
```
Trigger: Any other message
Action: Send webhook to CampusPe with purpose="general_message"
```

### 2. Environment Variables

Add these to your `.env` file:

```bash
# WABB Integration
WABB_WEBHOOK_URL_RESUME=https://wabb.in/api/webhook/your-resume-flow-id
WABB_WEBHOOK_URL_GENERAL=https://wabb.in/api/webhook/your-general-flow-id
WABB_WEBHOOK_TOKEN=your-wabb-webhook-token
WABB_API_KEY=your-wabb-api-key

# AI Services
CLAUDE_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key-fallback

# Resume Generation
RESUME_STORAGE_TYPE=cloud
RESUME_BASE_URL=https://your-domain.com
PDF_GENERATION_TIMEOUT=60000

# WhatsApp Business
WHATSAPP_BUSINESS_ID=your-whatsapp-business-id
WHATSAPP_PHONE_NUMBER=your-whatsapp-number
```

### 3. WABB Flow Configuration

#### Flow 1: Resume Start Flow
```json
{
  "name": "Resume Builder Start",
  "trigger": {
    "type": "keyword",
    "keywords": ["resume", "cv", "start", "create resume"]
  },
  "actions": [
    {
      "type": "webhook",
      "url": "https://your-domain.com/api/wabb/webhook",
      "method": "POST",
      "payload": {
        "phone": "{{phone}}",
        "message": "{{message}}",
        "name": "{{name}}",
        "type": "resume_start",
        "timestamp": "{{timestamp}}"
      }
    }
  ]
}
```

#### Flow 2: Message Handler Flow
```json
{
  "name": "General Message Handler",
  "trigger": {
    "type": "fallback"
  },
  "actions": [
    {
      "type": "webhook",
      "url": "https://your-domain.com/api/wabb/webhook",
      "method": "POST",
      "payload": {
        "phone": "{{phone}}",
        "message": "{{message}}",
        "name": "{{name}}",
        "type": "general",
        "timestamp": "{{timestamp}}"
      }
    }
  ]
}
```

## User Experience Flow

### 1. Initial Contact
```
User: "Hi"
Bot: "👋 Welcome to CampusPe AI Resume Builder! 
      Type 'resume' to start creating a tailored resume!"
```

### 2. Resume Creation Flow
```
User: "resume"
Bot: "🎯 AI Resume Builder Started! 
     Step 1: Please share your email address"

User: "john@example.com"
Bot: "✅ Email Confirmed: john@example.com
     Step 2: Please share the complete job description"

User: [Pastes job description]
Bot: "🚀 Resume Generation Started! 
     AI is analyzing job requirements... 30-60 seconds"

Bot: "🎉 Resume Generated Successfully!
     📄 File: john_doe_resume_20240818.pdf
     📥 Download: [link]"
```

### 3. Error Handling
```
User: "invalid-email"
Bot: "❌ Invalid Email Format
     Please provide a valid email address
     Example: john.doe@gmail.com"

User: [Short job description]
Bot: "❌ Job Description Too Short
     Please provide more details (50+ characters)"
```

## Integration Points

### 1. CampusPe Platform Integration
- **User Authentication**: Email-based user lookup
- **Profile Data**: Fetches skills, experience, education
- **Resume Storage**: Saves generated resumes
- **Download URLs**: Creates accessible download links

### 2. AI Services Integration
- **Claude AI**: Primary resume generation
- **Fallback AI**: OpenAI GPT as backup
- **Job Analysis**: Extracts key requirements
- **Skill Matching**: Matches user skills to job needs

### 3. WhatsApp Business Integration
- **Message Sending**: via WABB webhooks
- **File Delivery**: PDF attachments
- **Status Updates**: Read receipts and delivery status
- **Error Notifications**: Failed delivery alerts

## Monitoring and Analytics

### 1. Conversation Metrics
```javascript
// Get current statistics
const stats = WhatsAppResumeFlow.getStats();
console.log('Active Conversations:', stats.activeConversations);
console.log('Completed Today:', stats.completedToday);
```

### 2. Resume Generation Metrics
- Total resumes generated via WhatsApp
- Success/failure rates
- Average generation time
- User satisfaction scores

### 3. Error Tracking
- Failed webhook deliveries
- AI service failures
- PDF generation errors
- User abandonment points

## Testing and Debugging

### 1. Test Commands
```bash
# Test WABB webhook connectivity
curl -X POST https://your-domain.com/api/wabb/test \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890"}'

# Test resume generation
curl -X POST https://your-domain.com/api/wabb/create-resume \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "1234567890",
    "jobDescription": "Looking for a software developer..."
  }'
```

### 2. Debug Mode
Enable debug logging by setting:
```bash
DEBUG_WHATSAPP_FLOW=true
```

### 3. Common Issues

#### Issue: Messages not being received
- Check WABB webhook configuration
- Verify webhook URL is accessible
- Check WABB flow activation status

#### Issue: Resume generation failing
- Verify Claude AI API key
- Check user profile completeness
- Review PDF generation service

#### Issue: WhatsApp delivery failing
- Check WABB webhook URLs
- Verify WhatsApp Business account status
- Review message format compliance

## Security Considerations

### 1. Webhook Security
- Implement webhook token verification
- Use HTTPS for all webhook URLs
- Rate limiting for incoming requests

### 2. Data Privacy
- Encrypt sensitive user data
- Implement data retention policies
- GDPR compliance for EU users

### 3. API Security
- API key rotation
- Request authentication
- Input validation and sanitization

## Scaling Considerations

### 1. Performance
- Implement Redis for conversation state storage
- Queue system for resume generation
- CDN for PDF file delivery

### 2. Reliability
- Webhook retry mechanisms
- Circuit breaker patterns
- Health check endpoints

### 3. Monitoring
- Real-time conversation monitoring
- Performance metrics dashboard
- Automated alerting system

## Support and Maintenance

### 1. User Support
- Help command with detailed instructions
- Support contact information
- Escalation to human agents

### 2. System Maintenance
- Regular cleanup of conversation states
- Archive old resume files
- Update AI prompts and flows

### 3. Updates and Improvements
- A/B testing for conversation flows
- User feedback collection
- Continuous AI model improvement

---

**Next Steps:**
1. Configure WABB platform with provided flows
2. Set up environment variables
3. Test the integration with sample data
4. Deploy to production
5. Monitor and optimize based on usage

For support, contact: support@campuspe.com
