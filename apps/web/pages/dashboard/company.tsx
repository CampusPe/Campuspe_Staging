import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

// Company Dashboard is essentially a recruiter dashboard with company-specific branding
// This creates a separate entry point for companies while reusing recruiter functionality

interface Company {
  _id: string;
  email: string;
  companyInfo: {
    name: string;
    industry: string;
    logo?: string;
  };
  isVerified: boolean;
  approvalStatus: string;
}

interface Job {
  _id: string;
  title: string;
  location: string;
  department: string;
  jobType: string;
  experienceLevel: string;
  isActive: boolean;
  postedAt: string;
}

interface Application {
  _id: string;
  studentId: {
    _id: string;
    personalInfo: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  jobId: {
    _id: string;
    title: string;
  };
  status: string;
  appliedAt: string;
}

interface Invitation {
  _id: string;
  companyId: string;
  collegeId: {
    _id: string;
    collegeInfo: {
      name: string;
    };
  };
  jobRoles: string[];
  status: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const CompanyDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    totalInvitations: 0,
    pendingInvitations: 0
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Extract role from JWT token for more reliable authentication
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;
        
        if (userRole !== 'recruiter') {
          console.error(`Invalid user role for company dashboard: ${userRole}`);
          // Redirect to appropriate dashboard based on role
          if (userRole === 'student') {
            router.push('/dashboard/student');
          } else if (['college', 'college_admin', 'placement_officer'].includes(userRole)) {
            router.push('/dashboard/college');
          } else {
            router.push('/login');
          }
          return;
        }
      } catch (tokenError) {
        console.error('Error validating token:', tokenError);
        router.push('/login');
        return;
      }

      await Promise.all([
        fetchCompanyProfile(),
        fetchStats(),
        fetchJobs(),
        fetchApplications(),
        fetchInvitations()
      ]);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/recruiters/profile`, { headers });
      setCompany(response.data);
    } catch (error: any) {
      console.error('Error fetching company profile:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      setError('Failed to load company profile');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/recruiters/stats`, { headers });
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/jobs/recruiter`, { headers });
      setJobs(response.data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/applications/recruiter`, { headers });
      setApplications(response.data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/invitations/recruiter`, { headers });
      setInvitations(response.data || []);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {company?.companyInfo?.logo ? (
                <img 
                  src={company.companyInfo.logo} 
                  alt={company.companyInfo.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-2xl">
                    {company?.companyInfo?.name?.charAt(0) || company?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {company?.companyInfo?.name || 'Company Dashboard'}
                </h1>
                <p className="text-gray-600">{company?.companyInfo?.industry || 'Industry'}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {company?.isVerified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    company?.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    company?.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {company?.approvalStatus === 'approved' ? '✅ Approved' :
                     company?.approvalStatus === 'rejected' ? '❌ Rejected' :
                     '⏳ Pending'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/jobs/create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Post New Job
              </button>
              <button
                onClick={() => router.push('/invitations/create')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-bold">📨</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Invitations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInvitations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'jobs', name: 'Jobs', icon: '💼' },
                { id: 'applications', name: 'Applications', icon: '📝' },
                { id: 'invitations', name: 'College Invitations', icon: '🎓' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Company Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Recent Activity</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">• {stats.pendingApplications} pending applications</p>
                      <p className="text-sm text-gray-600">• {stats.activeJobs} active job postings</p>
                      <p className="text-sm text-gray-600">• {stats.pendingInvitations} pending college invitations</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => router.push('/jobs/create')}
                        className="block w-full text-left text-sm text-blue-600 hover:text-blue-800"
                      >
                        → Post a new job
                      </button>
                      <button
                        onClick={() => router.push('/invitations/create')}
                        className="block w-full text-left text-sm text-blue-600 hover:text-blue-800"
                      >
                        → Send college invitation
                      </button>
                      <button
                        onClick={() => setActiveTab('applications')}
                        className="block w-full text-left text-sm text-blue-600 hover:text-blue-800"
                      >
                        → Review applications
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Job Postings</h2>
                  <button
                    onClick={() => router.push('/jobs/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Post New Job
                  </button>
                </div>
                
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No jobs posted yet.</p>
                    <button
                      onClick={() => router.push('/jobs/create')}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Post Your First Job
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{job.title}</h3>
                            <p className="text-gray-600">{job.location} • {job.department}</p>
                            <p className="text-sm text-gray-500">
                              {job.jobType} • {job.experienceLevel} • Posted {new Date(job.postedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              job.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {job.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => router.push(`/jobs/${job._id}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
                
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No applications received yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {application.studentId?.personalInfo?.firstName} {application.studentId?.personalInfo?.lastName}
                            </h3>
                            <p className="text-gray-600">Applied for: {application.jobId?.title}</p>
                            <p className="text-sm text-gray-500">
                              Applied on: {new Date(application.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {application.status}
                            </span>
                            <button
                              onClick={() => router.push(`/profile/student/${application.studentId?._id}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Profile →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">College Invitations</h2>
                  <button
                    onClick={() => router.push('/invitations/create')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Send New Invitation
                  </button>
                </div>
                
                {invitations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No invitations sent yet.</p>
                    <button
                      onClick={() => router.push('/invitations/create')}
                      className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Send Your First Invitation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invitations.map((invitation) => (
                      <div key={invitation._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {invitation.collegeId?.collegeInfo?.name || 'College'}
                            </h3>
                            <p className="text-gray-600">
                              Roles: {invitation.jobRoles?.join(', ') || 'Not specified'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Sent on: {new Date(invitation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              invitation.status === 'declined' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {invitation.status}
                            </span>
                            <button
                              onClick={() => router.push(`/profile/college/${invitation.collegeId?._id}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View College →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
