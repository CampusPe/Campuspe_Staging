'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ResumeHistory from '../components/ResumeHistory';

interface ResumeRequest {
  email: string;
  phone: string;
  jobDescription: string;
}

interface GeneratedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
}

const AIResumeBuilder = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Resume history modal
  const [showResumeHistory, setShowResumeHistory] = useState(false);
  
  // Form data
  const [resumeRequest, setResumeRequest] = useState<ResumeRequest>({
    email: '',
    phone: '',
    jobDescription: ''
  });
  
  // Generated resume data
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to access the resume builder');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/students/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserProfile(response.data.data);
        // Pre-fill email and phone if available
        const profileData = response.data.data;
        setResumeRequest(prev => ({
          ...prev,
          email: profileData.email || prev.email,
          phone: profileData.phoneNumber || prev.phone
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Don't show error here, user can still use the builder
    }
  };

  const handleInputChange = (field: keyof ResumeRequest, value: string) => {
    setResumeRequest(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear any previous errors
    setError(null);
  };

  const generateResumeWithAI = async () => {
    if (!resumeRequest.email || !resumeRequest.phone || !resumeRequest.jobDescription) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the AI resume generation endpoint
      const response = await axios.post('http://localhost:5001/api/ai-resume/generate-ai', {
        email: resumeRequest.email,
        phone: resumeRequest.phone,
        jobDescription: resumeRequest.jobDescription,
        includeProfileData: true
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setGeneratedResume(response.data.data.resume);
        setCurrentStep(2);
        setSuccess('Resume generated successfully using AI!');
      } else {
        setError(response.data.message || 'Failed to generate resume');
      }
    } catch (error: any) {
      console.error('Error generating resume:', error);
      setError(
        error.response?.data?.message || 
        'Failed to generate resume. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadResumePDF = async () => {
    if (!generatedResume) return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/ai-resume/download-pdf', {
        resume: generatedResume,
        format: 'professional'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AI_Generated_Resume_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('Resume downloaded successfully!');
    } catch (error) {
      setError('Failed to download resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendViaWhatsApp = async () => {
    if (!generatedResume) return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/api/wabb/create-resume', {
        email: resumeRequest.email,
        phone: resumeRequest.phone,
        jobDescription: resumeRequest.jobDescription
      });

      if (response.data.success) {
        setSuccess('Resume sent to your WhatsApp successfully!');
      } else {
        setError(response.data.message || 'Failed to send resume via WhatsApp');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send resume via WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const resetBuilder = () => {
    setCurrentStep(1);
    setGeneratedResume(null);
    setError(null);
    setSuccess(null);
    setResumeRequest({
      email: userProfile?.email || '',
      phone: userProfile?.phoneNumber || '',
      jobDescription: ''
    });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-start mb-4">
              <div></div>
              <h1 className="text-4xl font-bold text-gray-900">
                🤖 AI-Powered Resume Builder
              </h1>
              <button
                onClick={() => setShowResumeHistory(true)}
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                📁 Resume History
              </button>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Create tailored resumes using Claude AI based on job descriptions and your profile
            </p>
            
            {/* Progress Indicator */}
            <div className="flex justify-center items-center space-x-4 mb-8">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${
                currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
            </div>
            
            <div className="flex justify-center space-x-8 text-sm text-gray-600">
              <span className={currentStep >= 1 ? 'text-purple-600 font-medium' : ''}>
                Input Details
              </span>
              <span className={currentStep >= 2 ? 'text-purple-600 font-medium' : ''}>
                Review & Download
              </span>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Input Form */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                📝 Resume Details
              </h2>

              {/* User Profile Info */}
              {userProfile && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-800 mb-2">
                    ✅ Profile Data Found
                  </h3>
                  <p className="text-blue-600 text-sm">
                    We'll use your profile information to create a comprehensive resume.
                    Name: {userProfile.firstName} {userProfile.lastName}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📧 Email Address *
                  </label>
                  <input
                    type="email"
                    value={resumeRequest.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📱 Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={resumeRequest.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>

                {/* Job Description Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💼 Job Description *
                  </label>
                  <textarea
                    value={resumeRequest.jobDescription}
                    onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Paste the complete job description here. Include requirements, responsibilities, and qualifications. The AI will analyze this to tailor your resume accordingly..."
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Tip: Include the full job posting for best results. The AI will match your skills and experience to the requirements.
                  </p>
                </div>

                {/* AI Analysis Preview */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-medium text-purple-800 mb-2">
                    🤖 AI Analysis Will Include:
                  </h3>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Job requirements matching to your profile</li>
                    <li>• Skill highlighting based on job description</li>
                    <li>• Experience optimization for the role</li>
                    <li>• Tailored professional summary</li>
                    <li>• Keyword optimization for ATS systems</li>
                  </ul>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateResumeWithAI}
                  disabled={loading || !resumeRequest.email || !resumeRequest.phone || !resumeRequest.jobDescription}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating Resume with AI...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Generate AI Resume
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Resume Preview & Download */}
          {currentStep === 2 && generatedResume && (
            <div className="space-y-6">
              {/* Resume Preview */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    📄 Generated Resume Preview
                  </h2>
                  <button
                    onClick={resetBuilder}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    ← Create New Resume
                  </button>
                </div>

                {/* Resume Content */}
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 max-h-96 overflow-y-auto">
                  {/* Personal Info */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {generatedResume.personalInfo.name}
                    </h1>
                    <div className="text-gray-600 mt-2">
                      <p>{generatedResume.personalInfo.email} | {generatedResume.personalInfo.phone}</p>
                      {generatedResume.personalInfo.location && (
                        <p>{generatedResume.personalInfo.location}</p>
                      )}
                      {(generatedResume.personalInfo.linkedin || generatedResume.personalInfo.github) && (
                        <p>
                          {generatedResume.personalInfo.linkedin && (
                            <span>{generatedResume.personalInfo.linkedin}</span>
                          )}
                          {generatedResume.personalInfo.github && (
                            <span className="ml-4">{generatedResume.personalInfo.github}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Professional Summary</h2>
                    <p className="text-gray-700">{generatedResume.summary}</p>
                  </div>

                  {/* Skills */}
                  {generatedResume.skills.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Technical Skills</h2>
                      <div className="flex flex-wrap gap-2">
                        {generatedResume.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {generatedResume.experience.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Professional Experience</h2>
                      {generatedResume.experience.map((exp, index) => (
                        <div key={index} className="mb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{exp.title}</h3>
                              <p className="text-purple-600">{exp.company}</p>
                            </div>
                            <span className="text-gray-500 text-sm">{exp.duration}</span>
                          </div>
                          <ul className="mt-2 text-gray-700 text-sm space-y-1">
                            {(Array.isArray(exp.description) ? exp.description : [exp.description || 'No description available']).map((desc, idx) => (
                              <li key={idx}>• {desc}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {generatedResume.education.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Education</h2>
                      {generatedResume.education.map((edu, index) => (
                        <div key={index} className="mb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                              <p className="text-purple-600">{edu.institution}</p>
                            </div>
                            <span className="text-gray-500 text-sm">{edu.year}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {generatedResume.projects.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Key Projects</h2>
                      {generatedResume.projects.map((project, index) => (
                        <div key={index} className="mb-4">
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <p className="text-gray-700 text-sm mt-1">{project.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.technologies.map((tech, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  📥 Download Your Resume
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={downloadResumePDF}
                    disabled={loading}
                    className="bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">📄</span>
                        Download PDF
                      </>
                    )}
                  </button>

                  <button
                    onClick={sendViaWhatsApp}
                    disabled={loading}
                    className="bg-green-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <span className="mr-2">📱</span>
                    Send via WhatsApp
                  </button>
                </div>

                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">
                    🎯 AI Optimization Complete
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Resume tailored to job requirements</li>
                    <li>• Keywords optimized for ATS systems</li>
                    <li>• Skills prioritized based on job description</li>
                    <li>• Professional format and structure</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Resume History Modal */}
      <ResumeHistory 
        isOpen={showResumeHistory}
        onClose={() => setShowResumeHistory(false)}
      />
      
      <Footer />
    </>
  );
};

export default AIResumeBuilder;
