import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

// Icons
const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface InterviewAssignment {
  _id: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  type: 'online' | 'offline';
  location?: string;
  meetingLink?: string;
}

interface JobApplication {
  _id: string;
  jobTitle: string;
  companyName: string;
  appliedDate: string;
  status: 'applied' | 'under_review' | 'interview_scheduled' | 'rejected' | 'selected';
}

interface StudentStats {
  totalApplications: number;
  interviewsScheduled: number;
  upcomingInterviews: number;
  profileCompleteness: number;
}

export default function EnhancedStudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewAssignment[]>([]);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalApplications: 0,
    interviewsScheduled: 0,
    upcomingInterviews: 0,
    profileCompleteness: 0
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch student profile
      const profileResponse = await axios.get(`${API_BASE_URL}/api/students/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentInfo(profileResponse.data);

      // Fetch upcoming interviews
      try {
        const interviewsResponse = await axios.get(`${API_BASE_URL}/api/interviews/student/assignments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUpcomingInterviews(interviewsResponse.data?.slice(0, 3) || []);
      } catch (error) {
        console.log('Interviews API not available yet');
        setUpcomingInterviews([]);
      }

      // Fetch recent applications
      try {
        const applicationsResponse = await axios.get(`${API_BASE_URL}/api/students/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecentApplications(applicationsResponse.data?.slice(0, 5) || []);
      } catch (error) {
        console.log('Applications API not available yet');
        setRecentApplications([]);
      }

      // Calculate stats
      setStats({
        totalApplications: recentApplications.length || 0,
        interviewsScheduled: upcomingInterviews.length || 0,
        upcomingInterviews: upcomingInterviews.filter((i: any) => 
          new Date(i.interviewDate) > new Date() && i.status === 'confirmed'
        ).length || 0,
        profileCompleteness: calculateProfileCompleteness(profileResponse.data)
      });

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompleteness = (profile: any) => {
    const fields = [
      profile?.personalInfo?.phone,
      profile?.personalInfo?.address,
      profile?.education?.length > 0,
      profile?.skills?.length > 0,
      profile?.resumeUploaded
    ];
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': case 'selected': return 'text-green-600 bg-green-100';
      case 'pending': case 'under_review': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': case 'rejected': return 'text-red-600 bg-red-100';
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
            Welcome back, {studentInfo?.personalInfo?.firstName || 'Student'}!
          </h1>
          <p className="text-gray-600">
            Track your job applications, manage interviews, and build your career.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: ChartIcon },
              { id: 'interviews', label: 'Interviews', icon: CalendarIcon },
              { id: 'applications', label: 'Applications', icon: BriefcaseIcon },
              { id: 'profile', label: 'Profile', icon: UserGroupIcon }
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
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
                  </div>
                  <BriefcaseIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Interviews Scheduled</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.interviewsScheduled}</p>
                  </div>
                  <CalendarIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Interviews</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.upcomingInterviews}</p>
                  </div>
                  <CalendarIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Profile Complete</p>
                    <p className="text-3xl font-bold text-green-600">{stats.profileCompleteness}%</p>
                  </div>
                  <UserGroupIcon />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/jobs" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <BriefcaseIcon />
                  <span className="font-medium">Browse Jobs</span>
                </Link>
                
                <Link href="/dashboard/interviews" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <CalendarIcon />
                  <span className="font-medium">My Interviews</span>
                </Link>
                
                <Link href="/ai-resume-builder" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <DocumentIcon />
                  <span className="font-medium">Build Resume</span>
                </Link>
                
                <Link href="/profile/edit" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <UserGroupIcon />
                  <span className="font-medium">Edit Profile</span>
                </Link>
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Interviews</h2>
                <Link href="/dashboard/interviews" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              {upcomingInterviews.length > 0 ? (
                <div className="space-y-4">
                  {upcomingInterviews.map((interview) => (
                    <div key={interview._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{interview.jobTitle}</h3>
                        <p className="text-sm text-gray-600">{interview.companyName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(interview.interviewDate).toLocaleDateString()} at {interview.interviewTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                          {interview.status.replace('_', ' ')}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{interview.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon />
                  <p className="mt-2">No upcoming interviews</p>
                  <Link href="/jobs" className="text-blue-600 hover:text-blue-800 text-sm">
                    Apply for jobs to get interviews
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Applications */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
                <Link href="/applications" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              {recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplications.map((application) => (
                    <div key={application._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{application.jobTitle}</h3>
                        <p className="text-sm text-gray-600">{application.companyName}</p>
                        <p className="text-sm text-gray-500">
                          Applied on {new Date(application.appliedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BriefcaseIcon />
                  <p className="mt-2">No applications yet</p>
                  <Link href="/jobs" className="text-blue-600 hover:text-blue-800 text-sm">
                    Start applying for jobs
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Interview Management</h2>
              <Link href="/dashboard/interviews" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Go to Interview Dashboard
              </Link>
            </div>
            <p className="text-gray-600 mb-4">
              Manage all your scheduled interviews, confirm attendance, and join interview sessions.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm">
                🎯 <strong>Tip:</strong> Check your interview dashboard regularly for updates and reminders.
              </p>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
              <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Browse Jobs
              </Link>
            </div>
            <p className="text-gray-600 mb-4">
              Track your job applications and their status.
            </p>
            
            {recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{application.jobTitle}</h3>
                      <p className="text-sm text-gray-600">{application.companyName}</p>
                      <p className="text-sm text-gray-500">
                        Applied on {new Date(application.appliedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BriefcaseIcon />
                <p className="mt-2">No applications yet</p>
                <Link href="/jobs" className="text-blue-600 hover:text-blue-800 text-sm">
                  Start applying for jobs
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Management</h2>
              <Link href="/profile/edit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Edit Profile
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Profile Completeness</h3>
                <div className="bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats.profileCompleteness}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{stats.profileCompleteness}% Complete</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/ai-resume-builder" className="block text-blue-600 hover:text-blue-800 text-sm">
                    → Build AI-Powered Resume
                  </Link>
                  <Link href="/profile/edit" className="block text-blue-600 hover:text-blue-800 text-sm">
                    → Update Personal Information
                  </Link>
                  <Link href="/profile/edit" className="block text-blue-600 hover:text-blue-800 text-sm">
                    → Add Skills & Experience
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
