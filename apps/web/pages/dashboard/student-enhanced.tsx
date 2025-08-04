'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';

const StudentDashboardContent = () => {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<any>(null);
  const [jobMatches, setJobMatches] = useState<any[]>([]);
  const [showJobRecommendations, setShowJobRecommendations] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Try to get student profile
      try {
        const response = await axios.get('http://localhost:5001/api/students/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudentInfo(response.data.data || response.data);
        
        if (response.data.data?.resumeAnalysis) {
          setResumeInfo(response.data.data.resumeAnalysis);
        }
      } catch (profileError) {
        console.log('Student profile not found, using basic info');
        // Fallback to basic info from token or create placeholder
        setStudentInfo({
          personalInfo: {
            firstName: 'Student'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Failed to load student information');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    setResumeUploading(true);
    setError(null);
    
    try {
      console.log(`Starting resume upload: ${file.name} (${file.size} bytes)`);
      
      const formData = new FormData();
      formData.append('resume', file);
      
      const token = localStorage.getItem('token');
      
      // Show progress message
      console.log('📤 Uploading and analyzing resume...');
      
      const response = await axios.post('http://localhost:5001/api/students/analyze-resume', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000, // 2 minutes timeout for resume processing
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      });

      if (response.data.success) {
        setResumeInfo(response.data.data);
        setSuccessMessage('Resume uploaded and analyzed successfully! Your profile has been updated with extracted information.');
        setTimeout(() => setSuccessMessage(null), 5000);
        console.log('✅ Resume upload completed successfully');
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      
      let errorMessage = 'Failed to upload resume. Please try again.';
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Upload is taking longer than expected. The file is being processed in the background. Please refresh the page in a few minutes.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File is too large. Please choose a smaller PDF file (max 5MB).';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid file format. Please upload a PDF file.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error during processing. Please try again or contact support.';
      }
      
      setError(errorMessage);
      setTimeout(() => setError(null), 8000);
      
      // Fallback demo for development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Using demo analysis');
        const demoAnalysis = {
          skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'MongoDB'],
          category: 'Software Development',
          experienceLevel: 'Entry Level',
          summary: 'Experienced in web development with strong frontend and backend skills'
        };
        setResumeInfo(demoAnalysis);
        setSuccessMessage('Resume analyzed successfully! (Demo mode - Connect your AI service for full functionality)');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } finally {
      setResumeUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        handleResumeUpload(file);
      } else {
        setError('Please select a PDF file only.');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const fetchJobRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to get job recommendations');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/students/job-matches', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setJobMatches(response.data.data || []);
        setShowJobRecommendations(true);
      }
    } catch (error) {
      console.error('Error fetching job recommendations:', error);
      setError('Failed to fetch job recommendations');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-7xl mx-auto">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* AI Career Alert System Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">AI Career Alert System</h2>
                <p className="text-purple-100">
                  Upload your resume to get personalized job matches with WhatsApp notifications
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{jobMatches.length || 0}</div>
              <div className="text-sm text-purple-100">Job Matches</div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-blue-700 mb-8">
          Welcome, {studentInfo?.personalInfo?.firstName || 'Student'} 👋
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Resume Upload & AI Analysis */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">📄</span>
              Resume & AI Analysis
            </h2>
            
            {resumeInfo ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm font-medium">✅ Resume analyzed successfully!</p>
                  <p className="text-green-600 text-xs mt-1">AI matching active for job alerts</p>
                </div>
                
                {resumeInfo.skills && resumeInfo.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">🎯 Detected Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {resumeInfo.skills.slice(0, 6).map((skill: string, idx: number) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {resumeInfo.skills.length > 6 && (
                        <span className="text-gray-400 text-xs">+{resumeInfo.skills.length - 6} more</span>
                      )}
                    </div>
                  </div>
                )}
                
                {resumeInfo.category && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">📂 Category:</p>
                    <span className="text-sm text-gray-600">{resumeInfo.category}</span>
                  </div>
                )}
                
                <button
                  onClick={() => document.getElementById('resume-upload')?.click()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Update Resume
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Upload your resume for AI-powered job matching and WhatsApp alerts</p>
                
                {resumeUploading ? (
                  <div className="border-2 border-blue-300 border-dashed rounded-lg p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-blue-600 text-sm">Analyzing resume with AI...</p>
                  </div>
                ) : (
                  <div 
                    onClick={() => document.getElementById('resume-upload')?.click()}
                    className="border-2 border-gray-300 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <div className="text-gray-400 text-2xl mb-2">📁</div>
                    <p className="text-gray-600 text-sm mb-1">Click to upload PDF resume</p>
                    <p className="text-gray-400 text-xs">AI will analyze & extract skills</p>
                  </div>
                )}
                
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <a
                  href="/resume-builder"
                  className="text-blue-600 hover:underline text-sm font-medium block text-center"
                >
                  Or use Resume Builder →
                </a>
              </div>
            )}
          </div>

          {/* Job Recommendations with AI Matching - On Demand */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">🎯</span>
              AI Job Recommendations
            </h2>
            
            {!showJobRecommendations ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm font-medium">🤖 Get personalized job matches</p>
                  <p className="text-blue-600 text-xs mt-1">Click below to see jobs matched to your profile</p>
                </div>
                
                <button
                  onClick={fetchJobRecommendations}
                  disabled={loadingRecommendations || !resumeInfo}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingRecommendations ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading Recommendations...
                    </span>
                  ) : (
                    'Get AI Job Recommendations'
                  )}
                </button>
                
                {!resumeInfo && (
                  <p className="text-xs text-gray-500 text-center">
                    Upload your resume first to get personalized recommendations
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-green-800 text-sm font-medium">✅ {jobMatches.length} jobs found</p>
                    <p className="text-green-600 text-xs mt-1">Based on your profile analysis</p>
                  </div>
                  <button
                    onClick={() => setShowJobRecommendations(false)}
                    className="text-green-600 hover:text-green-800 text-xs"
                  >
                    Hide
                  </button>
                </div>
                
                {jobMatches.length > 0 ? (
                  <ul className="text-sm text-gray-600 space-y-2 max-h-40 overflow-y-auto">
                    {jobMatches.slice(0, 5).map((job, index) => (
                      <li key={index} className="flex items-center">
                        <span className={`mr-2 ${job.matchPercentage >= 80 ? 'text-green-500' : job.matchPercentage >= 70 ? 'text-yellow-500' : 'text-gray-400'}`}>●</span>
                        {job.jobTitle} at {job.company} ({job.matchPercentage}% match)
                      </li>
                    ))}
                    {jobMatches.length > 5 && (
                      <li className="text-xs text-gray-400 text-center pt-2">
                        +{jobMatches.length - 5} more jobs available
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No job matches found. Try updating your skills or profile.</p>
                )}
              </div>
            )}
            
            <a
              href="/jobs"
              className="text-blue-600 hover:underline text-sm font-medium block mt-3"
            >
              View All Jobs →
            </a>
          </div>

          {/* Career Alert Settings */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">📱</span>
              WhatsApp Alerts
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Job Alerts</span>
                <div className="w-10 h-6 bg-green-500 rounded-full flex items-center">
                  <div className="w-4 h-4 bg-white rounded-full ml-5"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Match Threshold</span>
                <span className="text-sm font-medium text-blue-600">70%+</span>
              </div>
              
              <p className="text-xs text-gray-500">
                You'll receive WhatsApp notifications when new jobs match your profile (70%+) or when companies post relevant openings
              </p>
              
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm">
                Manage Settings
              </button>
            </div>
          </div>

          {/* Application Updates */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">📋</span>
              Applications
            </h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">2 pending, 1 shortlisted 🎉</p>
              <div className="flex space-x-2">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Pending</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Shortlisted</span>
              </div>
            </div>
            <a
              href="/applications"
              className="text-blue-600 hover:underline text-sm font-medium block mt-3"
            >
              Check Status →
            </a>
          </div>

          {/* Profile Completion */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">👤</span>
              Profile
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion</span>
                <span className="text-sm font-medium text-blue-600">{resumeInfo ? '85%' : '45%'}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`bg-blue-600 h-2 rounded-full ${resumeInfo ? 'w-[85%]' : 'w-[45%]'}`}></div>
              </div>
              
              <ul className="text-xs text-gray-500 space-y-1">
                <li className="flex items-center">
                  <span className="text-green-500 mr-1">✓</span>
                  Basic info completed
                </li>
                <li className="flex items-center">
                  <span className={`${resumeInfo ? 'text-green-500' : 'text-gray-400'} mr-1`}>
                    {resumeInfo ? '✓' : '○'}
                  </span>
                  Resume uploaded
                </li>
                <li className="flex items-center">
                  <span className="text-gray-400 mr-1">○</span>
                  Portfolio added
                </li>
              </ul>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm mt-3">
              Complete Profile
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button className="w-full text-left text-blue-600 hover:text-blue-800 text-sm py-2 px-3 hover:bg-blue-50 rounded">
                📄 Update Resume
              </button>
              <button className="w-full text-left text-blue-600 hover:text-blue-800 text-sm py-2 px-3 hover:bg-blue-50 rounded">
                🔍 Browse Jobs
              </button>
              <button className="w-full text-left text-blue-600 hover:text-blue-800 text-sm py-2 px-3 hover:bg-blue-50 rounded">
                📱 Alert Settings
              </button>
              <button className="w-full text-left text-blue-600 hover:text-blue-800 text-sm py-2 px-3 hover:bg-blue-50 rounded">
                💬 Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default function StudentDashboard() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}
