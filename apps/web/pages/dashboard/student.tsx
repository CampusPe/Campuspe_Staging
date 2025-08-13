import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useResumeUpload } from '../../components/ResumeUpload';

// Icon Components
const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BriefcaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2" />
  </svg>
);

const UserGroupIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const DocumentIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const BellIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const TrendingUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Type Definitions
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
  jobId?: string;
  recruiterId?: string;
}

interface JobApplication {
  _id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  appliedDate: string;
  status: 'applied' | 'under_review' | 'interview_scheduled' | 'rejected' | 'selected';
  matchScore?: number;
  resumeAnalysis?: any;
  applicationNotes?: string;
}

interface StudentStats {
  totalApplications: number;
  interviewsScheduled: number;
  upcomingInterviews: number;
  profileCompleteness: number;
  averageMatchScore?: number;
  aiRecommendations?: number;
}

interface JobRecommendation {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  salary: string;
  matchScore: number;
  requiredSkills: string[];
  postedDate: string;
  deadline?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewAssignment[]>([]);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalApplications: 0,
    interviewsScheduled: 0,
    upcomingInterviews: 0,
    profileCompleteness: 0,
    averageMatchScore: 0,
    aiRecommendations: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<any>(null);

  // Resume upload hook
  const resumeUpload = useResumeUpload({
    onUploadSuccess: (analysis) => {
      console.log('Resume upload successful with analysis:', analysis);
      setResumeInfo(analysis);
      fetchStudentData(); // Refresh data after successful upload
    },
    onUploadError: (errorMessage) => {
      console.error('Resume upload error:', errorMessage);
    },
    isUploading: resumeUploading,
    setIsUploading: setResumeUploading
  });

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

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch student profile
      const profileResponse = await axios.get(`${API_BASE_URL}/api/students/profile`, { headers });
      const studentData = profileResponse.data.data || profileResponse.data;
      setStudentInfo(studentData);

      // Extract resume info if available
      if (studentData?.resumeAnalysis) {
        setResumeInfo(studentData.resumeAnalysis);
      }

      // Fetch upcoming interviews
      try {
        const interviewsResponse = await axios.get(`${API_BASE_URL}/api/interviews/student/assignments`, { headers });
        const interviews = interviewsResponse.data?.data || interviewsResponse.data || [];
        setUpcomingInterviews(interviews.slice(0, 5));
      } catch (error) {
        console.log('Interviews API call failed:', error);
        setUpcomingInterviews([]);
      }

      // Fetch recent applications
      try {
        const applicationsResponse = await axios.get(`${API_BASE_URL}/api/students/applications`, { headers });
        const applications = applicationsResponse.data?.data || applicationsResponse.data || [];
        setRecentApplications(applications.slice(0, 5));
      } catch (error) {
        console.log('Applications API call failed:', error);
        setRecentApplications([]);
      }

      // Fetch job recommendations based on profile
      try {
        const recommendationsResponse = await axios.get(`${API_BASE_URL}/api/students/${studentData._id}/job-matches`, { headers });
        const recommendations = recommendationsResponse.data?.data || recommendationsResponse.data || [];
        setJobRecommendations(recommendations.slice(0, 4));
      } catch (error) {
        console.log('Job recommendations API call failed:', error);
        setJobRecommendations([]);
      }

      // Fetch notifications
      try {
        const notificationsResponse = await axios.get(`${API_BASE_URL}/api/notifications`, { headers });
        const notifs = notificationsResponse.data?.data || notificationsResponse.data || [];
        setNotifications(notifs.slice(0, 5));
      } catch (error) {
        console.log('Notifications API call failed:', error);
        setNotifications([]);
      }

      // Calculate comprehensive stats
      const completeness = calculateProfileCompleteness(studentData);
      const avgMatch = applications.length > 0 
        ? applications.reduce((sum: number, app: any) => sum + (app.matchScore || 0), 0) / applications.length 
        : 0;

