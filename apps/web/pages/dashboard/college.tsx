import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import CollegeRegistrationNavbar from '../../components/CollegeRegistrationNavbar';
import CollegeInvitationManager from '../../components/CollegeInvitationManager';
import CollegeConnectionManager from '../../components/CollegeConnectionManager';
import CollegeJobManager from '../../components/CollegeJobManager';
import ProtectedRoute from '../../components/ProtectedRoute';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Type Definitions
interface CollegeInfo {
  _id: string;
  name: string;
  email: string;
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
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
}

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
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      // Extract userId from JWT token
      let userId;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
        
        if (!userId) {
          console.log('No userId in token, redirecting to login');
          router.push('/login');
          return;
        }
      } catch (tokenError) {
        console.log('Invalid token format, redirecting to login');
        router.push('/login');
        return;
      }

      // Load college info
      const collegeResponse = await axios.get(
        `${API_BASE_URL}/api/colleges/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCollegeInfo(collegeResponse.data);

      // Load stats
      const statsResponse = await axios.get(
        `${API_BASE_URL}/api/colleges/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStats(statsResponse.data);

      // Load other data based on active tab
      await loadTabData(activeTab, collegeResponse.data._id);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      // If unauthorized, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/login');
        return;
      }
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: string, collegeId: string) => {
    const token = localStorage.getItem('token');
    
    try {
      switch (tab) {
        case 'students':
        case 'database':
          const studentsResponse = await axios.get(
            `${API_BASE_URL}/api/colleges/${collegeId}/students`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setStudents(studentsResponse.data);
          break;
          
        case 'jobs':
          const jobsResponse = await axios.get(
            `${API_BASE_URL}/api/colleges/${collegeId}/jobs`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setJobs(jobsResponse.data);
          break;
          
        case 'placements':
          const placementsResponse = await axios.get(
            `${API_BASE_URL}/api/colleges/${collegeId}/placements`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPlacements(placementsResponse.data);
          break;
          
        case 'events':
        case 'courses':
        case 'interviews':
          const eventsResponse = await axios.get(
            `${API_BASE_URL}/api/colleges/${collegeId}/events`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setEvents(eventsResponse.data);
          break;
          
        case 'connections':
          const connectionsResponse = await axios.get(
            `${API_BASE_URL}/api/connections/college/${collegeId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setConnections(connectionsResponse.data);
          break;
          
        case 'fees':
        case 'communications':
        case 'analytics':
        case 'automation':
        case 'profile':
        case 'overview':
        default:
          // These tabs don't require additional data loading
          break;
      }
    } catch (err) {
      console.error(`Error loading ${tab} data:`, err);
    }
  };

  // Tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard/college?tab=${tab}`, undefined, { shallow: true });
    
    if (collegeInfo) {
      loadTabData(tab, collegeInfo._id);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <button
            onClick={loadDashboardData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-6 lg:p-8">
            {/* Main Stats Cards */}
            <div className="flex flex-wrap gap-5 mb-8">
              {/* Total Enquiries Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px]">
                <div className="flex justify-between items-start mb-6">
                  <div className= "flex items-center justify-between space-x-2 text-center">
                    <h3 className="text-base font-medium text-black mb-1">Total Enquiries</h3>
                    <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      12 New
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-base mb-8">
                  Process new student enquiries<br />and follow-ups
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">24</p>
                    <p className="text-sm text-gray-600 text-center">This week</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">156</p>
                    <p className="text-sm text-gray-600 text-center">Total</p>
                  </div>
                </div>
              </div>

              {/* Interviews Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px]">
                <div className="flex justify-between items-start mb-6">
                  
                  <div className= "flex items-center justify-between space-x-2 text-center">
                    <h3 className="text-base font-medium text-black mb-1">Interviews</h3>
                    <span className="bg-yellow-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      8 Pending
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-base mb-8">
                  Schedule and track student<br />interviews
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">24</p>
                    <p className="text-sm text-gray-600 text-center">This week</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">156</p>
                    <p className="text-sm text-gray-600 text-center">Total</p>
                  </div>
                </div>
              </div>

              {/* Job Invitations Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px]">
                <div className="flex justify-between items-start mb-6">
                  <div className= "flex items-center justify-between space-x-2 text-center">
                    <h3 className="text-base font-medium text-black mb-1">Job Invitations</h3>
                    <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      5 Active
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-base mb-8">
                  Schedule and track student<br />interviews
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">24</p>
                    <p className="text-sm text-gray-600 text-center">This week</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-blue-600 mb-1 text-center">156</p>
                    <p className="text-sm text-gray-600 text-center">Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Performance Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-medium text-black mb-1">Monthly Performance</h3>
                  <p className="text-gray-600 text-sm">Enquiries, interviews, and job invitations trend</p>
                </div>
                <div className="flex gap-3">
                  <button className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
                    Share Report
                  </button>
                  <button className="border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
              
              {/* Chart Placeholder */}
              <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-lg mb-2">📊</div>
                  <p className="text-gray-500">Chart visualization would be rendered here</p>
                  <p className="text-gray-400 text-sm">Data: Enquiries, Interviews, Job Invitations by month</p>
                </div>
              </div>
            </div>

          {/* Bottom Status Cards */}
<div className="flex flex-wrap gap-5">
  {/* Enquiries Status */}
  <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px] flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-black">Enquiries Status</h3>
    </div>
    
    <div className="space-y-4 mb-6 flex-1">
      {[
        { label: 'New', count: 1, color: 'bg-blue-500' },
        { label: 'Contacted', count: 3, color: 'bg-yellow-500' },
        { label: 'Interested', count: 2, color: 'bg-green-500' },
        { label: 'Converted', count: 1, color: 'bg-purple-500' },
        { label: 'Closed', count: 1, color: 'bg-red-500' }
      ].map((item) => (
        <div key={item.label} className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
            <span className="text-gray-600">{item.label}</span>
          </div>
          <div className="w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center text-sm text-gray-600">
            {item.count}
          </div>
        </div>
      ))}
    </div>
    
    <div className="border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center">
        <span className="font-medium text-black">Total</span>
        <div className="w-7 h-7 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center text-sm text-blue-600">
          8
        </div>
      </div>
    </div>
  </div>

  {/* Interview Status */}
  <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px] flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-black">Enquiries Status</h3>
    </div>
    
    <div className="space-y-4 mb-6 flex-1">
      {[
        { label: 'Schedule', count: 8, color: 'bg-yellow-500' },
        { label: 'In Progress', count: 5, color: 'bg-blue-500' },
        { label: 'Completed', count: 11, color: 'bg-green-500' }
      ].map((item) => (
        <div key={item.label} className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
            <span className="text-gray-600">{item.label}</span>
          </div>
          <div className="w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center text-sm text-gray-600">
            {item.count}
          </div>
        </div>
      ))}
    </div>
    
    <div className="border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center">
        <span className="font-medium text-black">Total</span>
        <div className="w-7 h-7 bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center text-sm text-orange-600">
          24
        </div>
      </div>
    </div>
  </div>

  {/* Job Offer Status */}
  <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 min-w-[320px] flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      </div>
      <h3 className="text-base font-medium text-black">Job Offer Status</h3>
    </div>
    
    <div className="space-y-4 mb-6 flex-1">
      {[
        { label: 'Pending', count: 7, color: 'bg-yellow-500' },
        { label: 'Accepted', count: 8, color: 'bg-green-500' },
        { label: 'Declined', count: 3, color: 'bg-red-500' }
      ].map((item) => (
        <div key={item.label} className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
            <span className="text-gray-600">{item.label}</span>
          </div>
          <div className="w-6 h-6 border border-gray-300 rounded-full flex items-center justify-center text-sm text-gray-600">
            {item.count}
          </div>
        </div>
      ))}
    </div>
    
    <div className="border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center">
        <span className="font-medium text-black">Total</span>
        <div className="w-7 h-7 bg-green-100 border border-green-400 rounded-full flex items-center justify-center text-sm text-green-600">
          18
        </div>
      </div>
    </div>
  </div>
</div>

          </div>
        );
      
      case 'students':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Students</h2>
              <button
                onClick={() => setShowStudentModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Student</span>
              </button>
            </div>
            <div className="space-y-2">
              {students.map(student => (
                <div key={student._id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{student.firstName} {student.lastName}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      <p className="text-sm text-gray-500">{student.department} - Year {student.year}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'connections':
        return (
          <div className="p-6">
            <CollegeConnectionManager />
          </div>
        );

      case 'database':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Student Database</h2>
            <div className="space-y-2">
              {students.map(student => (
                <div key={student._id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{student.firstName} {student.lastName}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      <p className="text-sm text-gray-500">{student.department} - Year {student.year}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'courses':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Courses</h2>
            <p className="text-gray-600">Course management will be implemented here.</p>
          </div>
        );

      case 'interviews':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Interviews</h2>
            <p className="text-gray-600">Interview scheduling and management will be implemented here.</p>
          </div>
        );

      case 'fees':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pay Fees</h2>
            <p className="text-gray-600">Fee payment and management will be implemented here.</p>
          </div>
        );

      case 'communications':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Communications</h2>
            <p className="text-gray-600">Communication tools will be implemented here.</p>
          </div>
        );

      case 'analytics':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <p className="text-gray-600">Analytics dashboard will be implemented here.</p>
          </div>
        );

      case 'automation':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Automation</h2>
            <p className="text-gray-600">Automation settings will be implemented here.</p>
          </div>
        );

      case 'profile':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">College Profile</h2>
            {collegeInfo && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">College Name</label>
                    <p className="mt-1 text-sm text-gray-900">{collegeInfo.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{collegeInfo.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <p className="mt-1 text-sm text-gray-900">{collegeInfo.contactPerson}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{collegeInfo.phoneNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">College Type</label>
                    <p className="mt-1 text-sm text-gray-900">{collegeInfo.collegeType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Established Year</label>
                    <p className="mt-1 text-sm text-gray-900">{collegeInfo.establishedYear || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {collegeInfo.address.street}, {collegeInfo.address.city}, {collegeInfo.address.state} {collegeInfo.address.zip}
                  </p>
                </div>
                {collegeInfo.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{collegeInfo.description}</p>
                  </div>
                )}
                <div className="pt-4">
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-6">
            <p className="text-gray-600">Content for {activeTab} will be implemented here.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Full Width Navbar */}
      <CollegeRegistrationNavbar 
        collegeName={collegeInfo?.name} 
        status={collegeInfo?.approvalStatus as 'pending' | 'approved' | 'rejected'} 
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1">
            {/* Navigation Items */}
            <div className="px-3 py-6">
              <nav className="space-y-1">
              <button
                onClick={() => handleTabChange('overview')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 15V9a2 2 0 014 0v6m0 0V9a2 2 0 014 0v6m-4-3h4" />
                </svg>
                Dashboard
              </button>

              <button
                onClick={() => handleTabChange('students')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'students'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Admission Enquiries
              </button>

              <button
                onClick={() => handleTabChange('placements')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'placements'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Campus Placement
              </button>

              <button
                onClick={() => handleTabChange('connections')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'connections'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Companies
              </button>

              <button
                onClick={() => handleTabChange('database')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'database'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Student Database
              </button>

              <button
                onClick={() => handleTabChange('courses')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'courses'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Courses
              </button>

              <button
                onClick={() => handleTabChange('interviews')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'interviews'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Interviews
              </button>

              <button 
                onClick={() => handleTabChange('fees')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'fees'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pay Fees
              </button>

              <button 
                onClick={() => handleTabChange('communications')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'communications'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Communications
              </button>

              <button 
                onClick={() => handleTabChange('analytics')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Analytics
              </button>

              <button 
                onClick={() => handleTabChange('automation')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'automation'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Automation
              </button>

              <button
                onClick={() => handleTabChange('profile')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                  User Management
                </button>
              </nav>
            </div>
          </div>          {/* Today's Summary */}
          <div className="px-3 mb-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="text-lg font-medium text-black mb-4">Today's Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Enquiries</span>
                  <span className="bg-blue-100 border border-blue-300 text-blue-600 text-sm px-2 py-1 rounded-lg">234</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Interviews</span>
                  <span className="bg-orange-100 border border-orange-300 text-orange-600 text-sm px-2 py-1 rounded-lg">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Job Invitations</span>
                  <span className="bg-green-100 border border-green-400 text-green-600 text-sm px-2 py-1 rounded-lg">18</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="px-3 pb-4 border-t border-gray-200">
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                router.push('/login');
              }}
              className="w-full flex items-center px-3 py-3 mt-4 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
            >
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Page Header */}
          <div className="bg-white px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-semibold text-black">
                  Welcome back, <span className="text-blue-600">{collegeInfo?.name || 'XYZ College'} !</span>
                </h1>
                <p className="text-gray-600 text-sm mt-1">Dashboard. Overview</p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={refreshData}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-md text-sm hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Data</span>
                </button>
                
                {/* Notification Icon */}
                <div className="relative">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5-5V9a4 4 0 00-8 0v3l-5 5h5a3 3 0 006 0z" />
                    </svg>
                  </button>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
                </div>
                
                {/* Settings Icon */}
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-gray-50">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with ProtectedRoute
export default function CollegeDashboardPage() {
  return (
    <ProtectedRoute requireApproval={true} allowedRoles={['college']}>
      <CollegeDashboard />
    </ProtectedRoute>
  );
}
