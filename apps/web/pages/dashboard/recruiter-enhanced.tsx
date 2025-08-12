import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface JobPosting {
  _id: string;
  title: string;
  companyName: string;
  status: 'draft' | 'active' | 'closed';
  applications: number;
  invitationsSent: number;
  interviewsScheduled: number;
  createdAt: string;
}

interface CollegeInvitation {
  _id: string;
  collegeName: string;
  jobTitle: string;
  status: 'pending' | 'accepted' | 'declined' | 'negotiating';
  sentDate: string;
  responseDate?: string;
}

interface RecruiterStats {
  activeJobs: number;
  totalApplications: number;
  interviewsScheduled: number;
  collegePartnerships: number;
}

export default function EnhancedRecruiterDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recruiterInfo, setRecruiterInfo] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<CollegeInvitation[]>([]);
  const [stats, setStats] = useState<RecruiterStats>({
    activeJobs: 0,
    totalApplications: 0,
    interviewsScheduled: 0,
    collegePartnerships: 0
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchRecruiterData();
  }, []);

  const fetchRecruiterData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch recruiter profile
      const profileResponse = await axios.get(`${API_BASE_URL}/api/recruiters/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecruiterInfo(profileResponse.data);

      // Fetch recent jobs
      const jobsResponse = await axios.get(`${API_BASE_URL}/api/jobs/recruiter-jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentJobs(jobsResponse.data?.slice(0, 5) || []);

      // Fetch pending invitations
      try {
        const invitationsResponse = await axios.get(`${API_BASE_URL}/api/invitations/recruiter`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPendingInvitations(invitationsResponse.data?.filter((inv: any) => inv.status === 'pending').slice(0, 5) || []);
      } catch (error) {
        console.log('Invitations API not available yet');
        setPendingInvitations([]);
      }

      // Calculate stats
      const activeJobs = jobsResponse.data?.filter((job: any) => job.status === 'active').length || 0;
      const totalApplications = jobsResponse.data?.reduce((sum: number, job: any) => sum + (job.applications || 0), 0) || 0;
      
      setStats({
        activeJobs,
        totalApplications,
        interviewsScheduled: 0, // Will be calculated from interviews API
        collegePartnerships: pendingInvitations.length || 0
      });

    } catch (error) {
      console.error('Error fetching recruiter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'accepted': return 'text-green-600 bg-green-100';
      case 'draft': case 'pending': case 'negotiating': return 'text-yellow-600 bg-yellow-100';
      case 'closed': case 'declined': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {recruiterInfo?.companyInfo?.companyName || 'Recruiter'}!
          </h1>
          <p className="text-gray-600">
            Manage job postings, college partnerships, and recruitment workflow.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: ChartIcon },
              { id: 'jobs', label: 'Job Management', icon: BriefcaseIcon },
              { id: 'colleges', label: 'College Partnerships', icon: BuildingIcon },
              { id: 'interviews', label: 'Interviews', icon: CalendarIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeJobs}</p>
                  </div>
                  <BriefcaseIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
                  </div>
                  <UserGroupIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Interviews Scheduled</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.interviewsScheduled}</p>
                  </div>
                  <CalendarIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">College Partners</p>
                    <p className="text-3xl font-bold text-green-600">{stats.collegePartnerships}</p>
                  </div>
                  <BuildingIcon />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/jobs/create" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <PlusIcon />
                  <span className="font-medium">Post New Job</span>
                </Link>
                
                <button 
                  onClick={() => setActiveTab('colleges')}
                  className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <MailIcon />
                  <span className="font-medium">Invite Colleges</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('interviews')}
                  className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <CalendarIcon />
                  <span className="font-medium">Schedule Interviews</span>
                </button>
                
                <Link href="/jobs/manage" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <BriefcaseIcon />
                  <span className="font-medium">Manage Jobs</span>
                </Link>
              </div>
            </div>

            {/* Recent Jobs */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Job Postings</h2>
                <Link href="/jobs/manage" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              {recentJobs.length > 0 ? (
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div key={job._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.companyName}</p>
                        <p className="text-sm text-gray-500">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {job.applications} applications
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BriefcaseIcon />
                  <p className="mt-2">No job postings yet</p>
                  <Link href="/jobs/create" className="text-blue-600 hover:text-blue-800 text-sm">
                    Create your first job posting
                  </Link>
                </div>
              )}
            </div>

            {/* Pending College Invitations */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Pending College Invitations</h2>
                <button 
                  onClick={() => setActiveTab('colleges')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              
              {pendingInvitations.length > 0 ? (
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{invitation.collegeName}</h3>
                        <p className="text-sm text-gray-600">{invitation.jobTitle}</p>
                        <p className="text-sm text-gray-500">
                          Sent {new Date(invitation.sentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MailIcon />
                  <p className="mt-2">No pending invitations</p>
                  <button 
                    onClick={() => setActiveTab('colleges')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Send college invitations
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Job Management</h2>
                <Link href="/jobs/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Create New Job
                </Link>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Link href="/jobs/create" className="block p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <div className="text-center">
                    <PlusIcon />
                    <h3 className="mt-2 font-medium text-gray-900">Create Job Posting</h3>
                    <p className="text-sm text-gray-600">Post a new job and target colleges</p>
                  </div>
                </Link>
                
                <Link href="/jobs/manage" className="block p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <div className="text-center">
                    <BriefcaseIcon />
                    <h3 className="mt-2 font-medium text-gray-900">Manage Existing Jobs</h3>
                    <p className="text-sm text-gray-600">Edit, close, or view job applications</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Job Workflow Guide */}
            <div className="bg-blue-50 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Recruitment Workflow</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">1</div>
                  <p className="text-sm font-medium text-blue-900">Create Job</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">2</div>
                  <p className="text-sm font-medium text-blue-900">Target Colleges</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">3</div>
                  <p className="text-sm font-medium text-blue-900">Review Applications</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">4</div>
                  <p className="text-sm font-medium text-blue-900">Schedule Interviews</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Colleges Tab */}
        {activeTab === 'colleges' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">College Partnership Management</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Manage your college invitations and partnerships. Send targeted recruitment invitations to colleges.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition">
                <div className="text-center">
                  <MailIcon />
                  <h3 className="mt-2 font-medium text-gray-900">Send College Invitations</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Target specific colleges for your job postings with our college invitation system.
                  </p>
                  <div className="space-y-2">
                    {recentJobs.length > 0 ? (
                      recentJobs.slice(0, 3).map((job) => (
                        <Link 
                          key={job._id}
                          href={`/jobs/invitations/${job._id}`}
                          className="block text-left p-2 border border-gray-200 rounded hover:bg-white"
                        >
                          <p className="text-sm font-medium">{job.title}</p>
                          <p className="text-xs text-gray-500">Manage invitations</p>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Create a job first to send invitations</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <BuildingIcon />
                  <h3 className="mt-2 font-medium text-gray-900">Partnership Status</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Track responses from colleges to your recruitment invitations.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pending Responses:</span>
                      <span className="font-medium">{pendingInvitations.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Active Partnerships:</span>
                      <span className="font-medium text-green-600">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Interview Management</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Schedule and manage interviews for your job postings. Create interview slots and assign candidates.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition">
                <div className="text-center">
                  <CalendarIcon />
                  <h3 className="mt-2 font-medium text-gray-900">Schedule Interview Slots</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create interview time slots for your job postings and automatically assign candidates.
                  </p>
                  <div className="space-y-2">
                    {recentJobs.length > 0 ? (
                      recentJobs.slice(0, 3).map((job) => (
                        <Link 
                          key={job._id}
                          href={`/interviews/slots/${job._id}`}
                          className="block text-left p-2 border border-gray-200 rounded hover:bg-white"
                        >
                          <p className="text-sm font-medium">{job.title}</p>
                          <p className="text-xs text-gray-500">Manage interview slots</p>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Create a job first to schedule interviews</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <UserGroupIcon />
                  <h3 className="mt-2 font-medium text-gray-900">Interview Analytics</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Track interview completion and candidate performance.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Scheduled Interviews:</span>
                      <span className="font-medium">{stats.interviewsScheduled}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed Interviews:</span>
                      <span className="font-medium text-green-600">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