      setStats({
        totalApplications: applications.length || 0,
        interviewsScheduled: interviews.length || 0,
        upcomingInterviews: interviews.filter((i: any) => 
          new Date(i.interviewDate) > new Date() && i.status === 'confirmed'
        ).length || 0,
        profileCompleteness: completeness,
        averageMatchScore: Math.round(avgMatch),
        aiRecommendations: recommendations.length || 0
      });

    } catch (error) {
      console.error('Error fetching student data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompleteness = (profile: any) => {
    const fields = [
      profile?.phoneNumber,
      profile?.dateOfBirth,
      profile?.education?.length > 0,
      profile?.skills?.length > 0,
      profile?.resumeFile || resumeInfo,
      profile?.experience?.length > 0,
      profile?.linkedinUrl,
      profile?.portfolioUrl
    ];
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': case 'selected': return 'text-green-600 bg-green-100';
      case 'pending': case 'under_review': case 'applied': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': case 'rejected': return 'text-red-600 bg-red-100';
      case 'interview_scheduled': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleResumeButtonClick = () => {
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    fileInput?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resumeUpload.handleFileSelect(file);
    }
  };

  const handleApplyForJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/jobs/${jobId}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStudentData(); // Refresh data after application
    } catch (error) {
      console.error('Error applying for job:', error);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
            Welcome back, {studentInfo?.firstName || 'Student'}!
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
              { id: 'jobs', label: 'Job Matches', icon: BriefcaseIcon },
              { id: 'applications', label: 'Applications', icon: DocumentIcon },
              { id: 'interviews', label: 'Interviews', icon: CalendarIcon },
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
              <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
                  </div>
                  <BriefcaseIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Interviews</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.upcomingInterviews}</p>
                  </div>
                  <CalendarIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Profile Complete</p>
                    <p className="text-3xl font-bold text-green-600">{stats.profileCompleteness}%</p>
                  </div>
                  <UserGroupIcon />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI Match Score</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.averageMatchScore || 0}%</p>
                  </div>
                  <TrendingUpIcon />
                </div>
              </div>
            </div>

            {/* Resume Upload & AI Analysis */}
            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <span className="mr-2">🤖</span>
                AI-Powered Resume Analysis
              </h2>
              
              {resumeInfo ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm font-medium">✅ Resume analyzed successfully!</p>
                    <p className="text-green-600 text-xs mt-1">AI matching active for job recommendations</p>
                  </div>
                  
                  {resumeInfo.skills && resumeInfo.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">🎯 Detected Skills ({resumeInfo.skills.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {resumeInfo.skills.slice(0, 8).map((skill: string, idx: number) => (
                          <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                        {resumeInfo.skills.length > 8 && (
                          <span className="text-blue-600 text-xs bg-blue-50 px-3 py-1 rounded-full">
                            +{resumeInfo.skills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleResumeButtonClick}
                      disabled={resumeUploading}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {resumeUploading ? 'Updating...' : 'Update Resume'}
                    </button>
                    <Link href="/ai-resume-builder" className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                      Build AI Resume
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Upload your resume for AI-powered job matching and personalized recommendations</p>
                  
                  {resumeUploading ? (
                    <div className="border-2 border-blue-300 border-dashed rounded-lg p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-blue-600 text-sm">Analyzing resume with AI...</p>
                    </div>
                  ) : (
                    <div 
                      onClick={handleResumeButtonClick}
                      className="border-2 border-gray-300 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    >
                      <div className="text-gray-400 text-3xl mb-3">�</div>
                      <p className="text-gray-600 text-sm mb-2">Click to upload PDF resume</p>
                      <p className="text-gray-400 text-xs">AI will analyze & extract skills for job matching</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/jobs" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <BriefcaseIcon />
                  <span className="font-medium">Browse Jobs</span>
                </Link>
                
                <Link href="/profile/edit" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <UserGroupIcon />
                  <span className="font-medium">Edit Profile</span>
                </Link>
                
                <Link href="/ai-resume-builder" className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
                  <DocumentIcon />
                  <span className="font-medium">AI Resume Builder</span>
                </Link>
                
                <button onClick={() => setActiveTab('interviews')} className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                  <CalendarIcon />
                  <span className="font-medium">My Interviews</span>
                </button>
              </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <BellIcon />
                    <span className="ml-2">Recent Notifications</span>
                  </h2>
                </div>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification._id} 
                      className={`p-3 rounded-lg border ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                      onClick={() => !notification.read && markNotificationRead(notification._id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Job Matches Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">AI-Powered Job Recommendations</h2>
                <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Browse All Jobs
                </Link>
              </div>
              
              {jobRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobRecommendations.map((job) => (
                    <div key={job._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                          <p className="text-gray-600">{job.companyName}</p>
                          <p className="text-sm text-gray-500">{job.location} • {job.salary}</p>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {job.matchScore}% Match
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.requiredSkills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {job.requiredSkills.length > 4 && (
                            <span className="text-gray-500 text-xs">+{job.requiredSkills.length - 4} more</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Posted {new Date(job.postedDate).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleApplyForJob(job._id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BriefcaseIcon />
                  <p className="mt-4 text-gray-500">No job recommendations yet</p>
                  <p className="text-sm text-gray-400 mb-4">Upload your resume to get AI-powered job matches</p>
                  <button
                    onClick={handleResumeButtonClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  >
                    Upload Resume
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Job Applications</h2>
              <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Apply for Jobs
              </Link>
            </div>
            
            {recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{application.jobTitle}</h3>
                      <p className="text-sm text-gray-600">{application.companyName}</p>
                      <p className="text-sm text-gray-500">
                        Applied on {new Date(application.appliedDate).toLocaleDateString()}
                      </p>
                      {application.matchScore && (
                        <p className="text-xs text-green-600 mt-1">
                          Match Score: {application.matchScore}%
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        ID: {application._id.slice(-6)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentIcon />
                <p className="mt-4 text-gray-500">No applications yet</p>
                <p className="text-sm text-gray-400 mb-4">Start applying for jobs to track your progress</p>
                <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Interview Schedule</h2>
              <Link href="/dashboard/interviews" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Detailed View
              </Link>
            </div>
            
            {upcomingInterviews.length > 0 ? (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{interview.jobTitle}</h3>
                        <p className="text-sm text-gray-600">{interview.companyName}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>📅 {new Date(interview.interviewDate).toLocaleDateString()}</span>
                          <span>🕒 {interview.interviewTime}</span>
                          <span className={interview.type === 'online' ? '💻' : '🏢'}>{interview.type}</span>
                        </div>
                        {interview.type === 'online' && interview.meetingLink && (
                          <a 
                            href={interview.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                          >
                            🔗 Join Meeting
                          </a>
                        )}
                        {interview.location && interview.type === 'offline' && (
                          <p className="text-sm text-gray-500 mt-1">📍 {interview.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                          {interview.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon />
                <p className="mt-4 text-gray-500">No interviews scheduled</p>
                <p className="text-sm text-gray-400 mb-4">Apply for jobs to get interview invitations</p>
                <Link href="/jobs" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile Management</h2>
                <Link href="/profile/edit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Edit Profile
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Name:</span>
                      <span>{studentInfo?.firstName} {studentInfo?.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span>{studentInfo?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span>{studentInfo?.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">LinkedIn:</span>
                      <span>{studentInfo?.linkedinUrl ? '✅ Connected' : '❌ Not connected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Portfolio:</span>
                      <span>{studentInfo?.portfolioUrl ? '✅ Added' : '❌ Not added'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Academic & Professional</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Skills:</span>
                      <span>{studentInfo?.skills?.length || 0} skills added</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Education:</span>
                      <span>{studentInfo?.education?.length || 0} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Experience:</span>
                      <span>{studentInfo?.experience?.length || 0} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Resume:</span>
                      <span>{resumeInfo ? '✅ Uploaded & Analyzed' : '❌ Not uploaded'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-4">Profile Completeness</h3>
                <div className="bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.profileCompleteness}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{stats.profileCompleteness}% Complete</span>
                  <span className="text-green-600 font-medium">
                    {stats.profileCompleteness === 100 ? '🎉 Profile Complete!' : `${100 - stats.profileCompleteness}% remaining`}
                  </span>
                </div>
              </div>
            </div>

            {/* Resume Section */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-medium text-gray-900 mb-4">Resume & AI Analysis</h3>
              {resumeInfo ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm font-medium">✅ Resume uploaded and analyzed</p>
                    <p className="text-green-600 text-xs mt-1">Last updated: {new Date(resumeInfo.uploadDate).toLocaleDateString()}</p>
                  </div>
                  
                  {resumeInfo.extractedDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Extracted Information</h4>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Skills: {resumeInfo.skills?.length || 0} detected</li>
                          <li>• Experience: {resumeInfo.extractedDetails.experience?.length || 0} entries</li>
                          <li>• Education: {resumeInfo.extractedDetails.education?.length || 0} entries</li>
                          <li>• Projects: {resumeInfo.extractedDetails.projects?.length || 0} entries</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Analysis Quality</h4>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Confidence: {resumeInfo.confidence || 0}%</li>
                          <li>• Category: {resumeInfo.category || 'General'}</li>
                          <li>• Level: {resumeInfo.experienceLevel || 'Entry'}</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleResumeButtonClick}
                    disabled={resumeUploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {resumeUploading ? 'Updating...' : 'Update Resume'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">Upload your resume to enable AI-powered job matching and get personalized recommendations</p>
                  <button
                    onClick={handleResumeButtonClick}
                    disabled={resumeUploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {resumeUploading ? 'Uploading...' : 'Upload Resume'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-medium text-gray-900 mb-4">Quick Profile Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/ai-resume-builder" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
                  <DocumentIcon />
                  <div>
                    <p className="font-medium">AI Resume Builder</p>
                    <p className="text-xs text-gray-500">Create tailored resumes</p>
                  </div>
                </Link>
                
                <Link href="/profile/edit" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <UserGroupIcon />
                  <div>
                    <p className="font-medium">Edit Information</p>
                    <p className="text-xs text-gray-500">Update personal details</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
                  </div>
                        </div>

      {/* Upload Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default StudentDashboard;
                </div>
              </div>
            </div>

            {/* Resume Section in Profile Tab */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-medium text-gray-900 mb-4">Resume & AI Analysis</h3>
              {resumeInfo ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm font-medium">✅ Resume uploaded and analyzed</p>
                  </div>
                  <button
                    onClick={handleResumeButtonClick}
                    disabled={resumeUploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {resumeUploading ? 'Updating...' : 'Update Resume'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">Upload your resume to enable AI-powered job matching</p>
                  <button
                    onClick={handleResumeButtonClick}
                    disabled={resumeUploading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {resumeUploading ? 'Uploading...' : 'Upload Resume'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
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
        )}

        {/* Hidden file input for resume upload */}
        <input
          id="resume-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          style={{ display: 'none' }}
        />
      </main>
    </>
  );
}
