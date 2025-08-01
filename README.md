# 🎓 CampusPe - Student Career Platform (Staging)

> Connecting students, colleges, and recruiters through intelligent job matching and career opportunities.

**🌐 Live Staging Environment:**
- **Frontend**: https://campuspe-web-staging.azurewebsites.net
- **API**: https://campuspe-api-staging.azurewebsites.net

## 🏗️ Architecture

### Monorepo Structure
```
CampusPe_Staging/
├── apps/
│   ├── api/          # Node.js/Express Backend
│   └── web/          # Next.js Frontend
├── .github/workflows/ # CI/CD Pipelines
└── docs/             # Documentation
```

### Technology Stack

#### Backend (`apps/api`)
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB Atlas
- **Authentication**: JWT with role-based access
- **AI Integration**: Claude API for resume analysis
- **File Processing**: PDF parsing and analysis
- **Communication**: Azure Communication Services

#### Frontend (`apps/web`)
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom responsive components
- **State Management**: React hooks and context

## 🚀 Features

### For Students
- **Resume Upload & Analysis**: AI-powered resume parsing and skill extraction
- **Job Matching**: Intelligent matching based on skills and preferences
- **Career Dashboard**: Track applications and opportunities
- **Profile Management**: Comprehensive student profiles

### For Colleges
- **Student Management**: Oversee enrolled students
- **Placement Tracking**: Monitor job placements
- **Recruiter Partnerships**: Manage relationships with hiring companies
- **Analytics**: Placement statistics and trends

### For Recruiters
- **Job Posting**: Create detailed job listings with requirements
- **Candidate Matching**: AI-powered candidate recommendations
- **Application Management**: Review and process applications
- **College Partnerships**: Connect with educational institutions

### For Admins
- **Approval System**: College and recruiter verification
- **Dashboard Analytics**: Platform-wide statistics
- **User Management**: Comprehensive admin controls
- **Content Moderation**: Maintain platform quality

## 🛠️ Development Setup

### Prerequisites
- Node.js 20 LTS
- npm 10+
- MongoDB Atlas account
- Claude API key

### Local Development
```bash
# Clone repository
git clone https://github.com/CampusPe/Campuspe_Staging.git
cd Campuspe_Staging

# Install dependencies
npm run setup

# Start development servers
npm run dev
```

This will start:
- API server on http://localhost:5001
- Web server on http://localhost:3000

### Environment Configuration
```bash
# API configuration
cp apps/api/.env.example apps/api/.env

# Web configuration  
cp apps/web/.env.example apps/web/.env
```

## 🌐 Deployment

### Azure App Services
The platform is deployed on Azure using two App Services:

- **API**: `https://campuspe-api-staging.azurewebsites.net`
- **Web**: `https://campuspe-web-staging.azurewebsites.net`

### CI/CD Pipeline
Automated deployment using GitHub Actions:
- Triggers on push to `main` branch
- Separate workflows for API and Web
- Production-ready build optimization

### Quick Deploy
```bash
# Deploy both services
git push origin main

# Deploy API only (if API changes)
# Workflow triggers automatically for apps/api/** changes

# Deploy Web only (if frontend changes)  
# Workflow triggers automatically for apps/web/** changes
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Students
- `GET /api/students/profile` - Get student profile
- `POST /api/students/resume` - Upload resume
- `GET /api/students/jobs` - Get matched jobs

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create job (recruiters)
- `GET /api/jobs/:id` - Get job details

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `POST /api/admin/approve/:type/:id` - Approve entities
- `GET /api/admin/pending` - Get pending approvals

## 🧪 Testing

### Backend Tests
```bash
cd apps/api
npm test
```

### Frontend Tests
```bash
cd apps/web  
npm test
```

### Integration Tests
```bash
npm run test:integration
```

## 📱 Mobile Responsiveness

The platform is fully responsive and works seamlessly across:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1440px+)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Different permissions per user type
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: Restricted file types and sizes
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Secure configuration management

## 🤖 AI Integration

### Claude API Features
- **Resume Parsing**: Extract skills and experience
- **Job Matching**: Intelligent candidate-job matching
- **Skill Analysis**: Comprehensive skill assessment
- **Career Recommendations**: Personalized career advice

### Matching Algorithm
```typescript
// Skill-based matching with weighted scoring
const matchScore = calculateMatch(candidateSkills, jobRequirements, {
  mandatorySkills: 0.4,
  experienceLevel: 0.3,
  skillProficiency: 0.3
});
```

## 📈 Analytics & Monitoring

### Application Insights
- Performance monitoring
- Error tracking
- User behavior analytics
- API response times

### Dashboard Metrics
- Active users by role
- Job posting trends
- Placement success rates
- Platform engagement

## 🔄 Database Schema

### Core Collections
- **Users**: Base user authentication
- **Students**: Student profiles and resumes
- **Colleges**: Educational institution data
- **Recruiters**: Company and recruiter information
- **Jobs**: Job postings and requirements
- **Applications**: Job applications and status

### Relationships
```
Users (1:1) → Students/Colleges/Recruiters/Admins
Jobs (N:1) → Recruiters
Applications (N:N) → Students ↔ Jobs
```

## 🛡️ Data Privacy

- **GDPR Compliant**: European data protection standards
- **Data Encryption**: Encrypted data at rest and in transit
- **User Consent**: Clear privacy policies and consent management
- **Data Retention**: Configurable data retention policies

## 🚦 Status & Health Checks

### Health Endpoint
```bash
curl https://campuspe-api-staging.azurewebsites.net/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "database": "connected",
  "services": {
    "claude": "active",
    "azure": "active"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📚 Documentation

- [Azure Deployment Guide](./AZURE_DEPLOYMENT_GUIDE.md)
- [API Documentation](./docs/api.md)
- [Frontend Components](./docs/components.md)
- [Database Schema](./docs/database.md)

## 📄 License

This project is proprietary software owned by CampusPe.

## 🆘 Support

For support and questions:
- 📧 Email: support@campuspe.com
- 📱 Platform: https://campuspe-web-staging.azurewebsites.net
- 🐛 Issues: https://github.com/CampusPe/Campuspe_Staging/issues

---

**Built with ❤️ for connecting talent with opportunities**
