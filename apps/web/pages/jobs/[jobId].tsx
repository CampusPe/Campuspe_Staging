'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

interface Location {
  city: string;
  state: string;
  country: string;
  workMode: string;
}

interface Requirement {
  skill: string;
  level: string;
  mandatory: boolean;
}

interface Salary {
  min: number;
  max: number;
  currency: string;
  negotiable: boolean;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  jobType: string;
  department: string;
  companyName: string;
  locations: Location[];
  requirements: Requirement[];
  experienceLevel: string;
  salary: Salary;
  benefits: string[];
  applicationDeadline: string;
  isUrgent: boolean;
  postedAt: string;
  workMode?: string;
  totalPositions?: number;
  filledPositions?: number;
  interviewProcess?: {
    rounds?: string[];
    duration?: string;
    mode?: string;
  };
}

export default function JobDetailsPage() {
  const router = useRouter();
  const { jobId } = router.query;

  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [showImprovements, setShowImprovements] = useState(false);
  const [improvements, setImprovements] = useState<any[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/jobs/${jobId}`);
        setJob(response.data);
      } catch (err) {
        setError('Job not found');
      }
    };

    const checkApplicationStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Check if user has already applied to this job
        const response = await axios.get(
          `http://localhost:5001/api/students/applications`, 
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (response.data.success) {
          const application = response.data.data.find((app: any) => app.jobId === jobId);
          if (application) {
            setHasApplied(true);
            setApplicationData(application);
            // If there's match analysis data, show it
            if (application.matchAnalysis) {
              setMatchResult(application.matchAnalysis);
            }
          }
        }
      } catch (err) {
        console.error('Error checking application status:', err);
      }
    };

    fetchJob();
    checkApplicationStatus();
  }, [jobId]);

    const handleApply = async () => {
    try {
      setApplying(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to apply for jobs');
        router.push('/login');
        return;
      }

      const response = await axios.post(
        `http://localhost:5001/api/jobs/${jobId}/apply`,
        { 
          skipNotification: true // Disable notifications for dashboard applications
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.data.success) {
        setMatchResult(response.data.data);
        setMessage('Application submitted successfully!');
        setHasApplied(true);
        setApplicationData(response.data.data);
      }
    } catch (err: any) {
      console.error('Apply error:', err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token'); // Clear invalid token
        alert('Your session has expired. Please log in again.');
        router.push('/login');
        return;
      }
      setMessage(err.response?.data?.message || 'Already applied or failed to apply.');
    } finally {
      setApplying(false);
    }
  };

  const handleImproveResume = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to get resume improvement suggestions');
        router.push('/login');
        return;
      }

      const response = await axios.post(
        `http://localhost:5001/api/jobs/${jobId}/improve-resume`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.data.success) {
        setImprovements(response.data.data.improvements);
        setShowImprovements(true);
      }
    } catch (err: any) {
      console.error('Improve resume error:', err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token'); // Clear invalid token
        alert('Your session has expired. Please log in again.');
        router.push('/login');
        return;
      }
      setMessage(err.response?.data?.message || 'Failed to get improvement suggestions.');
    }
  };

  return (
    <>
      <Navbar />

      <main className="bg-white pt-24 px-8 md:px-16 max-w-7xl mx-auto">
        {error && <p className="text-red-500 text-center mb-6">{error}</p>}

        {job && (
          <>
            {/* Hero Section with Company Branding */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl p-8 mb-8 shadow-xl">
              <div className="text-center">
                <h1 className="text-5xl font-bold mb-4">{job.title || 'Job Title'}</h1>
                <div className="flex items-center justify-center space-x-2 text-xl mb-3">
                  <span className="bg-white/20 px-4 py-2 rounded-full">{job.companyName || 'Company'}</span>
                  <span>•</span>
                  <span className="bg-white/20 px-4 py-2 rounded-full">
                    {job.locations?.[0]?.city || 'Location'}, {job.locations?.[0]?.state || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-6 text-sm opacity-90">
                  <span>📅 Posted: {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'Recently'}</span>
                  <span>📊 {job.jobType || 'Full-time'}</span>
                  <span>💼 {job.experienceLevel || 'Entry Level'}</span>
                  {job.isUrgent && (
                    <span className="bg-red-500 px-3 py-1 rounded-full font-semibold animate-pulse">
                      🚨 URGENT
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm text-gray-600">Salary Range</div>
                <div className="font-semibold text-green-700">
                  {job.salary ? 
                    `${job.salary.currency || 'INR'} ${Math.round((job.salary.min || 0)/100000)}L - ${Math.round((job.salary.max || 0)/100000)}L` : 
                    'Not specified'
                  }
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🏢</div>
                <div className="text-sm text-gray-600">Work Mode</div>
                <div className="font-semibold text-blue-700 capitalize">{job.workMode || 'Not specified'}</div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">⏰</div>
                <div className="text-sm text-gray-600">Deadline</div>
                <div className="font-semibold text-purple-700">
                  {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Open'}
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm text-gray-600">Positions</div>
                <div className="font-semibold text-orange-700">
                  {(job.totalPositions || 1) - (job.filledPositions || 0)} Available
                </div>
              </div>
            </div>

            {/* Job Description */}
            <section className="bg-white border border-gray-200 rounded-xl p-8 mb-8 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">📝</span>
                Job Description
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                  {job.description || 'Job description not available. Please contact the recruiter for more details.'}
                </p>
              </div>
            </section>

            {/* Requirements & Skills */}
            {job.requirements && job.requirements.length > 0 && (
              <section className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-8 mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-3">🎯</span>
                  Requirements & Skills
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Required Skills</h3>
                    <div className="space-y-3">
                      {job.requirements.map((req, index) => (
                        <div key={index} className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                          <span className={`inline-block w-3 h-3 rounded-full mr-3 ${
                            req.mandatory ? 'bg-red-500' : 'bg-green-500'
                          }`}></span>
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{req.skill || 'Skill not specified'}</span>
                            <span className="ml-2 text-sm text-gray-600">({req.level || 'intermediate'})</span>
                          </div>
                          {req.mandatory && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Required</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Experience Details</h3>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Level:</span>
                          <span className="font-medium text-gray-900 capitalize">{job.experienceLevel || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Department:</span>
                          <span className="font-medium text-gray-900">{job.department || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Employment Type:</span>
                          <span className="font-medium text-gray-900 capitalize">{job.jobType || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Benefits Section */}
            {job.benefits && job.benefits.length > 0 && (
              <section className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-8 mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-3">🎁</span>
                  Benefits & Perks
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center bg-white rounded-lg p-4 shadow-sm">
                      <span className="text-emerald-500 mr-3 text-xl">✓</span>
                      <span className="text-gray-800 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Interview Process */}
            <section className="bg-white border border-gray-200 rounded-xl p-8 mb-8 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">🎤</span>
                Interview Process
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rounds</h3>
                  <div className="space-y-1">
                    {(job.interviewProcess?.rounds || ['Initial Screening', 'Technical Round', 'HR Round']).map((round, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-100 rounded px-3 py-1">
                        {index + 1}. {round}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Duration</h3>
                  <p className="text-gray-600">{job.interviewProcess?.duration || '1-2 weeks'}</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🖥️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Mode</h3>
                  <p className="text-gray-600 capitalize">{job.interviewProcess?.mode || 'hybrid'}</p>
                </div>
              </div>
            </section>

            {/* Apply Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Apply?</h2>
              <p className="text-blue-100 mb-6">
                Our AI will analyze your resume and provide instant match insights
              </p>
              
              {/* Check if user is logged in */}
              {typeof window !== 'undefined' && !localStorage.getItem('token') ? (
                <div className="space-y-4">
                  <p className="text-blue-100 text-lg">Please log in or register to apply for this job</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => router.push('/login')}
                      className="bg-white text-blue-600 px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-50 transition-all duration-300"
                    >
                      <span className="flex items-center justify-center">
                        <span className="mr-2">🔐</span>
                        Login
                      </span>
                    </button>
                    <button
                      onClick={() => router.push('/register/student')}
                      className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
                    >
                      <span className="flex items-center justify-center">
                        <span className="mr-2">✨</span>
                        Register
                      </span>
                    </button>
                  </div>
                </div>
              ) : hasApplied ? (
                <div className="space-y-4">
                  <div className="bg-green-100 text-green-800 px-10 py-4 rounded-full text-lg font-semibold shadow-lg border-2 border-green-200">
                    <span className="flex items-center justify-center">
                      <span className="mr-2">✅</span>
                      Already Applied
                    </span>
                  </div>
                  
                  {applicationData && applicationData.dateApplied && (
                    <p className="text-blue-100 text-sm">
                      Applied on {new Date(applicationData.dateApplied).toLocaleDateString()}
                    </p>
                  )}
                  
                  <button
                    onClick={handleImproveResume}
                    className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full text-md hover:bg-white hover:text-blue-600 transition-all duration-300"
                  >
                    <span className="flex items-center justify-center">
                      <span className="mr-2">💡</span>
                      Get Resume Tips First
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="bg-white text-blue-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                  >
                    {applying ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing Your Resume...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <span className="mr-2">🚀</span>
                        Apply with AI Analysis
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={handleImproveResume}
                    className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full text-md hover:bg-white hover:text-blue-600 transition-all duration-300"
                  >
                    <span className="flex items-center justify-center">
                      <span className="mr-2">💡</span>
                      Get Resume Tips First
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* AI Match Results */}
            {matchResult && (
              <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-2 border-green-200 rounded-2xl p-8 mb-8 shadow-xl">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                    <span className="mr-3 text-4xl">🎯</span>
                    AI Resume Match Analysis
                  </h3>
                  <p className="text-gray-600">Our AI has analyzed your resume against this job posting</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">📊</span>
                      Match Score
                    </h4>
                    <div className="flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={matchResult.matchScore >= 70 ? "#10B981" : matchResult.matchScore >= 50 ? "#F59E0B" : "#EF4444"}
                            strokeWidth="3"
                            strokeDasharray={`${matchResult.matchScore}, 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-gray-900">{matchResult.matchScore}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        matchResult.matchScore >= 70 ? 'bg-green-100 text-green-800' :
                        matchResult.matchScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {matchResult.matchScore >= 70 ? 'Excellent Match' :
                         matchResult.matchScore >= 50 ? 'Good Match' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">⚡</span>
                      Skills Matched
                    </h4>
                    <div className="space-y-3">
                      {matchResult.skillsMatched?.slice(0, 5).map((skill: string, idx: number) => (
                        <div key={idx} className="flex items-center bg-green-50 rounded-lg p-3">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                          <span className="font-medium text-green-800">{skill}</span>
                          <span className="ml-auto">✓</span>
                        </div>
                      ))}
                      {matchResult.skillsMatched?.length > 5 && (
                        <div className="text-center">
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            +{matchResult.skillsMatched.length - 5} more skills matched
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">🤖</span>
                    AI Analysis & Recommendations
                  </h4>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <p className="text-gray-700 leading-relaxed text-lg">{matchResult.explanation}</p>
                  </div>
                  
                  {matchResult.suggestions && matchResult.suggestions.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">💡</span>
                        Quick Improvement Tips
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matchResult.suggestions.slice(0, 4).map((suggestion: string, idx: number) => (
                          <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <span className="text-yellow-600 mr-2 mt-1">💡</span>
                              <p className="text-gray-700 text-sm">{suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resume Improvement Modal */}
            {showImprovements && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                        <span className="mr-2">🚀</span>
                        Resume Improvement Suggestions
                      </h3>
                      <button
                        onClick={() => setShowImprovements(false)}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-6">
                      {improvements.map((improvement, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm mr-2">
                              {improvement.section}
                            </span>
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <h5 className="text-sm font-medium text-gray-600 mb-1">Current:</h5>
                              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                                {improvement.currentText}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-600 mb-1">Suggested:</h5>
                              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                                {improvement.suggestedText}
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <h5 className="text-sm font-medium text-blue-800 mb-1">Why this helps:</h5>
                            <p className="text-sm text-blue-700">{improvement.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end mt-6 pt-6 border-t">
                      <button
                        onClick={() => setShowImprovements(false)}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Application Status Message */}
            {message && (
              <p className="text-center mt-4 text-sm text-green-600">{message}</p>
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
