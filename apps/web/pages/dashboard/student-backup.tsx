'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import ResumeBuilderCard from '../../components/ResumeBuilderCard';
import { API_ENDPOINTS, API_BASE_URL } from '../../utils/api';
import { useResumeUpload } from '../../components/ResumeUpload';

const StudentDashboardContent = () => {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<any>(null);
  const [jobMatches, setJobMatches] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [resumeAnalyses, setResumeAnalyses] = useState<any[]>([]);
  const [showAnalyses, setShowAnalyses] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [expandedAnalysisSkills, setExpandedAnalysisSkills] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    fetchStudentData();
    fetchResumeAnalyses();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('Token found, attempting to fetch profile...');

      // Try to get student profile with better error handling
      try {
        console.log('Fetching student profile...');
        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_PROFILE}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });
        
        console.log('Profile response:', response.data);
        
        // Check if we have valid data
        if (response.data.success && response.data.data) {
          setStudentInfo(response.data.data);
          
          if (response.data.data.resumeAnalysis) {
            setResumeInfo(response.data.data.resumeAnalysis);
          }
        } else {
          console.log('Profile response did not contain expected data structure:', response.data);
          // Fallback to basic info
          setStudentInfo({
            personalInfo: {
              firstName: 'Student'
            }
          });
        }
        
        // Also fetch job matches with better error handling
        console.log('Fetching job matches...');
        try {
          const matchesResponse = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_JOB_MATCHES}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          console.log('Matches response:', matchesResponse.data);
          
          if (matchesResponse.data.success && matchesResponse.data.data && matchesResponse.data.data.matches) {
            // Process matches to ensure all data is properly formatted
            const processedMatches = matchesResponse.data.data.matches.map((match: any) => {
              // Handle salary if it's an object
              if (match.salary && typeof match.salary === 'object') {
                const { min, max, currency } = match.salary;
                match.salary = `${min}-${max} ${currency || ''}`.trim();
              }
              
              // Ensure company name exists
              if (!match.company) {
                match.company = 'Company';
              }
              
              return match;
            });
            
            setJobMatches(processedMatches || []);
          } else {
            console.log('No matches found or invalid response structure');
            setJobMatches([]);
          }
        } catch (matchError: any) {
          console.error('Error fetching job matches:', matchError);
          
          // Check for authentication error in job matches
          if (matchError.response && matchError.response.status === 401) {
            console.log('Job matches: Authentication error, redirecting to login');
            localStorage.removeItem('token');
            router.push('/login');
            return;
          }
          
          setJobMatches([]);
        }
        
      } catch (profileError: any) {
        console.log('Student profile fetch error:', profileError);
        
        // Log detailed error information
        if (profileError.response) {
          console.log('Error response status:', profileError.response.status);
          console.log('Error response data:', profileError.response.data);
        }
        
        // Check if it's a 401 Unauthorized error
        if (profileError.response && profileError.response.status === 401) {
          console.log('Authentication error, redirecting to login');
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        
        // For 400 errors, might be token format or user not found
        if (profileError.response && profileError.response.status === 400) {
          console.log('Bad request error - might be invalid token format');
          // Try to continue with fallback data instead of redirecting
          setStudentInfo({
            personalInfo: {
              firstName: 'Student'
            }
          });
          // Show error message to user
          setError('Profile data unavailable. Please try logging out and logging back in.');
        } else {
          // Fallback to basic info from token or create placeholder
          setStudentInfo({
            personalInfo: {
              firstName: 'Student'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Failed to load student information. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeAnalyses = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) return;

      // First get student ID
      const studentResponse = await axios.get(`${API_BASE_URL}/api/students/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (studentResponse.data && studentResponse.data._id) {
        const analysesResponse = await axios.get(`${API_BASE_URL}/api/students/${studentResponse.data._id}/resume-analyses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (analysesResponse.data.success) {
          setResumeAnalyses(analysesResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching resume analyses:', error);
    }
  };

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev.slice(-9), `${timestamp}: ${info}`]);
  };

  // Resume upload hook with enhanced success handling
  const resumeUpload = useResumeUpload({
    onUploadSuccess: (analysis) => {
      addDebugInfo('Upload successful, updating resume info');
      console.log('Resume upload successful with analysis:', analysis);
      
      // Handle new AI endpoint response structure
      const skillsArray = analysis.skills || [];
      const skillsCount = analysis.skillsCount || skillsArray.length || 0;
      
      // Extract skill names from the new object format: [{ name, level, category }, ...]
      const skillNames = skillsArray.map((skill: any) => 
        typeof skill === 'string' ? skill : skill.name || skill
      );
      const skillsPreview = skillNames.slice(0, 5).join(', ') || 'N/A';
      
      // Map new AI analysis to legacy format for existing UI components
      const legacyAnalysis = {
        ...analysis,
        skills: skillNames, // Convert to string array for legacy compatibility
        category: analysis.analysisMetadata?.suggestedJobCategory || 'General',
        experienceLevel: analysis.jobPreferences?.experienceLevel || 'Entry Level',
        summary: `${analysis.analysisMetadata?.extractionMethod === 'AI' ? 'AI-Powered Analysis: ' : ''}` +
                 `${analysis.analysisMetadata?.confidence || 70}% confidence. ` +
                 `${analysis.analysisMetadata?.totalYearsExperience || 0} years experience in ${analysis.analysisMetadata?.primarySkillCategory || 'general'}.`,
        analysisQuality: analysis.analysisMetadata?.extractionMethod === 'AI' ? 'AI-Enhanced' : 'Standard',
        profileCompleteness: analysis.profileCompleteness || 70
      };
      
      setResumeInfo(legacyAnalysis);
      
      const quality = legacyAnalysis.analysisQuality;
      const confidence = analysis.analysisMetadata?.confidence || 70;
      
      setSuccessMessage(
        `🎉 Resume analyzed successfully with ${quality} processing! ` +
        `Found ${skillsCount} skills across ${analysis.analysisMetadata?.primarySkillCategory || 'multiple'} categories. ` +
        `Skills: ${skillsPreview}${skillsCount > 5 ? ', ...' : ''}. ` +
        `Analysis confidence: ${confidence}%. Profile completeness: ${legacyAnalysis.profileCompleteness}%`
      );
      setTimeout(() => setSuccessMessage(null), 12000);
      
      // Refresh job matches and profile data after successful upload
      addDebugInfo(`AI analysis complete (${quality}), refreshing matches...`);
      setTimeout(() => {
        fetchStudentData(); // This will fetch both profile and job matches
      }, 1500); // Give the backend time to process job matching
    },
    onUploadError: (errorMessage) => {
      addDebugInfo(`Upload error: ${errorMessage}`);
      console.error('Resume upload error:', errorMessage);
      setError(errorMessage);
      setTimeout(() => setError(null), 8000);
    },
    isUploading: resumeUploading,
    setIsUploading: setResumeUploading
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addDebugInfo('File input changed event triggered');
    console.log('File input changed:', e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      addDebugInfo(`File selected: ${file.name} (${file.type}, ${file.size} bytes)`);
      console.log('File selected:', file.name, file.type, file.size);
      resumeUpload.handleFileSelect(file);
    } else {
      addDebugInfo('No file selected from input');
      console.log('No file selected');
    }
    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  const handleResumeButtonClick = () => {
    addDebugInfo('Resume button clicked');
    console.log('Resume button clicked');
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    console.log('File input element:', fileInput);
    if (fileInput) {
      addDebugInfo('File input found, triggering click');
      fileInput.click();
      console.log('File input clicked');
    } else {
      addDebugInfo('ERROR: File input element not found');
      console.error('File input not found');
      setError('Upload button not working. Please refresh the page.');
    }
  };

  const handleDirectFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addDebugInfo('Direct file input used');
    handleFileSelect(e);
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

        {/* Debug Panel - only show if there are debug messages */}
        {debugInfo.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-yellow-800 font-medium mb-2">Debug Information:</h3>
            <div className="text-yellow-700 text-sm space-y-1 max-h-32 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index}>{info}</div>
              ))}
            </div>
            <button 
              onClick={() => setDebugInfo([])}
              className="mt-2 text-xs text-yellow-600 hover:text-yellow-800"
            >
              Clear Debug Info
            </button>
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

        {/* New Feature Announcement: AI Resume Builder */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                <span className="text-lg">✨</span>
              </div>
              <div>
                <h3 className="font-semibold">NEW: AI Resume Builder</h3>
                <p className="text-sm text-indigo-100">
                  Create tailored resumes for specific jobs with AI assistance
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/ai-resume-builder')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              Try Now →
            </button>
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
                    <p className="text-sm font-medium text-gray-700 mb-2">🎯 Detected Skills ({resumeInfo.skills.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {(showAllSkills ? resumeInfo.skills : resumeInfo.skills.slice(0, 6)).map((skill: string, idx: number) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                      {resumeInfo.skills.length > 6 && (
                        <button
                          onClick={() => setShowAllSkills(!showAllSkills)}
                          className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors font-medium border border-blue-200"
                        >
                          {showAllSkills ? 'Show Less ↑' : `+${resumeInfo.skills.length - 6} more skills ↓`}
                        </button>
                      )}
                    </div>
                    {resumeInfo.analysisQuality && (
                      <p className="text-xs text-gray-500 mt-1">
                        Analysis Quality: <span className={`font-medium ${
                          resumeInfo.analysisQuality === 'High' ? 'text-green-600' :
                          resumeInfo.analysisQuality === 'Medium' ? 'text-yellow-600' : 'text-gray-600'
                        }`}>
                          {resumeInfo.analysisQuality}
                        </span>
                        {resumeInfo.confidence && ` • Confidence: ${resumeInfo.confidence}%`}
                      </p>
                    )}
                  </div>
                )}
                
                {resumeInfo.category && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">📂 Category:</p>
                    <span className="text-sm text-gray-600">{resumeInfo.category}</span>
                  </div>
                )}
                
                <button
                  onClick={handleResumeButtonClick}
                  disabled={resumeUploading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {resumeUploading ? 'Updating...' : 'Update Resume'}
                </button>
                
                {/* Test button for direct file selection */}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleDirectFileSelect}
                  className="w-full mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">Use this file selector to upload your resume</p>
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
                    onClick={handleResumeButtonClick}
                    className="border-2 border-gray-300 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <div className="text-gray-400 text-2xl mb-2">📁</div>
                    <p className="text-gray-600 text-sm mb-1">Click to upload PDF resume</p>
                    <p className="text-gray-400 text-xs">AI will analyze & extract skills</p>
                  </div>
                )}
                
                <a
                  href="/resume-builder"
                  className="text-blue-600 hover:underline text-sm font-medium block text-center"
                >
                  Or use Resume Builder →
                </a>
              </div>
            )}
          </div>

          {/* Hidden file input for resume upload */}
          <input
            id="resume-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            style={{ display: 'none' }}
          />

          {/* AI Resume Builder */}
          <ResumeBuilderCard />

          {/* Resume History */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">📁</span>
              Resume History
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Access your last 3 AI-generated resumes, download or share them on WhatsApp
            </p>
            <button
              onClick={() => router.push('/ai-resume-builder')}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors text-sm font-medium"
            >
              View Resume History
            </button>
          </div>

          {/* Job Recommendations with AI Matching */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">🎯</span>
              AI Job Recommendations
            </h2>
            
            {resumeInfo && jobMatches.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm font-medium flex items-center">
                    <span className="mr-2">🤖</span>
                    AI matching active • Found {jobMatches.length} job matches
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Based on {resumeInfo.skills?.length || 0} detected skills • Quality: {resumeInfo.analysisQuality || 'Basic'}
                  </p>
                </div>
                
                <ul className="text-sm text-gray-600 space-y-2">
                  {jobMatches.slice(0, 3).map((match, index) => {
                    // Handle salary object if it's not already converted to string
                    if (match.salary && typeof match.salary === 'object') {
                      const { min, max, currency } = match.salary;
                      match.salary = `${min}-${max} ${currency || ''}`.trim();
                    }
                    
                    return (
                      <li key={index} className="flex items-center">
                        <span className={`mr-2 ${
                          match.matchPercentage >= 80 ? 'text-green-500' : 
                          match.matchPercentage >= 70 ? 'text-yellow-500' : 'text-orange-500'
                        }`}>●</span>
                        <div className="flex-1">
                          <span className="font-medium">{match.jobTitle}</span> at {match.company}
                          <span className="text-xs text-gray-500 ml-2">({match.matchPercentage}% match)</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                
                {jobMatches.length > 3 && (
                  <p className="text-xs text-gray-500">+{jobMatches.length - 3} more matches available</p>
                )}
              </div>
            ) : resumeInfo ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm font-medium">🤖 AI matching enabled</p>
                  <p className="text-blue-600 text-xs mt-1">You'll get WhatsApp alerts for relevant jobs</p>
                </div>
                
                <p className="text-sm text-gray-500">Finding matching opportunities... Check back soon!</p>
                
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">●</span>
                    Frontend Developer at TechCorp (85% match)
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">●</span>
                    Full Stack Intern at StartupXYZ (78% match)
                  </li>
                  <li className="flex items-center">
                    <span className="text-yellow-500 mr-2">●</span>
                    Software Engineer at BigTech (72% match)
                  </li>
                </ul>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">Upload your resume to get personalized AI-powered job recommendations</p>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>• Upload resume for smart matching</li>
                  <li>• Get WhatsApp job alerts</li>
                  <li>• AI analyzes your skills</li>
                </ul>
              </div>
            )}
            
            <a
              href="/jobs"
              className="text-blue-600 hover:underline text-sm font-medium block mt-3"
            >
              View All Jobs →
            </a>
          </div>

          {/* AI Resume Analysis Results */}
          {resumeAnalyses.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
              <h2 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">🎯</span>
                AI Match Results
              </h2>
              
              <div className="space-y-3 mb-4">
                {resumeAnalyses.slice(0, 3).map((analysis, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {analysis.jobTitle} at {analysis.companyName}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        analysis.matchScore >= 80 ? 'bg-green-100 text-green-800' :
                        analysis.matchScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {analysis.matchScore}% Match
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">{analysis.explanation}</p>
                    
                    {analysis.skillsMatched && analysis.skillsMatched.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(expandedAnalysisSkills[index] ? analysis.skillsMatched : analysis.skillsMatched.slice(0, 3)).map((skill: string, idx: number) => (
                          <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                        {analysis.skillsMatched.length > 3 && (
                          <button
                            onClick={() => setExpandedAnalysisSkills(prev => ({
                              ...prev,
                              [index]: !prev[index]
                            }))}
                            className="text-green-600 hover:text-green-800 text-xs bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors font-medium"
                          >
                            {expandedAnalysisSkills[index] ? 'Show Less' : `+${analysis.skillsMatched.length - 3} more`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {resumeAnalyses.length > 3 && (
                <button
                  onClick={() => setShowAnalyses(true)}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  View All {resumeAnalyses.length} Analyses →
                </button>
              )}
            </div>
          )}

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
                You'll receive WhatsApp notifications for jobs with 70%+ match to your profile
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
            <button 
              onClick={() => router.push('/profile/edit')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm mt-3"
            >
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
              <button 
                onClick={handleResumeButtonClick}
                className="w-full text-left text-blue-600 hover:text-blue-800 text-sm py-2 px-3 hover:bg-blue-50 rounded"
              >
                📄 Update Resume
              </button>
              <button 
                onClick={() => router.push('/ai-resume-builder')}
                className="w-full text-left text-purple-600 hover:text-purple-800 text-sm py-2 px-3 hover:bg-purple-50 rounded font-medium"
              >
                ✨ AI Resume Builder
              </button>
              <button 
                onClick={() => router.push('/jobs')}
                className="w-full text-left text-blue-600 hover:text-blue-800 text-sm py-2 px-3 hover:bg-blue-50 rounded"
              >
                🔍 Browse Jobs
              </button>
              <button 
                onClick={() => router.push('/profile/edit')}
                className="w-full text-left text-blue-600 hover:text-blue-800 text-sm py-2 px-3 hover:bg-blue-50 rounded"
              >
                👤 Edit Profile
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

        {/* Resume Analyses Modal */}
        {showAnalyses && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="mr-2">🎯</span>
                    AI Resume Match Results
                  </h3>
                  <button
                    onClick={() => setShowAnalyses(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {resumeAnalyses.map((analysis, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{analysis.jobTitle}</h4>
                          <p className="text-sm text-gray-600">{analysis.companyName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          analysis.matchScore >= 80 ? 'bg-green-100 text-green-800' :
                          analysis.matchScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {analysis.matchScore}% Match
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{analysis.explanation}</p>
                      
                      {analysis.suggestions && analysis.suggestions.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Suggestions:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {analysis.suggestions.slice(0, 2).map((suggestion: string, suggIdx: number) => (
                              <li key={suggIdx} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="space-y-3 text-sm">
                        {analysis.skillsMatched && analysis.skillsMatched.length > 0 && (
                          <div>
                            <span className="font-medium text-green-600 flex items-center mb-2">
                              <span className="mr-1">✅</span>
                              Matched Skills ({analysis.skillsMatched.length}):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {analysis.skillsMatched.map((skill: string, skillIdx: number) => (
                                <span key={skillIdx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {analysis.skillsGap && analysis.skillsGap.length > 0 && (
                          <div>
                            <span className="font-medium text-red-600 flex items-center mb-2">
                              <span className="mr-1">❌</span>
                              Skills Gap ({analysis.skillsGap.length}):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {analysis.skillsGap.map((skill: string, skillIdx: number) => (
                                <span key={skillIdx} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        Analyzed on {new Date(analysis.analyzedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t">
                  <button
                    onClick={() => setShowAnalyses(false)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
