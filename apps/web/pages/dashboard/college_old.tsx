import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

// Icons
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

const BriefcaseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface RecruiterInvitation {
  _id: string;
  jobTitle: string;
  companyName: string;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'negotiating';
  receivedDate: string;
  eligibilityCriteria: {
    minimumCGPA: number;
    allowedCourses: string[];
    graduationYears: number[];
  };
  campusVisitWindow: {
    startDate: string;
    endDate: string;
  };
  maxStudentsPerCollege: number;
  invitationMessage: string;
}

interface PlacementStats {
  totalInvitations: number;
  acceptedInvitations: number;
  pendingInvitations: number;
  activeRecruitments: number;
  studentPlacements: number;
}

interface UpcomingEvent {
  _id: string;
  title: string;
  date: string;
  type: 'campus_visit' | 'interview' | 'recruitment_drive';
  company: string;
}

export default function EnhancedCollegeDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [collegeInfo, setCollegeInfo] = useState<any>(null);
  const [pendingInvitations, setPendingInvitations] = useState<RecruiterInvitation[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [stats, setStats] = useState<PlacementStats>({
    totalInvitations: 0,
    acceptedInvitations: 0,
    pendingInvitations: 0,
    activeRecruitments: 0,
    studentPlacements: 0
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCollegeData();
  }, []);

  const fetchCollegeData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch college profile
      const profileResponse = await axios.get(`${API_BASE_URL}/api/colleges/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCollegeInfo(profileResponse.data);

      // Fetch pending invitations
      try {
        const collegeId = profileResponse.data.id || profileResponse.data._id;
        const invitationsResponse = await axios.get(`${API_BASE_URL}/api/colleges/${collegeId}/invitations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPendingInvitations(invitationsResponse.data?.slice(0, 5) || []);
        
        // Calculate stats
        const totalInvitations = invitationsResponse.data?.length || 0;
        const acceptedInvitations = invitationsResponse.data?.filter((inv: any) => inv.status === 'accepted').length || 0;
        const pendingCount = invitationsResponse.data?.filter((inv: any) => inv.status === 'pending').length || 0;
        
        setStats({
          totalInvitations,
          acceptedInvitations,
          pendingInvitations: pendingCount,
          activeRecruitments: acceptedInvitations,
          studentPlacements: 0 // Will be calculated from placement records
        });
      } catch (error) {
        console.log('Invitations API not available yet');
        setPendingInvitations([]);
      }

    } catch (error) {
      console.error('Error fetching college data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'decline', message?: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/invitations/${invitationId}/${action}`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
      fetchCollegeData();
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'pending': case 'negotiating': return 'text-yellow-600 bg-yellow-100';
      case 'declined': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 3) return 'text-red-600';
    if (days <= 7) return 'text-yellow-600';
    return 'text-green-600';
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
            Welcome, {collegeInfo?.collegeName || 'College'}!
          </h1>
          <p className="text-gray-600">
            Manage recruitment invitations, coordinate campus visits, and track student placements.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: ChartIcon },
              { id: 'invitations', label: 'Recruitment Invitations', icon: MailIcon },
              { id: 'events', label: 'Campus Events', icon: CalendarIcon },
              { id: 'students', label: 'Student Management', icon: UserGroupIcon }
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
                    <p className="text-sm font-medium text-gray-600">Total Invitations</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalInvitations}</p>
                  </div>
                  <MailIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Response</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pendingInvitations}</p>
                  </div>
                  <ClockIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Recruitments</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.activeRecruitments}</p>
                  </div>
                  <BriefcaseIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Student Placements</p>
                    <p className="text-3xl font-bold text-green-600">{stats.studentPlacements}</p>
                  </div>
                  <UserGroupIcon />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/college/invitations" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <MailIcon />
                  <span className="font-medium">Review Invitations</span>
                </Link>
                
                <button 
                  onClick={() => setActiveTab('events')}
                  className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <CalendarIcon />
                  <span className="font-medium">Campus Schedule</span>
                </button>
                
                <Link href="/college/viewstudents" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <UserGroupIcon />
                  <span className="font-medium">Manage Students</span>
                </Link>
                
                <button 
                  onClick={() => setActiveTab('students')}
                  className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <ChartIcon />
                  <span className="font-medium">Placement Report</span>
                </button>
              </div>
            </div>

            {/* Urgent Invitations */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Urgent Invitations</h2>
                <Link href="/college/invitations" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              {pendingInvitations.filter(inv => inv.status === 'pending').length > 0 ? (
                <div className="space-y-4">
                  {pendingInvitations.filter(inv => inv.status === 'pending').slice(0, 3).map((invitation) => (
                    <div key={invitation._id} className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{invitation.jobTitle}</h3>
                          <p className="text-sm text-gray-600">{invitation.companyName}</p>
                          <p className="text-sm text-gray-500">
                            Campus Visit: {new Date(invitation.campusVisitWindow.startDate).toLocaleDateString()} - {new Date(invitation.campusVisitWindow.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleInvitationResponse(invitation._id, 'accept')}
                            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition"
                          >
                            <CheckIcon />
                          </button>
                          <button
                            onClick={() => handleInvitationResponse(invitation._id, 'decline')}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                          >
                            <XIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MailIcon />
                  <p className="mt-2">No pending invitations</p>
                  <p className="text-sm">All caught up with your responses!</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              
              {pendingInvitations.length > 0 ? (
                <div className="space-y-4">
                  {pendingInvitations.slice(0, 5).map((invitation) => (
                    <div key={invitation._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{invitation.jobTitle}</h3>
                        <p className="text-sm text-gray-600">{invitation.companyName}</p>
                        <p className="text-sm text-gray-500">
                          Received {new Date(invitation.receivedDate).toLocaleDateString()}
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
                  <ChartIcon />
                  <p className="mt-2">No recent activity</p>
                  <p className="text-sm">Activity will appear here as you receive invitations</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recruitment Invitations</h2>
              <Link href="/college/invitations" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Manage All Invitations
              </Link>
            </div>
            
            <p className="text-gray-600 mb-6">
              Review and respond to recruitment invitations from companies. Each invitation includes job details, eligibility criteria, and campus visit schedules.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-800 text-sm">
                💡 <strong>Quick Response Tip:</strong> Companies appreciate quick responses. Review invitations within 24-48 hours when possible.
              </p>
            </div>

            {pendingInvitations.length > 0 ? (
              <div className="space-y-6">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{invitation.jobTitle}</h3>
                        <p className="text-gray-600">{invitation.companyName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invitation.status)}`}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Eligibility Criteria</p>
                        <p className="text-sm text-gray-600">Min CGPA: {invitation.eligibilityCriteria.minimumCGPA}</p>
                        <p className="text-sm text-gray-600">Courses: {invitation.eligibilityCriteria.allowedCourses.join(', ')}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900">Campus Visit Window</p>
                        <p className="text-sm text-gray-600">
                          {new Date(invitation.campusVisitWindow.startDate).toLocaleDateString()} - {new Date(invitation.campusVisitWindow.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">Max Students: {invitation.maxStudentsPerCollege}</p>
                      </div>
                    </div>
                    
                    {invitation.status === 'pending' && (
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleInvitationResponse(invitation._id, 'accept')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                        >
                          <CheckIcon />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleInvitationResponse(invitation._id, 'decline')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                        >
                          <XIcon />
                          <span>Decline</span>
                        </button>
                        <Link 
                          href="/college/invitations"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          View Details
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MailIcon />
                <p className="mt-4 text-lg text-gray-600">No invitations received yet</p>
                <p className="text-gray-500">Recruitment invitations from companies will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Campus Events & Schedule</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Manage campus recruitment events, coordinate with companies, and track placement activities.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <CalendarIcon />
                  <h3 className="mt-2 font-medium text-gray-900">Upcoming Campus Visits</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Schedule and coordinate company campus visits for recruitment drives.
                  </p>
                  
                  {stats.acceptedInvitations > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>{stats.acceptedInvitations}</strong> accepted invitations requiring scheduling
                      </p>
                      <Link 
                        href="/college/invitations"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Coordinate schedules →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No campus visits scheduled</p>
                  )}
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <BriefcaseIcon />
                  <h3 className="mt-2 font-medium text-gray-900">Placement Activities</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Track ongoing recruitment activities and student placement progress.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Recruitments:</span>
                      <span className="font-medium">{stats.activeRecruitments}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Student Placements:</span>
                      <span className="font-medium text-green-600">{stats.studentPlacements}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
              <Link href="/college/viewstudents" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                View All Students
              </Link>
            </div>
            
            <p className="text-gray-600 mb-6">
              Manage student registrations, track eligibility, and coordinate placement activities.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <UserGroupIcon />
                  <h3 className="mt-2 font-medium text-gray-900">Student Database</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Access and manage your college's student database for placement activities.
                  </p>
                  <Link 
                    href="/college/viewstudents"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Student Records →
                  </Link>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <ChartIcon />
                  <h3 className="mt-2 font-medium text-gray-900">Placement Analytics</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Track placement statistics and student career outcomes.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Students:</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Placement Rate:</span>
                      <span className="font-medium">-</span>
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
