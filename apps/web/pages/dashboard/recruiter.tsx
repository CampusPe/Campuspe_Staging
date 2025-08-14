import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

// Types
interface CompanyInfo {
  _id: string;
  companyInfo?: {
    name: string;
    email: string;
    industryType: string;
    companySize: string;
    location: string;
    description?: string;
    website?: string;
    logo?: string;
    contactPerson?: string;
    phoneNumber?: string;
    linkedinUrl?: string;
  };
  // Legacy fields for backward compatibility
  companyName?: string;
  email?: string;
  industryType?: string;
  companySize?: string;
  location?: string;
  description?: string;
  website?: string;
  logo?: string;
  contactPerson?: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  isVerified: boolean;
  verificationStatus: string;
  approvalStatus: string;
  approvedAt?: string;
  createdAt: string;
}

interface Job {
  _id: string;
  title: string;
  companyName: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  jobType: string;
  workMode: string;
  location: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    negotiable: boolean;
    _id?: string;
  } | string;
  currency: string;
  benefits: string[];
  applicationDeadline: string;
  status: 'active' | 'inactive' | 'closed';
  createdAt: string;
  applicantsCount?: number;
  viewsCount?: number;
}

interface Application {
  _id: string;
  jobId: string;
  jobTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'applied' | 'under_review' | 'shortlisted' | 'interviewed' | 'selected' | 'rejected';
  appliedDate: string;
  lastUpdated: string;
  matchScore?: number;
  notes?: string;
}

interface Interview {
  _id: string;
  jobId: string;
  jobTitle: string;
  applicationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  interviewDate: string;
  interviewTime: string;
  duration: number;
  type: 'online' | 'offline';
  meetingLink?: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  feedback?: string;
  interviewerName?: string;
  round: number;
  notes?: string;
}

interface Invitation {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    companyName: string;
    location: string;
    salary: any;
  };
  collegeId: {
    _id: string;
    name: string;
    address: {
      city: string;
    };
  };
  status: 'pending' | 'accepted' | 'declined' | 'negotiating' | 'expired';
  invitationMessage?: string;
  sentAt: string;
  respondedAt?: string;
  expiresAt: string;
  proposedDates: any[];
  campusVisitWindow?: any;
  tpoResponse?: {
    responseMessage?: string;
    responseDate?: string;
  };
  negotiationHistory: any[];
}

interface Stats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  scheduledInterviews: number;
  selectedCandidates: number;
  avgApplicationsPerJob: number;
  companyProfileCompleteness: number;
}

// Icons
const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const BriefcaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2" />
  </svg>
);

const MailIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserGroupIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const BuildingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const DocumentIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Helper function to format salary
const formatSalary = (salary: any) => {
  if (typeof salary === 'string') {
    return salary;
  }
  if (typeof salary === 'object' && salary !== null) {
    const { min, max, currency = 'INR' } = salary;
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    return `${currency} ${(min || max || 0).toLocaleString()}`;
  }
  return 'Not specified';
};

const RecruiterDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    scheduledInterviews: 0,
    selectedCandidates: 0,
    avgApplicationsPerJob: 0,
    companyProfileCompleteness: 0
  });
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  // Utility functions
  const getStatusColor = (status: string) => {
    const statusColors = {
      applied: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-purple-100 text-purple-800',
      interviewed: 'bg-indigo-100 text-indigo-800',
      selected: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rescheduled: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      closed: 'bg-red-100 text-red-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  // API calls
  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch company info
      const companyResponse = await axios.get(`${API_BASE_URL}/api/recruiters/profile`, { headers });
      setCompanyInfo(companyResponse.data);

      // Fetch stats
      const statsResponse = await axios.get(`${API_BASE_URL}/api/recruiters/stats`, { headers });
      setStats(statsResponse.data);

      // Fetch jobs
      const jobsResponse = await axios.get(`${API_BASE_URL}/api/jobs/recruiter-jobs`, { headers });
      setMyJobs(Array.isArray(jobsResponse.data) ? jobsResponse.data : []);

      // Fetch recent applications
      const applicationsResponse = await axios.get(`${API_BASE_URL}/api/applications/my-applications`, { headers });
      const applications = Array.isArray(applicationsResponse.data) ? applicationsResponse.data : [];
      setRecentApplications(applications.slice(0, 5));

      // Fetch upcoming interviews
      const interviewsResponse = await axios.get(`${API_BASE_URL}/api/interviews/my-interviews`, { headers });
      const interviewsData = Array.isArray(interviewsResponse.data) ? interviewsResponse.data : [];
      const upcoming = interviewsData.filter((interview: Interview) => 
        new Date(interview.interviewDate) >= new Date() && interview.status === 'scheduled'
      );
      setUpcomingInterviews(upcoming.slice(0, 5));

      // Fetch invitations (get all job invitations for recruiter)
      const allInvitations: Invitation[] = [];
      for (const job of Array.isArray(jobsResponse.data) ? jobsResponse.data : []) {
        try {
          const invitationsResponse = await axios.get(`${API_BASE_URL}/api/jobs/${job._id}/invitations`, { headers });
          if (invitationsResponse.data && invitationsResponse.data.data && invitationsResponse.data.data.invitations) {
            allInvitations.push(...invitationsResponse.data.data.invitations.map((inv: any) => ({
              _id: inv.id,
              jobId: job,
              collegeId: inv.college,
              status: inv.status,
              invitationMessage: '',
              sentAt: inv.sentAt,
              respondedAt: inv.respondedAt,
              expiresAt: inv.expiresAt,
              proposedDates: inv.proposedDates || [],
              campusVisitWindow: inv.campusVisitWindow,
              tpoResponse: inv.tpoResponse,
              negotiationHistory: inv.negotiationHistory || []
            })));
          }
        } catch (err) {
          console.error(`Error fetching invitations for job ${job._id}:`, err);
        }
      }
      setInvitations(allInvitations);

    } catch (error) {
      console.error('Error fetching company data:', error);
      setError('Failed to load dashboard data');
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.patch(`${API_BASE_URL}/api/applications/${applicationId}/status`, 
        { status: newStatus }, 
        { headers }
      );
      
      // Refresh applications
      const applicationsResponse = await axios.get(`${API_BASE_URL}/api/applications/my-applications`, { headers });
      setRecentApplications(applicationsResponse.data.slice(0, 5));
      
      // Refresh stats
      const statsResponse = await axios.get(`${API_BASE_URL}/api/recruiters/stats`, { headers });
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handleScheduleInterview = async (applicationId: string) => {
    router.push(`/interviews/schedule?applicationId=${applicationId}`);
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      await axios.patch(`${API_BASE_URL}/api/jobs/${jobId}/status`, 
        { status: newStatus }, 
        { headers }
      );
      
      // Refresh jobs
      const jobsResponse = await axios.get(`${API_BASE_URL}/api/jobs/recruiter-jobs`, { headers });
      setMyJobs(Array.isArray(jobsResponse.data) ? jobsResponse.data : []);
      
      // Refresh stats
      const statsResponse = await axios.get(`${API_BASE_URL}/api/recruiters/stats`, { headers });
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error toggling job status:', error);
    }
  };

  // Invitation handlers
  const handleResendInvitation = async (invitationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // For now, just show a confirmation. The resend functionality 
      // would need to be implemented in the backend
      const confirmed = confirm('Are you sure you want to resend this invitation?');
      if (confirmed) {
        // Here you would call the resend API endpoint when it's implemented
        alert('Invitation resend functionality will be implemented soon');
        // await axios.post(`${API_BASE_URL}/api/invitations/${invitationId}/resend`, {}, { headers });
        // fetchCompanyData();
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation');
    }
  };

  const handleViewInvitationDetails = (invitationId: string) => {
    // For now, just show an alert. Later can open a modal or navigate to details page
    router.push(`/invitations/details/${invitationId}`);
  };

  const handleSendInvitation = (jobId: string) => {
    // Navigate to invitation creation page
    router.push(`/invitations/create?jobId=${jobId}`);
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Recruiter Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {companyInfo?.companyInfo?.name || companyInfo?.companyName || 'Recruiter'}! Manage your hiring process effectively.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartIcon },
              { id: 'jobs', label: 'Job Management', icon: BriefcaseIcon },
              { id: 'applications', label: 'Applications', icon: UserGroupIcon },
              { id: 'interviews', label: 'Interviews', icon: CalendarIcon },
              { id: 'invitations', label: 'College Invitations', icon: MailIcon },
              { id: 'company', label: 'Company Profile', icon: BuildingIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
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
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <BriefcaseIcon />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {stats.activeJobs} active jobs
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Applications</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <UserGroupIcon />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Avg {stats.avgApplicationsPerJob} per job
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Interviews</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.scheduledInterviews}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <CalendarIcon />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Scheduled interviews
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hired</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.selectedCandidates}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <UserGroupIcon />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Selected candidates
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/jobs/create" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <PlusIcon />
                  <div>
                    <p className="font-medium">Post New Job</p>
                    <p className="text-xs text-gray-500">Create job posting</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/recruiter?tab=applications" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                  <UserGroupIcon />
                  <div>
                    <p className="font-medium">Review Applications</p>
                    <p className="text-xs text-gray-500">Manage candidates</p>
                  </div>
                </Link>
                
                <Link href="/interviews/schedule" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
                  <CalendarIcon />
                  <div>
                    <p className="font-medium">Schedule Interview</p>
                    <p className="text-xs text-gray-500">Set up meetings</p>
                  </div>
                </Link>
                
                <Link href="/analytics/recruiting" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                  <ChartIcon />
                  <div>
                    <p className="font-medium">View Analytics</p>
                    <p className="text-xs text-gray-500">Hiring insights</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                  <Link href="/dashboard/recruiter?tab=applications" className="text-blue-600 hover:text-blue-800 text-sm">
                    View All →
                  </Link>
                </div>
                
                {Array.isArray(recentApplications) && recentApplications.length > 0 ? (
                  <div className="space-y-3">
                    {recentApplications.slice(0, 4).map((application) => (
                      <div key={application._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{application.studentName}</p>
                          <p className="text-xs text-gray-600">{application.jobTitle}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(application.appliedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(application.status)}`}>
                          {application.status ? application.status.replace('_', ' ').toUpperCase() : 'PENDING'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No recent applications</p>
                )}
              </div>

              {/* Upcoming Interviews */}
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h3>
                  <Link href="/dashboard/recruiter?tab=interviews" className="text-blue-600 hover:text-blue-800 text-sm">
                    View All →
                  </Link>
                </div>
                
                {Array.isArray(upcomingInterviews) && upcomingInterviews.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingInterviews.slice(0, 4).map((interview) => (
                      <div key={interview._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{interview.studentName}</p>
                          <p className="text-xs text-gray-600">{interview.jobTitle}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(interview.interviewDate).toLocaleDateString()} • {interview.interviewTime}
                          </p>
                        </div>
                        <span className="text-xs text-blue-600">
                          {interview.type === 'online' ? '💻' : '🏢'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No upcoming interviews</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Job Management Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Job Management</h2>
                <Link href="/jobs/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  <PlusIcon className="inline w-4 h-4 mr-2" />
                  Post New Job
                </Link>
              </div>
              
              {Array.isArray(myJobs) && myJobs.length > 0 ? (
                <div className="space-y-4">
                  {myJobs.map((job) => (
                    <div key={job._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                              {job.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{job.description.substring(0, 120)}...</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>📍 {job.location}</span>
                            <span>💰 {formatSalary(job.salary)}</span>
                            <span>👥 {job.applicantsCount || 0} applications</span>
                            <span>👁️ {job.viewsCount || 0} views</span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <Link href={`/jobs/edit/${job._id}`} className="text-blue-600 hover:text-blue-800 p-2">
                              Edit
                            </Link>
                            <button
                              onClick={() => handleToggleJobStatus(job._id, job.status)}
                              className={`px-3 py-1 rounded text-sm ${
                                job.status === 'active' 
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {job.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                          <button
                            onClick={() => handleSendInvitation(job._id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                          >
                            📧 Send Invitation
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BriefcaseIcon />
                  <p className="mt-4 text-gray-500">No jobs posted yet</p>
                  <Link href="/jobs/create" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                    Post Your First Job
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Application Management</h2>
              <div className="flex space-x-2">
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            
            {Array.isArray(recentApplications) && recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{application.studentName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {application.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {application.matchScore && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              {application.matchScore}% Match
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{application.jobTitle}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          Applied on {new Date(application.appliedDate).toLocaleDateString()}
                        </p>
                        <div className="flex items-center space-x-4">
                          {application.resumeUrl && (
                            <a 
                              href={application.resumeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                            >
                              <DocumentIcon />
                              <span>View Resume</span>
                            </a>
                          )}
                          <a 
                            href={`mailto:${application.studentEmail}`}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                          >
                            <MailIcon />
                            <span>Contact</span>
                          </a>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {application.status === 'applied' && (
                          <button
                            onClick={() => handleUpdateApplicationStatus(application._id, 'under_review')}
                            className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200"
                          >
                            Review
                          </button>
                        )}
                        {application.status === 'under_review' && (
                          <>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application._id, 'shortlisted')}
                              className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm hover:bg-purple-200"
                            >
                              Shortlist
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application._id, 'rejected')}
                              className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {application.status === 'shortlisted' && (
                          <button
                            onClick={() => handleScheduleInterview(application._id)}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200"
                          >
                            Schedule Interview
                          </button>
                        )}
                        {application.status === 'interviewed' && (
                          <>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application._id, 'selected')}
                              className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200"
                            >
                              Select
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application._id, 'rejected')}
                              className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserGroupIcon />
                <p className="mt-4 text-gray-500">No applications yet</p>
                <p className="text-sm text-gray-400">Applications will appear here when students apply to your jobs</p>
              </div>
            )}
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Interview Management</h2>
              <Link href="/interviews/schedule" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Schedule Interview
              </Link>
            </div>
            
            {Array.isArray(upcomingInterviews) && upcomingInterviews.length > 0 ? (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{interview.studentName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                            {interview.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{interview.jobTitle}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span>📅 {new Date(interview.interviewDate).toLocaleDateString()}</span>
                          <span>🕒 {interview.interviewTime}</span>
                          <span>⏱️ {interview.duration} min</span>
                          <span className={interview.type === 'online' ? '💻' : '🏢'}>{interview.type}</span>
                        </div>
                        {interview.type === 'online' && interview.meetingLink && (
                          <a 
                            href={interview.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            🔗 Join Meeting
                          </a>
                        )}
                        {interview.location && interview.type === 'offline' && (
                          <p className="text-sm text-gray-500">📍 {interview.location}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Link 
                          href={`/interviews/edit/${interview._id}`}
                          className="text-blue-600 hover:text-blue-800 p-2"
                        >
                          Edit
                        </Link>
                        <a 
                          href={`mailto:${interview.studentEmail}`}
                          className="text-blue-600 hover:text-blue-800 p-2"
                        >
                          Contact
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon />
                <p className="mt-4 text-gray-500">No interviews scheduled</p>
                <p className="text-sm text-gray-400">Schedule interviews with shortlisted candidates</p>
              </div>
            )}
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">College Invitations</h2>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Send New Invitation
                </button>
              </div>

              {Array.isArray(invitations) && invitations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job & College
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sent Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Response
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invitations.map((invitation) => (
                        <tr key={invitation._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {invitation.jobId.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {invitation.collegeId.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {invitation.collegeId.address?.city}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invitation.status)}`}>
                              {invitation.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(invitation.sentAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invitation.respondedAt ? (
                              <div>
                                <div className="font-medium">
                                  {new Date(invitation.respondedAt).toLocaleDateString()}
                                </div>
                                {invitation.tpoResponse?.responseMessage && (
                                  <div className="text-xs text-gray-400 max-w-xs truncate">
                                    {invitation.tpoResponse.responseMessage}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            {invitation.status === 'declined' && (
                              <button
                                onClick={() => handleResendInvitation(invitation._id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Resend
                              </button>
                            )}
                            <button
                              onClick={() => handleViewInvitationDetails(invitation._id)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MailIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations sent</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start by sending invitations to colleges for your job openings.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="mr-2" />
                      Send First Invitation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Company Profile Tab */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Company Profile</h2>
                <Link href="/profile/company/edit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Edit Profile
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Company Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Company Name:</span>
                      <span>{companyInfo?.companyInfo?.name || companyInfo?.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span>{companyInfo?.companyInfo?.email || companyInfo?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Industry:</span>
                      <span>{companyInfo?.companyInfo?.industryType || companyInfo?.industryType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Company Size:</span>
                      <span>{companyInfo?.companyInfo?.companySize || companyInfo?.companySize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Location:</span>
                      <span>{companyInfo?.companyInfo?.location || companyInfo?.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Website:</span>
                      <span>{companyInfo?.companyInfo?.website || companyInfo?.website || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Verification Status</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Verification:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        companyInfo?.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {companyInfo?.verificationStatus === 'verified' ? '✅ Verified' : '⏳ Pending Verification'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Approval Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        companyInfo?.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' : 
                        companyInfo?.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {companyInfo?.approvalStatus === 'approved' ? '✅ Approved' : 
                         companyInfo?.approvalStatus === 'rejected' ? '❌ Rejected' : '⏳ Pending Approval'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Member Since:</span>
                      <span>{companyInfo?.createdAt ? new Date(companyInfo.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-4">Profile Completeness</h3>
                <div className="bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.companyProfileCompleteness}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{stats.companyProfileCompleteness}% Complete</span>
                  <span className="text-blue-600 font-medium">
                    {stats.companyProfileCompleteness === 100 ? '🎉 Profile Complete!' : `${100 - stats.companyProfileCompleteness}% remaining`}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Description */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-medium text-gray-900 mb-4">Company Description</h3>
              {companyInfo?.companyInfo?.description || companyInfo?.description ? (
                <p className="text-gray-600 leading-relaxed">{companyInfo?.companyInfo?.description || companyInfo?.description}</p>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No company description added yet</p>
                  <Link href="/profile/company/edit" className="text-blue-600 hover:text-blue-800 text-sm">
                    Add Description
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Profile Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-medium text-gray-900 mb-4">Quick Profile Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/profile/company/edit" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <BuildingIcon />
                  <div>
                    <p className="font-medium">Edit Company Info</p>
                    <p className="text-xs text-gray-500">Update company details</p>
                  </div>
                </Link>
                
                <Link href="/verification/company" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                  <DocumentIcon />
                  <div>
                    <p className="font-medium">Company Verification</p>
                    <p className="text-xs text-gray-500">Verify company credentials</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
