'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import ApprovalStatus from '../../components/ApprovalStatus';
import JobMatchingDashboard from '../../components/JobMatchingDashboard';

function RecruiterDashboardContent() {
  const router = useRouter();
  const [recruiterInfo, setRecruiterInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobMatchingDashboard, setShowJobMatchingDashboard] = useState(false);
  const [matchingStudents, setMatchingStudents] = useState<any[]>([]);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [candidateManagement, setCandidateManagement] = useState<any[]>([]);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, notifications, candidates
  
  const [showAllJobs, setShowAllJobs] = useState(false);

  // Handle job posting navigation
  const handlePostNewJob = () => {
    router.push('/jobs/create');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          router.push('/login');
          return;
        }

        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5001/api/recruiters/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setRecruiterInfo(response.data);

        // If approved and active, fetch jobs and stats
        if (response.data.approvalStatus === 'approved' && response.data.isActive) {
          try {
            const [jobsRes, statsRes] = await Promise.all([
              axios.get(`http://localhost:5001/api/jobs`, {
                params: { recruiterId: response.data._id },
                headers: { Authorization: `Bearer ${token}` }
              }),
              axios.get(`http://localhost:5001/api/career-admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            ]);
            
            // If no recruiter-specific jobs found, fetch all jobs as fallback
            if (jobsRes.data.length === 0) {
              console.log('No recruiter-specific jobs found, fetching all jobs...');
              const allJobsRes = await axios.get(`http://localhost:5001/api/jobs`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setJobs(allJobsRes.data);
            } else {
              setJobs(jobsRes.data);
            }
            
            setStats(statsRes.data.data);
          } catch (err) {
            console.error('Error fetching data:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching recruiter data:', error);
        setError('Failed to load recruiter information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleJobClick = async (job: any) => {
    setSelectedJob(job);
    setShowJobModal(true);
    
    // Fetch matching students
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/jobs/${job._id}/matches`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { threshold: 0.5, limit: 10 }
      });
      setMatchingStudents(response.data.data.matches);
    } catch (error) {
      console.error('Error fetching matching students:', error);
    }

    // Fetch job applications with AI scores
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found, skipping job applications fetch');
        setJobApplications([]);
        return;
      }
      
      const applicationsResponse = await axios.get(`http://localhost:5001/api/jobs/${job._id}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (applicationsResponse.data.success) {
        setJobApplications(applicationsResponse.data.data.applications);
      }
    } catch (error) {
      console.error('Error fetching job applications:', error);
      // Set empty array instead of leaving undefined
      setJobApplications([]);
      
      // If it's an auth error, don't break the whole flow
      if (error.response?.status === 401) {
        console.warn('Authentication failed for job applications. User may need to login again.');
      }
      setJobApplications([]);
    }
  };

  const fetchNotificationHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/career-admin/notifications/${recruiterInfo._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotificationHistory(response.data.data.notifications);
    } catch (error) {
      console.error('Error fetching notification history:', error);
    }
  };

  const fetchCandidateManagement = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/career-admin/candidates/${recruiterInfo._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidateManagement(response.data.data.candidates);
    } catch (error) {
      console.error('Error fetching candidate management data:', error);
    }
  };

  const publishJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/jobs/${jobId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh jobs list
      const jobsRes = await axios.get(`http://localhost:5001/api/jobs`, {
        params: { recruiterId: recruiterInfo._id },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // If no recruiter-specific jobs found, fetch all jobs as fallback
      if (jobsRes.data.length === 0) {
        console.log('No recruiter-specific jobs found after publish, fetching all jobs...');
        const allJobsRes = await axios.get(`http://localhost:5001/api/jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setJobs(allJobsRes.data);
      } else {
        setJobs(jobsRes.data);
      }
      
      alert('Job published successfully! Our AI will automatically analyze the description, extract key skills, and match it with qualified students. Matching students will receive personalized WhatsApp notifications.');
    } catch (error) {
      console.error('Error publishing job:', error);
      alert('Failed to publish job');
    }
  };

  const triggerAlerts = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/jobs/${jobId}/alerts`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('WhatsApp alerts sent to matching students!');
    } catch (error) {
      console.error('Error triggering alerts:', error);
      alert('Failed to send alerts');
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

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  // If not approved or not active, show approval status
  if (!recruiterInfo || recruiterInfo.approvalStatus !== 'approved' || !recruiterInfo.isActive) {
    return (
      <>
        <Navbar />
        <ApprovalStatus userRole="recruiter" />
      </>
    );
  }

  const companyName = recruiterInfo.companyInfo?.name || recruiterInfo.name || 'Company';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-7xl mx-auto">
        {/* Career Alert System Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">AI Career Alert System Active</h2>
                <p className="text-blue-100">
                  Your jobs are automatically matched with students using AI. 
                  WhatsApp alerts are sent to relevant candidates instantly.
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.studentsMatched || 0}</div>
              <div className="text-sm text-blue-100">Students Matched Today</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-blue-700">
            Welcome, {companyName} 👋
          </h1>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✅ Approved
            </span>
            {recruiterInfo.isActive && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                🟢 Active
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('notifications');
                fetchNotificationHistory();
              }}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔔 Notification History
            </button>
            <button
              onClick={() => {
                setActiveTab('candidates');
                fetchCandidateManagement();
              }}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'candidates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Candidate Management
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Information Card */}
          <div className="lg:col-span-2">
            <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
              
              {recruiterInfo.companyInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <p className="text-gray-900">{recruiterInfo.companyInfo.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <p className="text-gray-900">{recruiterInfo.companyInfo.industry || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <p className="text-gray-900">
                      {recruiterInfo.companyInfo.website ? (
                        <a href={recruiterInfo.companyInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {recruiterInfo.companyInfo.website}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                    <p className="text-gray-900">{recruiterInfo.companyInfo.size || 'N/A'}</p>
                  </div>
                  
                  {recruiterInfo.companyInfo.description && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-gray-900">{recruiterInfo.companyInfo.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">🏢</div>
                  <p className="text-gray-500">Company information not available</p>
                </div>
              )}

              {recruiterInfo.companyInfo?.address && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Company Address</h3>
                  <p className="text-gray-700">
                    {[
                      recruiterInfo.companyInfo.address.street,
                      recruiterInfo.companyInfo.address.city,
                      recruiterInfo.companyInfo.address.state,
                      recruiterInfo.companyInfo.address.zipCode,
                      recruiterInfo.companyInfo.address.country
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {recruiterInfo.contactInfo && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-gray-900">{recruiterInfo.contactInfo.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <p className="text-gray-900">{recruiterInfo.contactInfo.designation}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{recruiterInfo.contactInfo.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-gray-900">{recruiterInfo.contactInfo.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Jobs Section */}
            <section className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Posted Jobs</h2>
        <div className="flex items-center space-x-3">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {jobs.length} Jobs
          </span>
          <button 
            onClick={handlePostNewJob}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Post New Job
          </button>
        </div>
      </div>

      {jobs.length > 0 ? (
        <div className="space-y-4">
          {(showAllJobs ? jobs : jobs.slice(0, 5)).map((job, index) => (
            <div key={job._id || index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-gradient-to-r from-white to-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-gray-900 mr-3">{job.title}</h3>
                    {job.aiProcessed && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                        AI Processed
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{job.description?.slice(0, 100)}...</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <span>📍 {job.location || 'Remote'}</span>
                    <span>💼 {job.type || 'Full-time'}</span>
                    <span>💰 {
                      job.salary 
                        ? (typeof job.salary === 'object' 
                            ? `${job.salary.min}-${job.salary.max} ${job.salary.currency || ''}`.trim()
                            : job.salary)
                        : 'Competitive'
                    }</span>
                  </div>
                  {job.aiSkills && job.aiSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {job.aiSkills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {job.aiSkills.length > 3 && (
                        <span className="text-gray-400 text-xs">
                          +{job.aiSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {job.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleJobClick(job)}
                      className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-2 py-1 rounded"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedJob(job);
                        setShowJobMatchingDashboard(true);
                      }}
                      className="text-purple-600 hover:text-purple-800 text-sm bg-purple-50 px-2 py-1 rounded"
                      title="View matched students and send WhatsApp messages"
                    >
                      🎯 Matches
                    </button>
                    {job.isActive && (
                      <button 
                        onClick={() => triggerAlerts(job._id)}
                        className="text-green-600 hover:text-green-800 text-sm bg-green-50 px-2 py-1 rounded"
                        title="Send WhatsApp alerts to matching students"
                      >
                        📱 Alert
                      </button>
                    )}
                  </div>
                  {job.matchingStudentsCount && (
                    <span className="text-xs text-purple-600 font-medium">
                      {job.matchingStudentsCount} matches found
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Toggle Button */}
          {jobs.length > 5 && (
            <div className="text-center">
              <button 
                onClick={() => setShowAllJobs(!showAllJobs)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAllJobs ? 'Show Less' : `View All Jobs (${jobs.length})`}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">💼</div>
          <p className="text-gray-500 mb-2">No jobs posted yet</p>
          <p className="text-sm text-gray-400 mb-4">Start by posting your first job opening</p>
          <button 
            onClick={handlePostNewJob}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Post Your First Job
          </button>
        </div>
      )}
    </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Career Alert System Stats */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-sm p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🤖</span>
                AI Career Alert System
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Jobs</span>
                  <span className="font-semibold text-blue-600">{stats.totalJobs || jobs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Jobs</span>
                  <span className="font-semibold text-green-600">
                    {stats.activeJobs || jobs.filter(j => j.isActive).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Students Matched</span>
                  <span className="font-semibold text-purple-600">
                    {stats.studentsMatched || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">WhatsApp Alerts Sent</span>
                  <span className="font-semibold text-green-600">
                    {stats.whatsappAlertsSent || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">AI Match Rate</span>
                  <span className="font-semibold text-indigo-600">
                    {stats.averageMatchScore ? `${stats.averageMatchScore}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </section>

            {/* AI-Powered Actions */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Smart Actions
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={handlePostNewJob}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <span className="mr-2">➕</span>
                  Post New Job
                </button>
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                  <span className="mr-2">📋</span>
                  View Applications
                </button>
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center">
                  <span className="mr-2">🎯</span>
                  AI Job Matching
                </button>
                <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center">
                  <span className="mr-2">📱</span>
                  Send WhatsApp Alerts
                </button>
                <a
                  href="/notifications"
                  className="flex w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors items-center justify-center"
                >
                  <span className="mr-2">🔔</span>
                  View Notifications
                </a>
              </div>
            </section>

            {/* Account Status */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Account Approved</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Profile Complete</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Ready to Post Jobs</span>
                </div>
              </div>
            </section>

            {/* Help & Support */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Help & Support</h3>
              <div className="space-y-3">
                <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm">
                  📖 How to post effective jobs
                </a>
                <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm">
                  💡 Best practices for recruitment
                </a>
                <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm">
                  📧 Contact Support
                </a>
                <a href="#" className="block text-blue-600 hover:text-blue-800 text-sm">
                  ❓ FAQ
                </a>
              </div>
            </section>
          </div>
        </div>
        )}

        {/* Notification History Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🔔</span>
                WhatsApp Notification History
              </h2>
              
              {notificationHistory.length > 0 ? (
                <div className="space-y-4">
                  {notificationHistory.map((notification, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-medium text-gray-900 mr-3">
                              {notification.recipientId?.personalInfo?.firstName} {notification.recipientId?.personalInfo?.lastName}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              notification.deliveryStatus?.whatsapp === 'delivered' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {notification.deliveryStatus?.whatsapp || 'Sent'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            📱 {notification.recipientId?.personalInfo?.phone}
                          </p>
                          <p className="text-gray-600 text-sm mb-2">
                            💼 {notification.relatedJobId?.title} at {notification.relatedJobId?.companyName}
                          </p>
                          {notification.metadata?.matchScore && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                              {notification.metadata.matchScore}% Match
                            </span>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {new Date(notification.createdAt).toLocaleDateString()}
                          <br />
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">📱</div>
                  <p className="text-gray-500 mb-2">No notifications sent yet</p>
                  <p className="text-sm text-gray-400">Notifications will appear here when jobs are posted and students are matched</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Candidate Management Tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">👥</span>
                Candidate Management & Applications
              </h2>
              
              {candidateManagement.length > 0 ? (
                <div className="space-y-4">
                  {candidateManagement.map((candidate, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-medium text-gray-900 mr-3">
                              {candidate.studentId?.personalInfo?.firstName} {candidate.studentId?.personalInfo?.lastName}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              candidate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              candidate.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                              candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {candidate.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            📧 {candidate.studentId?.personalInfo?.email}
                          </p>
                          <p className="text-gray-600 text-sm mb-2">
                            💼 Applied for: {candidate.jobId?.title}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            {candidate.matchScore && (
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                                {candidate.matchScore}% AI Match
                              </span>
                            )}
                            <span className="text-gray-500">
                              🔔 {candidate.notificationsSent || 0} notifications sent
                            </span>
                            <span className="text-gray-500">
                              📅 Applied {new Date(candidate.appliedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                            View Resume
                          </button>
                          <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                            Shortlist
                          </button>
                          <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700">
                            Contact
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">👥</div>
                  <p className="text-gray-500 mb-2">No applications yet</p>
                  <p className="text-sm text-gray-400">Candidate applications will appear here when students apply to your jobs</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Job Details Modal */}
        {showJobModal && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="mr-2">💼</span>
                    {selectedJob.title}
                  </h2>
                  <button
                    onClick={() => setShowJobModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Job Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <p className="text-gray-600 text-sm">{selectedJob.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <p className="text-gray-900">{selectedJob.location || 'Remote'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <p className="text-gray-900">{selectedJob.type || 'Full-time'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                          <p className="text-gray-900">{
                            selectedJob.salary 
                              ? (typeof selectedJob.salary === 'object' 
                                  ? `${selectedJob.salary.min}-${selectedJob.salary.max} ${selectedJob.salary.currency || ''}`.trim()
                                  : selectedJob.salary)
                              : 'Competitive'
                          }</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedJob.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {selectedJob.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      {selectedJob.aiSkills && selectedJob.aiSkills.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">AI-Detected Skills</label>
                          <div className="flex flex-wrap gap-2">
                            {selectedJob.aiSkills.map((skill, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Matching Students */}
                  <div>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
      <span className="mr-2">🎯</span>
      Matching Students
    </h3>
    {selectedJob.isActive && (
      <button
        onClick={() => triggerAlerts(selectedJob._id)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
      >
        <span className="mr-1">📱</span>
        Send WhatsApp Alerts
      </button>
    )}
  </div>

  {matchingStudents && matchingStudents.length > 0 ? (
    <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
      {matchingStudents.map((match, idx) => (
        <div key={idx} className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 text-base">
              {match.firstName} {match.lastName}
            </h4>
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-medium">
              {Math.round(match.matchScore)}% Match
            </span>
          </div>

          <p className="text-gray-700 text-sm mb-1">
            📧 {match.email || 'No email'}
          </p>

          <p className="text-gray-700 text-sm mb-2">
            📞 {match.phone || 'No phone'}
          </p>

          {match.matchedSkills && match.matchedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {match.matchedSkills.slice(0, 5).map((skill, skillIdx) => (
                <span key={skillIdx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                  {skill}
                </span>
              ))}
              {match.matchedSkills.length > 5 && (
                <span className="text-gray-400 text-xs">
                  +{match.matchedSkills.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8 mb-6">
      <div className="text-gray-400 mb-2">🔍</div>
      <p className="text-gray-500 mb-2">No matching students found yet</p>
      <p className="text-sm text-gray-400">
        {selectedJob.isActive
          ? 'Students will be notified as they upload matching resumes'
          : 'Activate this job to start matching'}
      </p>
    </div>
  )}



                    {/* Job Applications with AI Scores */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                        <span className="mr-2">📋</span>
                        Applications ({jobApplications.length})
                      </h3>
                      
                      {jobApplications.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {jobApplications.map((application, idx) => (
                            <div key={idx} className="bg-blue-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {application.studentId?.personalInfo?.firstName} {application.studentId?.personalInfo?.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-600">{application.studentId?.personalInfo?.email}</p>
                                </div>
                                <div className="text-right">
                                  <div className={`px-2 py-1 rounded text-sm font-medium mb-1 ${
                                    application.matchScore >= 80 ? 'bg-green-100 text-green-800' :
                                    application.matchScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {application.matchScore}% AI Match
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              
                              {application.resumeAnalysis && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-600 mb-2">{application.resumeAnalysis.explanation}</p>
                                  
                                  {application.resumeAnalysis.skillsMatched && application.resumeAnalysis.skillsMatched.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      <span className="text-xs text-gray-500">Matched Skills:</span>
                                      {application.resumeAnalysis.skillsMatched.slice(0, 3).map((skill: string, skillIdx: number) => (
                                        <span key={skillIdx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                          {skill}
                                        </span>
                                      ))}
                                      {application.resumeAnalysis.skillsMatched.length > 3 && (
                                        <span className="text-gray-400 text-xs">+{application.resumeAnalysis.skillsMatched.length - 3}</span>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className="flex space-x-2 mt-2">
                                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                                      View Resume
                                    </button>
                                    <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                                      Shortlist
                                    </button>
                                    <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700">
                                      Contact
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="text-gray-400 mb-2">📭</div>
                          <p className="text-gray-500">No applications yet</p>
                          <p className="text-sm text-gray-400">Students will appear here when they apply</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="flex space-x-4">
                    {!selectedJob.isActive && (
                      <button
                        onClick={() => publishJob(selectedJob._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Activate Job
                      </button>
                    )}
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Edit Job
                    </button>
                  </div>
                  <button
                    onClick={() => setShowJobModal(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Matching Dashboard Modal */}
        {showJobMatchingDashboard && selectedJob && (
          <JobMatchingDashboard
            jobId={selectedJob._id}
            jobTitle={selectedJob.title}
            companyName={selectedJob.companyName}
            onClose={() => setShowJobMatchingDashboard(false)}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

export default function RecruiterDashboard() {
  return (
    <ProtectedRoute allowedRoles={['recruiter']}>
      <RecruiterDashboardContent />
    </ProtectedRoute>
  );
}
