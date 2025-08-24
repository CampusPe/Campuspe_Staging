'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ResumeHistory from '../components/ResumeHistory';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';

interface ResumeRequest {
  email: string;
  phone: string;
  jobDescription: string;
}

interface UserProfile {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
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
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch user profile on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      if (typeof window === 'undefined') return; // Skip during SSR
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to access the resume builder');
        return;
      }

      console.log('🔍 Fetching user profile...');
      console.log('📡 API Base URL:', API_BASE_URL);

      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_PROFILE}`, {
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
        console.log('✅ User profile loaded');
      }
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error);
      if (error.response?.status === 401) {
        setError('Please login to access the resume builder');
      }
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
    setSuccess(null);

    try {
      if (typeof window === 'undefined') {
        setError('Resume generation requires client-side execution');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to generate resumes');
        return;
      }

      console.log('🚀 Generating AI resume...');
      console.log('� Request data:', {
        email: resumeRequest.email,
        phone: resumeRequest.phone,
        jobDescription: resumeRequest.jobDescription.substring(0, 100) + '...'
      });

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AI_RESUME_GENERATE}`, {
        email: resumeRequest.email,
        phone: resumeRequest.phone,
        jobDescription: resumeRequest.jobDescription,
        includeProfileData: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 AI Resume Response:', response.data);

      if (response.data.success) {
        setGeneratedResume(response.data.data.resume);
        setGeneratedResumeId(response.data.data.resumeId);
        setCurrentStep(2);
        setSuccess('Resume generated successfully using AI!');
        console.log('✅ Resume generated successfully');
        console.log('📋 Resume ID:', response.data.data.resumeId);
      } else {
        setError(response.data.message || 'Failed to generate resume');
      }
    } catch (error: any) {
      console.error('❌ Error generating resume:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        setError('Please login to access the resume builder');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to generate resume. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadResumePDF = async () => {
    if (!generatedResume) return;

    setLoading(true);
    try {
      if (typeof window === 'undefined') {
        setError('PDF download requires client-side execution');
        return;
      }

      let response;
      
      console.log('📥 Downloading resume PDF...');
      console.log('📋 Resume ID:', generatedResumeId);

      // If we have a generatedResumeId, use the public download endpoint
      if (generatedResumeId) {
        const downloadUrl = `${API_BASE_URL}/api/generated-resume/download-public/${generatedResumeId}`;
        console.log('🔗 Download URL:', downloadUrl);
        
        response = await axios.get(downloadUrl, {
          responseType: 'blob'
        });
      } else {
        // Fallback to the AI resume builder download endpoint
        const token = localStorage.getItem('token');
        response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AI_RESUME_DOWNLOAD}`, {
          resume: generatedResume
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        });
      }

      // Create blob URL for download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const fileName = generatedResumeId 
        ? `Resume_${generatedResumeId}_${Date.now()}.pdf`
        : `AI_Resume_${Date.now()}.pdf`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Resume downloaded successfully');
      setSuccess('Resume downloaded successfully!');
    } catch (error: any) {
      console.error('❌ Error downloading resume:', error);
      setError('Failed to download resume: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetBuilder = () => {
    setCurrentStep(1);
    setGeneratedResume(null);
    setGeneratedResumeId(null);
    setError(null);
    setSuccess(null);
    setResumeRequest({
      email: userProfile?.email || '',
      phone: userProfile?.phoneNumber || '',
      jobDescription: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 AI-Powered Resume Builder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate professional, tailored resumes using advanced AI technology. 
            Simply provide your details and job description, and let our AI create the perfect resume for you.
          </p>
        </div>

        {/* Debug Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Debug Information:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>API Base URL:</strong> {API_BASE_URL}</p>
            <p><strong>User Logged In:</strong> {typeof window !== 'undefined' && localStorage.getItem('token') ? 'Yes' : 'No'}</p>
            <p><strong>Profile Loaded:</strong> {userProfile ? 'Yes' : 'No'}</p>
            <p><strong>Current Step:</strong> {currentStep}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setShowResumeHistory(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            📋 View Resume History
          </button>
          
          {currentStep === 2 && (
            <button
              onClick={resetBuilder}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Create New Resume
            </button>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✅ {success}</p>
          </div>
        )}

        {/* Step 1: Input Form */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell us about yourself</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={resumeRequest.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={resumeRequest.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description / Position Details *
                </label>
                <textarea
                  value={resumeRequest.jobDescription}
                  onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                  placeholder="Paste the job description here, or describe the type of position you're applying for..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  The more detailed the job description, the better our AI can tailor your resume.
                </p>
              </div>

              <button
                onClick={generateResumeWithAI}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Generating Your AI Resume...
                  </span>
                ) : (
                  '🚀 Generate AI Resume'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generated Resume Preview */}
        {currentStep === 2 && generatedResume && (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your AI-Generated Resume</h2>
              <div className="space-x-3">
                <button
                  onClick={downloadResumePDF}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Downloading...' : '📥 Download PDF'}
                </button>
              </div>
            </div>

            {/* Resume Preview */}
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
                          <p className="text-gray-600">{exp.company}</p>
                        </div>
                        <span className="text-sm text-gray-500">{exp.duration}</span>
                      </div>
                      <ul className="mt-2 text-gray-700 text-sm space-y-1">
                        {exp.description.map((desc, i) => (
                          <li key={i}>• {desc}</li>
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
                      <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                      <p className="text-gray-600">{edu.institution} - {edu.year}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {generatedResume.projects.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Projects</h2>
                  {generatedResume.projects.map((project, index) => (
                    <div key={index} className="mb-4">
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <p className="text-gray-700 text-sm mt-1">{project.description}</p>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          Technologies: {project.technologies.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resume History Modal */}
      <ResumeHistory 
        isOpen={showResumeHistory} 
        onClose={() => setShowResumeHistory(false)} 
      />

      <Footer />
    </div>
  );
};

export default AIResumeBuilder;