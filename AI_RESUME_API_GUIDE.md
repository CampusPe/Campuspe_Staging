# 🎯 AI Resume Builder API - Complete Guide

## 📋 API Endpoint Information

### **Base URL**

```
Local Development: http://localhost:5001
Production/Staging: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net
```

### **Main AI Resume Generation Endpoint**

```
POST /api/ai-resume-builder/generate-ai
```

**Authentication Required**: ✅ Yes (Bearer Token)

---

## 🔑 Authentication

Include the authorization header with your JWT token:

```http
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## 📨 Request Format

### **Content-Type**

```
Content-Type: application/json
```

### **Request Body Structure**

```json
{
  "email": "user@example.com",
  "phone": "1234567890",
  "jobDescription": "Your target job description here",
  "jobTitle": "Software Engineer",
  "experienceLevel": "junior|mid|senior",
  "includeProfileData": true,
  "userProfile": {
    "name": "Full Name",
    "email": "user@example.com",
    "phone": "1234567890",
    "location": "City, State"
  }
}
```

### **Required Fields**

- ✅ `email` (string) - Your email address
- ✅ `phone` (string) - Your phone number
- ✅ `jobDescription` (string) - The job posting or description you're targeting

### **Optional Fields**

- `jobTitle` (string) - The specific job title you're applying for
- `experienceLevel` (string) - Your experience level: "junior", "mid", or "senior"
- `includeProfileData` (boolean) - Whether to include your existing profile data (default: true)
- `userProfile` (object) - Additional profile information

---

## 🎯 Complete cURL Example

```bash
curl -X POST http://localhost:5001/api/ai-resume-builder/generate-ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "ankita@gmail.com",
    "phone": "7678085840",
    "jobDescription": "We are looking for a Full Stack Developer with experience in React, Node.js, and TypeScript. The ideal candidate should have 2+ years of experience building modern web applications and working with databases like MongoDB.",
    "jobTitle": "Full Stack Developer",
    "experienceLevel": "junior",
    "includeProfileData": true,
    "userProfile": {
      "name": "Ankita Lokhande",
      "email": "ankita@gmail.com",
      "phone": "7678085840",
      "location": "Mumbai, India"
    }
  }'
```

---

## 📄 Response Format

### **Success Response (200 OK)**

```json
{
  "success": true,
  "message": "AI resume generated successfully",
  "data": {
    "resumeData": {
      "personalInfo": {
        "firstName": "Ankita",
        "lastName": "Lokhande",
        "email": "ankita@gmail.com",
        "phone": "7678085840",
        "linkedin": "linkedin.com/in/ankita-lokhande-527221261",
        "github": "github.com/ankitaa19",
        "location": "Mumbai, India"
      },
      "summary": "Experienced full-stack developer with a strong background in modern web technologies...",
      "skills": [
        {
          "name": "JavaScript",
          "level": "Advanced",
          "category": "Technical"
        }
      ],
      "experience": [...],
      "education": [...],
      "projects": [...]
    },
    "pdfFileName": "resume_1756055271765_ag9bckimh",
    "pdfUrl": "http://localhost:5001/api/ai-resume-builder/download-pdf-public/resume_1756055271765_ag9bckimh",
    "historySaved": true,
    "matchScore": 85
  }
}
```

### **Error Response (400/401/500)**

```json
{
  "success": false,
  "message": "Error description here",
  "error": "Detailed error information"
}
```

---

## 📥 PDF Download

### **PDF Download Endpoint**

```
GET /api/ai-resume-builder/download-pdf-public/{pdfFileName}
```

**Example:**

```bash
curl -X GET http://localhost:5001/api/ai-resume-builder/download-pdf-public/resume_1756055271765_ag9bckimh \
  --output my_resume.pdf
```

---

## 🛠️ JavaScript/Axios Example

```javascript
const axios = require("axios");

async function generateAIResume() {
  try {
    const response = await axios.post(
      "http://localhost:5001/api/ai-resume-builder/generate-ai",
      {
        email: "ankita@gmail.com",
        phone: "7678085840",
        jobDescription:
          "Full Stack Developer position requiring React, Node.js, TypeScript skills with 2+ years experience in modern web development and MongoDB databases.",
        jobTitle: "Full Stack Developer",
        experienceLevel: "junior",
        includeProfileData: true,
        userProfile: {
          name: "Ankita Lokhande",
          email: "ankita@gmail.com",
          phone: "7678085840",
          location: "Mumbai, India",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer YOUR_JWT_TOKEN",
        },
      }
    );

    console.log("✅ Resume generated successfully!");
    console.log("📄 PDF URL:", response.data.data.pdfUrl);
    console.log("📊 Match Score:", response.data.data.matchScore);

    // Download the PDF
    const pdfResponse = await axios.get(response.data.data.pdfUrl, {
      responseType: "arraybuffer",
    });

    require("fs").writeFileSync("generated_resume.pdf", pdfResponse.data);
    console.log("💾 PDF saved as generated_resume.pdf");
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

generateAIResume();
```

---

## 🎨 Enhanced PDF Features

The updated PDF generation now includes:

### **Professional Design Elements**

- ✨ Enhanced typography with proper font hierarchy
- 🎨 Professional color scheme (Blue primary, Gray secondary)
- 📐 Improved spacing and margins
- 🔸 Section headers with accent lines
- 📦 Background accents for better visual separation

### **Better Content Formatting**

- 📝 Clean bullet points for experience descriptions
- 🏷️ Categorized skills with visual grouping
- 📅 Professional date formatting
- 🔗 Properly formatted contact information
- 🎯 Enhanced section separation and hierarchy

### **Layout Improvements**

- 📄 Better page break handling
- 📏 Consistent margins and spacing
- 🎯 Right-aligned dates for experience/education
- 🌟 Professional header with background accent
- 📊 Visual hierarchy for easy scanning

---

## 📋 Resume History

Generated resumes are automatically saved to your profile history. You can access them through:

### **Get Resume History**

```
GET /api/students/profile
```

The response includes an `aiResumeHistory` array with all your generated resumes.

---

## 🔧 Testing the API

### **Health Check**

```bash
curl http://localhost:5001/health
```

### **Test Generation (No Auth Required)**

```bash
curl -X POST http://localhost:5001/api/ai-resume-builder/test-generate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "1234567890",
    "jobDescription": "Software Engineer position"
  }'
```

---

## 🎯 Best Practices

1. **Job Description Quality**: Provide detailed job descriptions for better AI matching
2. **Experience Level**: Specify your experience level for appropriate content generation
3. **Profile Data**: Keep your profile updated for better resume personalization
4. **PDF Download**: Always download the PDF immediately after generation
5. **Error Handling**: Implement proper error handling for API calls

---

## 🚀 Frontend Integration

The frontend should be configured to use the local API during development:

**Environment Configuration (`apps/web/.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NODE_ENV=development
```

This ensures the frontend connects to your local backend instead of the staging environment.

---

## ✅ Status Verification

To verify everything is working:

1. **Check API Health**: `curl http://localhost:5001/health`
2. **Test PDF Generation**: Use the complete cURL example above
3. **Verify PDF Quality**: Download and review the generated PDF
4. **Check Resume History**: Verify resumes are saved to your profile

---

**🎉 Your AI Resume Builder is now ready with enhanced PDF formatting and professional design!**
