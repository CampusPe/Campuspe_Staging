import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import ApprovalStatus from '../../components/ApprovalStatus';
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

interface Connection {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    userType: 'college' | 'recruiter' | 'student';
    profile?: {
      firstName: string;
      lastName: string;
      designation: string;
    };
    companyInfo?: any;
  };
  target: {
    _id: string;
    name: string;
    email: string;
    userType: 'college' | 'recruiter' | 'student';
    profile?: {
      firstName: string;
      lastName: string;
      designation: string;
    };
    companyInfo?: any;
  };
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
  acceptedAt?: string;
  isRequester?: boolean;
}

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    companyName: string;
    location: string;
  };
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  resumeFile?: string;
  coverLetter?: string;
  currentStatus: 'applied' | 'screening' | 'shortlisted' | 'interview_scheduled' | 'interview_completed' | 'selected' | 'rejected' | 'withdrawn';
  appliedAt: string;
  lastUpdated: string;
  matchScore?: number;
  statusHistory: any[];
  recruiterId: string;
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
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('');

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
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  // Utility functions
  const getStatusColor = (status: string) => {
    const statusColors = {
      applied: 'bg-blue-100 text-blue-800',
      screening: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-purple-100 text-purple-800',
      interview_scheduled: 'bg-indigo-100 text-indigo-800',
      interview_completed: 'bg-indigo-100 text-indigo-800',
      interviewed: 'bg-indigo-100 text-indigo-800',
      selected: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rescheduled: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      closed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      negotiating: 'bg-purple-100 text-purple-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  // API calls
  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token) {
        router.push('/login');
        return;
      }

      // Validate user role first
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;
        
        if (userRole !== 'recruiter') {
          console.error(`Invalid user role for recruiter dashboard: ${userRole}`);
          localStorage.removeItem('token');
          localStorage.removeItem('profileData');
          localStorage.removeItem('userId');
          localStorage.removeItem('role');
          
          // Redirect to appropriate login page
          if (userRole === 'student') {
            router.push('/login');
          } else if (['college', 'college_admin', 'placement_officer'].includes(userRole)) {
            router.push('/college-login');
          } else {
            router.push('/company-login');
          }
          return;
        }
      } catch (error) {
        console.error('Error validating token:', error);
        router.push('/company-login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // First check approval status
      if (userId) {
        try {
          const approvalResponse = await axios.get(`${API_BASE_URL}/api/recruiters/user/${userId}`, { headers });
          const approvalData = approvalResponse.data;
          
          // If not approved or not active, redirect to approval pending page
          if (approvalData.approvalStatus !== 'approved' || !approvalData.isActive) {
            router.push('/approval-pending?type=recruiter');
            return;
          }
        } catch (approvalError) {
          console.error('Error checking approval status:', approvalError);
          // Continue loading if approval check fails
        }
      }

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
      console.log('Applications fetched:', applications);
      console.log('First application sample:', applications[0]);
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

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.delete(`${API_BASE_URL}/api/jobs/${jobId}`, { headers });
      
      // Refresh jobs
      const jobsResponse = await axios.get(`${API_BASE_URL}/api/jobs/recruiter-jobs`, { headers });
      setMyJobs(Array.isArray(jobsResponse.data) ? jobsResponse.data : []);
      
      // Refresh stats
      const statsResponse = await axios.get(`${API_BASE_URL}/api/recruiters/stats`, { headers });
      setStats(statsResponse.data);
      
      alert('Job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to reject this application?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Update status to rejected (don't delete)
      await axios.patch(`${API_BASE_URL}/api/applications/${applicationId}/status`, 
        { status: 'rejected' }, 
        { headers }
      );

      // Send notification to student
      await axios.post(`${API_BASE_URL}/api/notifications/send`, {
        type: 'application_rejected',
        applicationId: applicationId,
        message: 'Your application has been reviewed and unfortunately was not selected for the next round.'
      }, { headers });
      
      // Refresh applications
      const applicationsResponse = await axios.get(`${API_BASE_URL}/api/applications/my-applications`, { headers });
      setRecentApplications(applicationsResponse.data.slice(0, 5));
      
      // Refresh stats
      const statsResponse = await axios.get(`${API_BASE_URL}/api/recruiters/stats`, { headers });
      setStats(statsResponse.data);
      
      alert('Application rejected and notification sent to student');
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application. Please try again.');
    }
  };

  const handleAcceptAndNotify = async (applicationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Update application status to selected
      await axios.patch(`${API_BASE_URL}/api/applications/${applicationId}/status`, 
        { status: 'selected' }, 
        { headers }
      );

      // Create interview entry
      await axios.post(`${API_BASE_URL}/api/interviews/create-from-application`, 
        { applicationId }, 
        { headers }
      );

      // Send notification to student
      await axios.post(`${API_BASE_URL}/api/notifications/send`, {
        type: 'job_selection',
        applicationId: applicationId,
        message: 'Congratulations! You have been shortlisted for the position.'
      }, { headers });
      
      // Refresh applications
      const applicationsResponse = await axios.get(`${API_BASE_URL}/api/applications/my-applications`, { headers });
      setRecentApplications(applicationsResponse.data.slice(0, 5));
      
      // Refresh stats
      const statsResponse = await axios.get(`${API_BASE_URL}/api/recruiters/stats`, { headers });
      setStats(statsResponse.data);
      
      alert('Application accepted and notification sent to student!');
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Failed to accept application. Please try again.');
    }
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
      
      const confirmed = confirm('Are you sure you want to resend this invitation?');
      if (confirmed) {
        const resendData = {
          newMessage: 'We would like to revisit this opportunity with updated terms.',
          expiresInDays: 14
        };
        
        await axios.post(`${API_BASE_URL}/api/invitations/${invitationId}/resend`, resendData, { headers });
        
        // Refresh invitations data
        fetchCompanyData();
        alert('Invitation resent successfully!');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      if (axios.isAxiosError(error) && error.response?.data) {
        alert(`Failed to resend invitation: ${error.response.data.message}`);
      } else {
        alert('Failed to resend invitation');
      }
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

  const fetchConnections = async () => {
    try {
      setConnectionsLoading(true);
      
      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        console.warn('fetchConnections called on server side, skipping');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No authentication token found');
        setError('Please log in to view connections');
        return;
      }

      console.log('Fetching connections with token:', token.substring(0, 20) + '...');
      console.log('API URL:', `${API_BASE_URL}/api/connections`);
      
      const response = await axios.get(`${API_BASE_URL}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Connections response status:', response.status);
      console.log('Connections response data:', response.data);
      setConnections(response.data || []);
      setError(''); // Clear any previous errors
    } catch (error: any) {
      console.error('Error fetching connections:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
        router.push('/login');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
        console.error('Server error details:', error.response.data);
      } else {
        setError(`Failed to load connections: ${error.message}`);
      }
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      // Safety check: Find the connection and verify we're the target
      const connection = connections.find(c => c._id === connectionId);
      if (!connection) {
        console.error('Connection not found:', connectionId);
        return;
      }
      
      if (connection.isRequester) {
        console.error('❌ SAFETY CHECK FAILED: Cannot accept connection where we are the requester');
        console.error('Connection details:', {
          id: connectionId,
          isRequester: connection.isRequester,
          status: connection.status,
          requesterEmail: connection.requester?.email,
          targetEmail: connection.target?.email
        });
        setError('Error: You cannot accept a connection request that you sent.');
        return;
      }
      
      console.log('✅ Accepting connection:', connectionId, 'isRequester:', connection.isRequester);
      
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/connections/${connectionId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh connections
      fetchConnections();
    } catch (error) {
      console.error('Error accepting connection:', error);
      setError('Failed to accept connection');
    }
  };

  const handleDeclineConnection = async (connectionId: string) => {
    try {
      // Safety check: Find the connection and verify we're the target
      const connection = connections.find(c => c._id === connectionId);
      if (!connection) {
        console.error('Connection not found:', connectionId);
        return;
      }
      
      if (connection.isRequester) {
        console.error('❌ SAFETY CHECK FAILED: Cannot decline connection where we are the requester');
        console.error('Connection details:', {
          id: connectionId,
          isRequester: connection.isRequester,
          status: connection.status,
          requesterEmail: connection.requester?.email,
          targetEmail: connection.target?.email
        });
        setError('Error: You cannot decline a connection request that you sent.');
        return;
      }
      
      console.log('✅ Declining connection:', connectionId, 'isRequester:', connection.isRequester);
      
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/connections/${connectionId}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh connections
      fetchConnections();
    } catch (error) {
      console.error('Error declining connection:', error);
      setError('Failed to decline connection');
    }
  };

  const handleWithdrawConnection = async (connectionId: string) => {
    try {
      // Safety check: Find the connection and verify we're the requester
      const connection = connections.find(c => c._id === connectionId);
      if (!connection) {
        console.error('Connection not found:', connectionId);
        return;
      }
      
      if (!connection.isRequester) {
        console.error('❌ SAFETY CHECK FAILED: Cannot withdraw connection where we are not the requester');
        console.error('Connection details:', {
          id: connectionId,
          isRequester: connection.isRequester,
          status: connection.status,
          requesterEmail: connection.requester?.email,
          targetEmail: connection.target?.email
        });
        setError('Error: You can only withdraw connection requests that you sent.');
        return;
      }
      
      console.log('✅ Withdrawing connection:', connectionId, 'isRequester:', connection.isRequester);
      
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/connections/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh connections
      fetchConnections();
    } catch (error) {
      console.error('Error withdrawing connection:', error);
      setError('Failed to withdraw connection');
    }
  };

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found, redirecting to login');
      router.push('/login');
      return;
    }
    console.log('Authentication token found, proceeding with dashboard load');
  }, [router]);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  useEffect(() => {
    if (activeTab === 'connections' && typeof window !== 'undefined') {
      fetchConnections();
    }
  }, [activeTab]);

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
    <>
    <Navbar />
          <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
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
              { id: 'connections', label: 'Connections', icon: UserGroupIcon },
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
                          <p className="font-medium text-sm">
                            {application.studentId ? 
                              `${application.studentId.firstName || ''} ${application.studentId.lastName || ''}`.trim() || 'Unknown Student' :
                              'Unknown Student'
                            }
                          </p>
                          <p className="text-xs text-gray-600">
                            {application.jobId ? application.jobId.title || 'Unknown Job' : 'Unknown Job'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'Unknown Date'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(application.currentStatus)}`}>
                          {application.currentStatus ? application.currentStatus.replace('_', ' ').toUpperCase() : 'PENDING'}
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
                            <button
                              onClick={() => handleDeleteJob(job._id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                            >
                              Delete
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
                <select 
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={applicationStatusFilter}
                  onChange={(e) => setApplicationStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="interview_completed">Interview Completed</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>
            
            {Array.isArray(recentApplications) && recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications
                  .filter(application => 
                    !applicationStatusFilter || application.currentStatus === applicationStatusFilter
                  )
                  .map((application) => {
                    // Debug log for each application
                    if (!application.studentId) {
                      console.warn('Application missing studentId:', application);
                    }
                    return (
                      <div key={application._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {application.studentId ? 
                              `${application.studentId.firstName || ''} ${application.studentId.lastName || ''}`.trim() || 'Unknown Student' :
                              'Unknown Student'
                            }
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.currentStatus)}`}>
                            {application.currentStatus ? application.currentStatus.replace('_', ' ').toUpperCase() : 'PENDING'}
                          </span>
                          {application.matchScore && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              {application.matchScore}% Match
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {application.jobId ? application.jobId.title || 'Unknown Job' : 'Unknown Job'}
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                          Applied on {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'Unknown Date'}
                        </p>
                        <div className="flex items-center space-x-4">
                          {application.resumeFile && (
                            <a 
                              href={`${API_BASE_URL}/uploads/resumes/${application.resumeFile}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                            >
                              <DocumentIcon />
                              <span>View Resume</span>
                            </a>
                          )}
                          {application.studentId && application.studentId.email && (
                            <a 
                              href={`mailto:${application.studentId.email}`}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                            >
                              <MailIcon />
                              <span>Contact</span>
                            </a>
                          )}
                          {application.studentId && (
                            <button
                              onClick={() => router.push(`/profile/student/${application.studentId._id}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                            >
                              <EyeIcon />
                              <span>View Profile</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {application.currentStatus === 'applied' && (
                          <button
                            onClick={() => handleUpdateApplicationStatus(application._id, 'screening')}
                            className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200"
                          >
                            Review
                          </button>
                        )}
                        {application.currentStatus === 'screening' && (
                          <>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application._id, 'shortlisted')}
                              className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm hover:bg-purple-200"
                            >
                              Shortlist
                            </button>
                            <button
                              onClick={() => handleRejectApplication(application._id)}
                              className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {application.currentStatus === 'shortlisted' && (
                          <>
                            <button
                              onClick={() => handleAcceptAndNotify(application._id)}
                              className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200"
                            >
                              Accept & Notify
                            </button>
                            <button
                              onClick={() => handleScheduleInterview(application._id)}
                              className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200"
                            >
                              Schedule Interview
                            </button>
                            <button
                              onClick={() => handleRejectApplication(application._id)}
                              className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {application.currentStatus === 'interview_completed' && (
                          <>
                            <button
                              onClick={() => handleAcceptAndNotify(application._id)}
                              className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200"
                            >
                              Select & Notify
                            </button>
                            <button
                              onClick={() => handleRejectApplication(application._id)}
                              className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                      </div>
                    );
                  })}
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
                              {invitation.status ? invitation.status.replace('_', ' ').toUpperCase() : 'PENDING'}
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

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Connections</h2>
                <p className="text-sm text-gray-600">Manage your professional connections</p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {connectionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Incoming Connection Requests */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Incoming Requests</h3>
                    <div className="space-y-3">
                      {connections.filter(conn => !conn.isRequester && conn.status === 'pending').length > 0 ? (
                        connections
                          .filter(conn => !conn.isRequester && conn.status === 'pending')
                          .map((connection) => (
                            <div key={connection._id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-medium">
                                      {connection.requester?.name?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{connection.requester?.name || 'Unknown'}</h4>
                                    <p className="text-sm text-gray-600">{connection.requester?.email || 'No email'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{connection.requester?.userType || 'Unknown'}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleAcceptConnection(connection._id)}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineConnection(connection._id)}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                              {connection.message && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700">"{connection.message}"</p>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Requested on {new Date(connection.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No incoming connection requests</p>
                      )}
                    </div>
                  </div>

                  {/* Outgoing Connection Requests */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Sent Requests</h3>
                    <div className="space-y-3">
                      {connections.filter(conn => conn.isRequester && conn.status === 'pending').length > 0 ? (
                        connections
                          .filter(conn => conn.isRequester && conn.status === 'pending')
                          .map((connection) => (
                            <div key={connection._id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-gray-600 font-medium">
                                      {connection.target?.name?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{connection.target?.name || 'Unknown'}</h4>
                                    <p className="text-sm text-gray-600">{connection.target?.email || 'No email'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{connection.target?.userType || 'Unknown'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                                    Pending
                                  </span>
                                  <button
                                    onClick={() => handleWithdrawConnection(connection._id)}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                                  >
                                    Withdraw
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Sent on {new Date(connection.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No pending sent requests</p>
                      )}
                    </div>
                  </div>

                  {/* Accepted Connections */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Established Connections</h3>
                    <div className="space-y-3">
                      {connections.filter(conn => conn.status === 'accepted').length > 0 ? (
                        connections
                          .filter(conn => conn.status === 'accepted')
                          .map((connection) => {
                            const otherUser = connection.requester?.userType === 'recruiter' ? connection.target : connection.requester;
                            return (
                              <div key={connection._id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                      <span className="text-green-600 font-medium">
                                        {otherUser?.name?.charAt(0) || '?'}
                                      </span>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{otherUser?.name || 'Unknown'}</h4>
                                      <p className="text-sm text-gray-600">{otherUser?.email || 'No email'}</p>
                                      <p className="text-xs text-gray-500 capitalize">{otherUser?.userType || 'Unknown'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                      Connected
                                    </span>
                                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition">
                                      Message
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Connected on {new Date(connection.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            );
                          })
                      ) : (
                        <p className="text-gray-500 text-center py-4">No established connections yet</p>
                      )}
                    </div>
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
                <Link href="/profile/edit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
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
                  <Link href="/profile/edit" className="text-blue-600 hover:text-blue-800 text-sm">
                    Add Description
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Profile Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-medium text-gray-900 mb-4">Quick Profile Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/profile/edit" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
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
    </main>
  </>
  );
};

export default RecruiterDashboard;
