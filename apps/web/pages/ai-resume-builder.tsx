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
        const downloadUrl = `${API_BASE_URL}/api/ai-resume-builder/download-pdf-public/${generatedResumeId}`;
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

  const shareOnWhatsApp = async () => {
    if (!generatedResume || !generatedResumeId) return;

    try {
      console.log('📱 Sharing resume via WABB webhook:', generatedResumeId);
      
      // Call the new WhatsApp share endpoint
      const response = await axios.post(`${API_BASE_URL}/api/generated-resume/whatsapp-share`, {
        resumeId: generatedResumeId
      });

      if (response.data.success) {
        if (response.data.data.whatsappUrl) {
          // Open WhatsApp with pre-filled message
          window.open(response.data.data.whatsappUrl, '_blank');
          setSuccess('WhatsApp opened with resume details!');
        } else {
          setSuccess('Resume shared successfully on WhatsApp!');
        }
        console.log('✅ WhatsApp share initiated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to share');
      }
    } catch (error: any) {
      console.error('❌ Error sharing on WhatsApp:', error);
      setError('Failed to share resume on WhatsApp: ' + (error.response?.data?.message || error.message));
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
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
    <Navbar />

    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600">
          🤖 AI‑Powered Resume Builder
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-slate-600/90 max-w-3xl mx-auto leading-relaxed">
          Generate professional, tailored resumes using advanced AI technology.
          Simply provide your details and job description, and let our AI craft a polished resume for you.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-10">
        <button
          onClick={() => setShowResumeHistory(true)}
          className="group inline-flex items-center gap-2 bg-indigo-600 text-white px-5 sm:px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/80"
        >
          <span className="text-lg">📋</span>
          <span className="font-semibold">View Resume History</span>
          <span className="opacity-0 -ml-1 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">→</span>
        </button>

        {currentStep === 2 && (
          <button
            onClick={resetBuilder}
            className="inline-flex items-center gap-2 bg-white text-slate-800 px-5 sm:px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70"
          >
            <span className="text-lg">🔄</span>
            <span className="font-semibold">Create New Resume</span>
          </button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl border border-red-200/70 bg-red-50/70 text-red-800 shadow-sm">
          <p className="font-medium">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl border border-emerald-200/70 bg-emerald-50/70 text-emerald-800 shadow-sm">
          <p className="font-medium">✅ {success}</p>
        </div>
      )}

      {/* Step 1: Input Form */}
      {currentStep === 1 && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Tell us about yourself</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={resumeRequest.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-transparent focus:ring-2 focus:ring-indigo-500/80 outline-none transition-shadow placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={resumeRequest.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-transparent focus:ring-2 focus:ring-indigo-500/80 outline-none transition-shadow placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Job Description / Position Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={resumeRequest.jobDescription}
                onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                placeholder="Paste the job description or describe the role you're applying for..."
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-transparent focus:ring-2 focus:ring-indigo-500/80 outline-none transition-shadow placeholder:text-slate-400 resize-vertical"
                required
              />
              <p className="text-sm text-slate-500 mt-2">
                The more detailed the job description, the better we can tailor your resume.
              </p>
            </div>

            <button
              onClick={generateResumeWithAI}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white py-4 px-6 rounded-2xl shadow-lg shadow-fuchsia-600/20 hover:shadow-xl hover:shadow-fuchsia-600/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/80"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="mr-3 h-6 w-6 rounded-full border-2 border-white border-b-transparent animate-spin"></span>
                  Generating Your AI Resume...
                </span>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Generate AI Resume</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Generated Resume Preview */}
      {currentStep === 2 && generatedResume && (
        <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Your AI‑Generated Resume</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadResumePDF}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 sm:px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80"
              >
                <span className="text-lg">📥</span>
                <span className="font-semibold">{loading ? 'Downloading...' : 'Download PDF'}</span>
              </button>
              
              <button
                onClick={shareOnWhatsApp}
                disabled={!generatedResumeId}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-5 sm:px-6 py-3 rounded-xl shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/80"
              >
                <span className="text-lg">📱</span>
                <span className="font-semibold">Send to WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Resume Preview */}
          <div className="border border-slate-200 rounded-xl p-4 sm:p-6 bg-slate-50/70 max-h-[32rem] overflow-y-auto shadow-inner">
            {/* Personal Info */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {generatedResume.personalInfo.name}
              </h1>
              <div className="text-slate-600 mt-2 space-y-1">
                <p className="text-sm sm:text-base">
                  {generatedResume.personalInfo.email} | {generatedResume.personalInfo.phone}
                </p>
                {generatedResume.personalInfo.location && (
                  <p className="text-sm sm:text-base">{generatedResume.personalInfo.location}</p>
                )}
                {(generatedResume.personalInfo.linkedin || generatedResume.personalInfo.github) && (
                  <p className="text-sm sm:text-base space-x-4">
                    {generatedResume.personalInfo.linkedin && (
                      <span className="underline underline-offset-2 decoration-slate-300 hover:text-slate-900 transition-colors">
                        {generatedResume.personalInfo.linkedin}
                      </span>
                    )}
                    {generatedResume.personalInfo.github && (
                      <span className="underline underline-offset-2 decoration-slate-300 hover:text-slate-900 transition-colors">
                        {generatedResume.personalInfo.github}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Professional Summary</h2>
              <p className="text-slate-700 leading-relaxed">{generatedResume.summary}</p>
            </div>

            {/* Skills */}
            {generatedResume.skills.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Technical Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {generatedResume.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
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
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Professional Experience</h2>
                {generatedResume.experience.map((exp, index) => (
                  <div key={index} className="mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                        <p className="text-slate-600">{exp.company}</p>
                      </div>
                      <span className="text-sm text-slate-500 mt-1 sm:mt-0">{exp.duration}</span>
                    </div>
                    <ul className="mt-2 text-slate-700 text-sm space-y-1.5 list-disc pl-5">
                      {exp.description.map((desc, i) => (
                        <li key={i}>{desc}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {generatedResume.education.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Education</h2>
                {generatedResume.education.map((edu, index) => (
                  <div key={index} className="mb-2">
                    <h3 className="font-medium text-slate-900">{edu.degree}</h3>
                    <p className="text-slate-600">{edu.institution} — {edu.year}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {generatedResume.projects.length > 0 && (
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Projects</h2>
                {generatedResume.projects.map((project, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="font-medium text-slate-900">{project.name}</h3>
                    <p className="text-slate-700 text-sm mt-1 leading-relaxed">{project.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Technologies: {project.technologies.join(', ')}
                    </p>
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