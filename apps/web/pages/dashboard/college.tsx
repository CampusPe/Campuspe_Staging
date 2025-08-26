import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import ApprovalStatus from '../../components/ApprovalStatus';
import CollegeInvitationManager from '../../components/CollegeInvitationManager';
import CollegeConnectionManager from '../../components/CollegeConnectionManager';
import CollegeJobManager from '../../components/CollegeJobManager';

// Icons
const UserGroupIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 01 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 01 9.288 0M15 7a3 3 0 11-6 0 3 3 0 01 6 0zm6 3a2 2 0 11-4 0 2 2 0 01 4 0zM7 10a2 2 0 11-4 0 2 2 0 01 4 0z" />
  </svg>
);

const BriefcaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 01 2 2v6M8 6V4a2 2 0 01 2-2h4a2 2 0 01 2 2v2m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2" />
  </svg>
);

const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 01 2-2h2a2 2 0 01 2 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 01 2-2h2a2 2 0 01 2 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AcademicCapIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422A12.083 12.083 0 0121 14.85V19a2 2 0 01-2 2H5a2 2 0 01-2-2v-4.15a12.083 12.083 0 01 2.84-3.272L12 14z" />
  </svg>
);

const BuildingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const DocumentIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const MailIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// Types and Interfaces
interface CollegeInfo {
  _id: string;
  name: string;
  email: string;
  location: string;
  primaryContact: {
    name: string;
    email: string;
    phoneNumber?: string;
  
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  website?: string;
  contactPerson: string;
  phoneNumber?: string;
  establishedYear?: number;
  collegeType: string;
  affiliation?: string;
  description?: string;
  logo?: string;
  isVerified: boolean;
  verificationStatus: string;
  createdAt: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  year?: string;
  enrollmentNumber?: string;
  skills: string[];
  cgpa?: number;
  resumeUrl?: string;
  isActive: boolean;
  lastLoginDate?: string;
  createdAt: string;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship';
  description: string;
  requirements: string[];
  salary?: string;
  isActive: boolean;
  applicationDeadline?: string;
  createdAt: string;
}

interface PlacementData {
  _id: string;
  studentId: string;
  studentName: string;
  company: string;
  position: string;
  package: number;
  placementDate: string;
  placementType: 'campus' | 'off-campus';
  status: 'placed' | 'offer-letter' | 'joining-pending';
}

interface CampusEvent {
  _id: string;
  title: string;
  description: string;
  eventType: 'placement' | 'seminar' | 'workshop' | 'company-visit';
  date: string;
  time: string;
  venue: string;
  organizer: string;
  maxParticipants?: number;
  registeredCount: number;
  isActive: boolean;
}

interface Stats {
  totalStudents: number;
  activeStudents: number;
  totalPlacements: number;
  averagePackage: number;
  topPackage: number;
  placementPercentage: number;
  activeJobs: number;
  upcomingEvents: number;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const CollegeDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State
  const [collegeInfo, setCollegeInfo] = useState<CollegeInfo | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    totalPlacements: 0,
    averagePackage: 0,
    topPackage: 0,
    placementPercentage: 0,
    activeJobs: 0,
    upcomingEvents: 0,
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [placements, setPlacements] = useState<PlacementData[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // Form states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<any>({});

  useEffect(() => {
    // Handle tab from URL query parameter
    const { tab } = router.query;
    if (tab && typeof tab === 'string') {
      setActiveTab(tab);
    }
    loadDashboardData();
  }, [router.query]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      // Validate user role first
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role;
        
        if (!['college', 'college_admin', 'placement_officer'].includes(userRole)) {
          console.error(`Invalid user role for college dashboard: ${userRole}`);
          localStorage.removeItem('token');
          localStorage.removeItem('profileData');
          localStorage.removeItem('userId');
          localStorage.removeItem('role');
          
          // Redirect to appropriate login page
          if (userRole === 'student') {
            router.push('/login');
          } else if (userRole === 'recruiter') {
            router.push('/company-login');
          } else {
            router.push('/college-login');
          }
          return;
        }
      } catch (error) {
        console.error('Error validating token:', error);
        router.push('/college-login');
        return;
      }

      console.log('Loading dashboard with token:', token ? 'Present' : 'Missing');
      console.log('User ID:', userId);

      const headers = { Authorization: `Bearer ${token}` };

      // First check approval status
      if (userId) {
        try {
          const approvalResponse = await axios.get(`${API_BASE_URL}/api/colleges/user/${userId}`, { headers });
          const approvalData = approvalResponse.data;
          
          // If not approved or not active, redirect to approval pending page
          if (approvalData.approvalStatus !== 'approved' || !approvalData.isActive) {
            router.push('/approval-pending?type=college');
            return;
          }
        } catch (approvalError: any) {
          console.error('Error checking approval status:', approvalError);
          if (approvalError.response?.status === 401) {
            console.log('Token expired during approval check, redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            router.push('/login');
            return;
          }
          // Continue loading if approval check fails for other reasons
        }
      }

      // Load all data in parallel
      const [
        collegeResponse,
        statsResponse,
        studentsResponse,
        jobsResponse,
        placementsResponse,
        eventsResponse,
        connectionsResponse
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/colleges/profile`, { headers }),
        axios.get(`${API_BASE_URL}/api/colleges/stats`, { headers }),
        axios.get(`${API_BASE_URL}/api/colleges/students`, { headers }),
        axios.get(`${API_BASE_URL}/api/colleges/jobs`, { headers }),
        axios.get(`${API_BASE_URL}/api/colleges/placements`, { headers }),
        axios.get(`${API_BASE_URL}/api/colleges/events`, { headers }),
        axios.get(`${API_BASE_URL}/api/connections`, { headers }).catch(() => ({ data: [] }))
      ]);

      setCollegeInfo(collegeResponse.data);
      setStats(statsResponse.data);
      setStudents(Array.isArray(studentsResponse.data) ? studentsResponse.data : []);
      setJobs(Array.isArray(jobsResponse.data) ? jobsResponse.data : []);
      setPlacements(Array.isArray(placementsResponse.data) ? placementsResponse.data : []);
      setEvents(Array.isArray(eventsResponse.data) ? eventsResponse.data : []);
      setConnections(Array.isArray(connectionsResponse.data) ? connectionsResponse.data.filter(conn => 
        conn && conn.target && conn.requester && conn.target._id && conn.requester._id
      ) : []);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.message,
        endpoint: error.config?.url
      });
      
      setError('Failed to load dashboard data');
      
      if (error.response?.status === 401) {
        console.log('Authentication failed, clearing token and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Student Management
  const handleCreateStudent = async (studentData: Partial<Student>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/colleges/students`,
        studentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents([...students, response.data]);
      setShowStudentModal(false);
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error creating student:', error);
    }
  };

  const handleUpdateStudent = async (studentId: string, studentData: Partial<Student>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/colleges/students/${studentId}`,
        studentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(students.map(s => s._id === studentId ? response.data : s));
      setShowStudentModal(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/colleges/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(students.filter(s => s._id !== studentId));
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  // Job Management
  const handleCreateJob = async (jobData: Partial<Job>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/colleges/jobs`,
        jobData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs([...jobs, response.data]);
      setShowJobModal(false);
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const handleUpdateJob = async (jobId: string, jobData: Partial<Job>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/colleges/jobs/${jobId}`,
        jobData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs(jobs.map(j => j._id === jobId ? response.data : j));
      setShowJobModal(false);
      setEditingJob(null);
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/colleges/jobs/${jobId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJobs(jobs.filter(j => j._id !== jobId));
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  // Event Management
  const handleCreateEvent = async (eventData: Partial<CampusEvent>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/colleges/events`,
        eventData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvents([...events, response.data]);
      setShowEventModal(false);
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: Partial<CampusEvent>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/colleges/events/${eventId}`,
        eventData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvents(events.map(e => e._id === eventId ? response.data : e));
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/colleges/events/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvents(events.filter(e => e._id !== eventId));
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Connection Management
  const handleAcceptConnection = async (connectionId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/connections/${connectionId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Reload connections to update status
      const response = await axios.get(`${API_BASE_URL}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error accepting connection:', error);
    }
  };

  const handleDeclineConnection = async (connectionId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/connections/${connectionId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Reload connections to update status
      const response = await axios.get(`${API_BASE_URL}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error declining connection:', error);
    }
  };

  // Profile Management
  const handleEditProfile = () => {
    setProfileFormData({
      name: collegeInfo?.name || '',
      email: collegeInfo?.email || '',
      location: collegeInfo?.location || '',
      address: {
        street: collegeInfo?.address?.street || '',
        city: collegeInfo?.address?.city || '',
        state: collegeInfo?.address?.state || '',
        zip: collegeInfo?.address?.zip || ''
      },
      website: collegeInfo?.website || '',
      contactPerson: collegeInfo?.contactPerson || '',
      phoneNumber: collegeInfo?.phoneNumber || '',
      establishedYear: collegeInfo?.establishedYear || '',
      collegeType: collegeInfo?.collegeType || '',
      affiliation: collegeInfo?.affiliation || '',
      description: collegeInfo?.description || ''
    });
    setEditingProfile(true);
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/colleges/profile`,
        profileFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCollegeInfo(response.data);
      setEditingProfile(false);
      setProfileFormData({});
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancelProfileEdit = () => {
    setEditingProfile(false);
    setProfileFormData({});
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
            Welcome back, {collegeInfo?.name || 'College'}!
          </h1>
          <p className="text-gray-600">
            Manage your students, placements, and campus activities
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {['overview', 'students', 'invitations', 'connections', 'jobs', 'placements', 'events', 'analytics', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalStudents}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BriefcaseIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Placements</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalPlacements}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Placement Rate</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.placementPercentage}%</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Events</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.upcomingEvents}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Placements</h3>
                  <div className="space-y-4">
                    {Array.isArray(placements) && placements.length > 0 ? (
                      placements.slice(0, 5).map((placement) => (
                        <div key={placement._id} className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <AcademicCapIcon className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {placement.studentName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                            {placement.company} - {placement.position}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          ₹{placement.package}L
                        </div>
                      </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No recent placements available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h3>
                  <div className="space-y-4">
                    {Array.isArray(events) && events.length > 0 ? (
                      events.filter(e => e.isActive).slice(0, 5).map((event) => (
                        <div key={event._id} className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <CalendarIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {new Date(event.date).toLocaleDateString()} at {event.time}
                            </p>
                          </div>
                        <div className="text-sm text-gray-500">
                          {event.registeredCount}/{event.maxParticipants || '∞'}
                        </div>
                      </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No upcoming events available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
              <button
                onClick={() => setShowStudentModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="inline w-4 h-4 mr-2" />
                Add Student
              </button>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Students</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CGPA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(students) ? students.map((student) => (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.department || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.cgpa || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingStudent(student);
                              setShowStudentModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No students found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <BriefcaseIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Opportunities</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Job opportunities are now managed through company invitations. Companies will send invitations for campus recruitment, 
                which you can review and respond to in the Invitations section.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setActiveTab('invitations')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  View Invitations
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
                >
                  Manage Students
                </button>
              </div>
            </div>

            {/* Show any existing job data for reference */}
            {Array.isArray(jobs) && jobs.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Job Postings (Read-only)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  These are historical job postings. New opportunities will come through company invitations.
                </p>
                <div className="space-y-4">
                  {jobs.slice(0, 3).map((job) => (
                    <div key={job._id} className="border border-gray-200 rounded-lg p-4 opacity-75">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{job.title}</h4>
                          <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                          <p className="text-sm text-gray-500 mt-1">{job.description?.substring(0, 100)}...</p>
                        </div>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          Archived
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-6">
            <CollegeInvitationManager onRefresh={loadDashboardData} />
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            <CollegeConnectionManager onRefresh={loadDashboardData} />
            <CollegeJobManager onRefresh={loadDashboardData} />
          </div>
        )}

        {/* Placements Tab */}
        {activeTab === 'placements' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Placement Records</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  <PlusIcon className="w-4 h-4 inline mr-2" />
                  Add Placement
                </button>
              </div>
              
              {Array.isArray(placements) && placements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {placements.map((placement) => (
                        <tr key={placement._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{placement.studentName}</div>
                            <div className="text-sm text-gray-500">{placement.studentId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{placement.company}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{placement.package}L</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(placement.placementDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              placement.status === 'placed' ? 'bg-green-100 text-green-800' : 
                              placement.status === 'offer-letter' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {placement.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No placement records</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first placement record.</p>
                  <div className="mt-6">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                      <PlusIcon className="w-4 h-4 inline mr-2" />
                      Add First Placement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Campus Events</h2>
                <button 
                  onClick={() => setShowEventModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <PlusIcon className="w-4 h-4 inline mr-2" />
                  Create Event
                </button>
              </div>
              
              {Array.isArray(events) && events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center text-sm text-gray-500">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {new Date(event.date).toLocaleDateString()} at {event.time}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <BuildingIcon className="w-4 h-4 mr-2" />
                              {event.venue}
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-4 flex justify-end space-x-2">
                        <button 
                          onClick={() => {
                            setEditingEvent(event);
                            setShowEventModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(event._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No events scheduled</h3>
                  <p className="mt-1 text-sm text-gray-500">Create your first campus event to get started.</p>
                  <div className="mt-6">
                    <button 
                      onClick={() => setShowEventModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      <PlusIcon className="w-4 h-4 inline mr-2" />
                      Create First Event
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Placement Rate</p>
                      <p className="text-2xl font-bold">{stats.placementPercentage}%</p>
                    </div>
                    <ChartIcon className="h-8 w-8 text-blue-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Avg Package</p>
                      <p className="text-2xl font-bold">₹{stats.averagePackage}L</p>
                    </div>
                    <BriefcaseIcon className="h-8 w-8 text-green-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Top Package</p>
                      <p className="text-2xl font-bold">₹{stats.topPackage}L</p>
                    </div>
                    <DocumentIcon className="h-8 w-8 text-purple-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Active Students</p>
                      <p className="text-2xl font-bold">{stats.activeStudents}</p>
                    </div>
                    <UserGroupIcon className="h-8 w-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Placement Trends</h3>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ChartIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-500">Placement trends chart will be displayed here</p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Performance</h3>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ChartIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-500">Department performance chart will be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">College Profile</h2>
                {!editingProfile ? (
                  <button
                    onClick={handleEditProfile}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelProfileEdit}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {editingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        College Name
                      </label>
                      <input
                        type="text"
                        value={profileFormData.name || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileFormData.email || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, email: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileFormData.location || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, location: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={profileFormData.website || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, website: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={profileFormData.contactPerson || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, contactPerson: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileFormData.phoneNumber || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, phoneNumber: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Established Year
                      </label>
                      <input
                        type="number"
                        value={profileFormData.establishedYear || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, establishedYear: parseInt(e.target.value)})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        College Type
                      </label>
                      <select
                        value={profileFormData.collegeType || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, collegeType: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Type</option>
                        <option value="Government">Government</option>
                        <option value="Private">Private</option>
                        <option value="Autonomous">Autonomous</option>
                        <option value="Deemed">Deemed University</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Affiliation
                      </label>
                      <input
                        type="text"
                        value={profileFormData.affiliation || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, affiliation: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={profileFormData.description || ''}
                        onChange={(e) => setProfileFormData({...profileFormData, description: e.target.value})}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">College Name</h3>
                      <p className="text-gray-900">{collegeInfo?.name || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="text-gray-900">{collegeInfo?.primaryContact?.email || 'Not provided'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Location</h3>
                      <p className="text-gray-900">{`${collegeInfo?.address?.city || 'Not provided'}, ${collegeInfo?.address?.state || 'Not provided'}`}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Website</h3>
                      {collegeInfo?.website ? (
                        <a href={collegeInfo.website} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:text-blue-800">
                          {collegeInfo.website}
                        </a>
                      ) : (
                        <p className="text-gray-900">Not provided</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
                      <p className="text-gray-900">{collegeInfo?.contactPerson || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                      <p className="text-gray-900">{collegeInfo?.phoneNumber || 'Not provided'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Established Year</h3>
                      <p className="text-gray-900">{collegeInfo?.establishedYear || 'Not provided'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">College Type</h3>
                      <p className="text-gray-900">{collegeInfo?.collegeType || 'Not provided'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Affiliation</h3>
                      <p className="text-gray-900">{collegeInfo?.affiliation || 'Not provided'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="text-gray-900">{collegeInfo?.description || 'Not provided'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Verification Status</h3>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        collegeInfo?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {collegeInfo?.isVerified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
    </main>
    </>
  );
};

export default CollegeDashboard;
