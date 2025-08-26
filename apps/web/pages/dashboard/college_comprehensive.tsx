import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

// Types
interface CollegeInfo {
  _id: string;
  collegeName: string;
  email: string;
  location: string;
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
  companyName: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  jobType: string;
  workMode: string;
  location: string;
  salary: string;
  applicationDeadline: string;
  status: 'active' | 'inactive' | 'closed';
  createdAt: string;
  applicantsCount?: number;
}

interface PlacementData {
  _id: string;
  studentId: string;
  studentName: string;
  companyName: string;
  jobTitle: string;
  packageOffered: string;
  placementDate: string;
  status: 'placed' | 'offer_received' | 'in_process';
  department?: string;
  year?: string;
}

interface CampusEvent {
  _id: string;
  title: string;
  description: string;
  eventType: 'placement_drive' | 'career_fair' | 'seminar' | 'workshop';
  organizer: string;
  eventDate: string;
  location: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  participantsCount?: number;
  maxParticipants?: number;
}

interface Stats {
  totalStudents: number;
  activeStudents: number;
  placedStudents: number;
  avgPackage: number;
  highestPackage: number;
  totalPlacements: number;
  upcomingEvents: number;
  collegeProfileCompleteness: number;
}

// Icons
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

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AcademicCapIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422A12.083 12.083 0 0121 14.85V19a2 2 0 01-2 2H5a2 2 0 01-2-2v-4.15a12.083 12.083 0 012.84-3.272L12 14z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    placedStudents: 0,
    avgPackage: 0,
    highestPackage: 0,
    totalPlacements: 0,
    upcomingEvents: 0,
    collegeProfileCompleteness: 0
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [placementData, setPlacementData] = useState<PlacementData[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CampusEvent[]>([]);

  // Utility functions
  const getStatusColor = (status: string) => {
    const statusColors = {
      placed: 'bg-green-100 text-green-800',
      offer_received: 'bg-blue-100 text-blue-800',
      in_process: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  // API calls
  const fetchCollegeData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch college info
      const collegeResponse = await axios.get(`${API_BASE_URL}/api/colleges/profile`, { headers });
      setCollegeInfo(collegeResponse.data);

      // Fetch stats
      const statsResponse = await axios.get(`${API_BASE_URL}/api/colleges/stats`, { headers });
      setStats(statsResponse.data);

      // Fetch students
      const studentsResponse = await axios.get(`${API_BASE_URL}/api/colleges/students`, { headers });
      setStudents(studentsResponse.data.slice(0, 10));

      // Fetch available jobs
      const jobsResponse = await axios.get(`${API_BASE_URL}/api/jobs/available`, { headers });
      setAvailableJobs(jobsResponse.data.slice(0, 10));

      // Fetch placement data
      const placementResponse = await axios.get(`${API_BASE_URL}/api/colleges/placements`, { headers });
      setPlacementData(placementResponse.data.slice(0, 10));

      // Fetch upcoming events
      const eventsResponse = await axios.get(`${API_BASE_URL}/api/colleges/events`, { headers });
      const upcoming = eventsResponse.data.filter((event: CampusEvent) => 
        new Date(event.eventDate) >= new Date() && event.status !== 'cancelled'
      );
      setUpcomingEvents(upcoming.slice(0, 5));

    } catch (error) {
      console.error('Error fetching college data:', error);
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
  const handleCreateEvent = () => {
    router.push('/events/create');
  };

  const handleManageStudent = (studentId: string) => {
    router.push(`/students/manage/${studentId}`);
  };

  const handleViewPlacementDetails = (placementId: string) => {
    router.push(`/placements/view/${placementId}`);
  };

  useEffect(() => {
    fetchCollegeData();
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
            College Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {collegeInfo?.collegeName || 'College Admin'}! Manage your placement activities and student records.
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
              { id: 'students', label: 'Student Management', icon: UserGroupIcon },
              { id: 'placements', label: 'Placement Records', icon: BriefcaseIcon },
              { id: 'events', label: 'Campus Events', icon: CalendarIcon },
              { id: 'profile', label: 'College Profile', icon: BuildingIcon }
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
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <UserGroupIcon />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {stats.activeStudents} active students
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Placements</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPlacements}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <BriefcaseIcon />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {stats.placedStudents} students placed
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Package</p>
                    <p className="text-3xl font-bold text-gray-900">₹{stats.avgPackage}L</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <ChartIcon />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Highest: ₹{stats.highestPackage}L
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Events</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <CalendarIcon />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Upcoming events
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/students/add" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <PlusIcon />
                  <div>
                    <p className="font-medium">Add Student</p>
                    <p className="text-xs text-gray-500">Register new student</p>
                  </div>
                </Link>
                
                <button onClick={handleCreateEvent} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                  <CalendarIcon />
                  <div>
                    <p className="font-medium">Create Event</p>
                    <p className="text-xs text-gray-500">Schedule campus event</p>
                  </div>
                </button>
                
                <Link href="/placements/add" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
                  <BriefcaseIcon />
                  <div>
                    <p className="font-medium">Add Placement</p>
                    <p className="text-xs text-gray-500">Record placement data</p>
                  </div>
                </Link>
                
                <Link href="/analytics/college" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition">
                  <ChartIcon />
                  <div>
                    <p className="font-medium">View Analytics</p>
                    <p className="text-xs text-gray-500">Placement insights</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Placements */}
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Placements</h3>
                  <Link href="/dashboard/college?tab=placements" className="text-blue-600 hover:text-blue-800 text-sm">
                    View All →
                  </Link>
                </div>
                
                {placementData.length > 0 ? (
                  <div className="space-y-3">
                    {placementData.slice(0, 4).map((placement) => (
                      <div key={placement._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{placement.studentName}</p>
                          <p className="text-xs text-gray-600">{placement.companyName} • {placement.jobTitle}</p>
                          <p className="text-xs text-gray-400">
                            ₹{placement.packageOffered} • {new Date(placement.placementDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(placement.status)}`}>
                          {placement.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No recent placements</p>
                )}
              </div>

              {/* Upcoming Events */}
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
                  <Link href="/dashboard/college?tab=events" className="text-blue-600 hover:text-blue-800 text-sm">
                    View All →
                  </Link>
                </div>
                
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.slice(0, 4).map((event) => (
                      <div key={event._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-gray-600">{event.organizer}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(event.eventDate).toLocaleDateString()} • {event.location}
                          </p>
                        </div>
                        <span className="text-xs text-blue-600">
                          {event.eventType.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No upcoming events</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Student Management Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
                <div className="flex space-x-2">
                  <Link href="/students/add" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    Add Student
                  </Link>
                  <Link href="/students/bulk-import" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                    Bulk Import
                  </Link>
                </div>
              </div>
              
              {students.length > 0 ? (
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{student.firstName} {student.lastName}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              student.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {student.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                            <p>📧 {student.email}</p>
                            <p>🎓 {student.department || 'Not specified'}</p>
                            <p>📅 Year: {student.year || 'Not specified'}</p>
                            <p>📊 CGPA: {student.cgpa || 'Not provided'}</p>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span>🛠️ Skills: {student.skills.length} skills</span>
                            <span>📄 Resume: {student.resumeUrl ? 'Uploaded' : 'Not uploaded'}</span>
                            <span>📍 Enrollment: {student.enrollmentNumber || 'Not provided'}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleManageStudent(student._id)}
                            className="text-blue-600 hover:text-blue-800 p-2"
                          >
                            Manage
                          </button>
                          <a 
                            href={`mailto:${student.email}`}
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
                  <UserGroupIcon />
                  <p className="mt-4 text-gray-500">No students registered yet</p>
                  <Link href="/students/add" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                    Add First Student
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placement Records Tab */}
        {activeTab === 'placements' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Placement Records</h2>
                <div className="flex space-x-2">
                  <Link href="/placements/add" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    Add Placement
                  </Link>
                  <Link href="/placements/export" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                    Export Data
                  </Link>
                </div>
              </div>
              
              {placementData.length > 0 ? (
                <div className="space-y-4">
                  {placementData.map((placement) => (
                    <div key={placement._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{placement.studentName}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(placement.status)}`}>
                              {placement.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                            <p>🏢 {placement.companyName}</p>
                            <p>💼 {placement.jobTitle}</p>
                            <p>💰 ₹{placement.packageOffered}</p>
                            <p>📅 {new Date(placement.placementDate).toLocaleDateString()}</p>
                          </div>
                          {placement.department && placement.year && (
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>🎓 {placement.department}</span>
                              <span>📚 {placement.year}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewPlacementDetails(placement._id)}
                            className="text-blue-600 hover:text-blue-800 p-2"
                          >
                            View Details
                          </button>
                          <Link 
                            href={`/placements/edit/${placement._id}`}
                            className="text-blue-600 hover:text-blue-800 p-2"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BriefcaseIcon />
                  <p className="mt-4 text-gray-500">No placement records yet</p>
                  <Link href="/placements/add" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                    Add First Placement
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campus Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Campus Events</h2>
                <button
                  onClick={handleCreateEvent}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Create Event
                </button>
              </div>
              
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                              {event.status.toUpperCase()}
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {event.eventType.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500">
                            <p>👤 {event.organizer}</p>
                            <p>📅 {new Date(event.eventDate).toLocaleDateString()}</p>
                            <p>📍 {event.location}</p>
                            <p>👥 {event.participantsCount || 0}/{event.maxParticipants || '∞'} participants</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link 
                            href={`/events/edit/${event._id}`}
                            className="text-blue-600 hover:text-blue-800 p-2"
                          >
                            Edit
                          </Link>
                          <Link 
                            href={`/events/manage/${event._id}`}
                            className="text-blue-600 hover:text-blue-800 p-2"
                          >
                            Manage
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon />
                  <p className="mt-4 text-gray-500">No events scheduled</p>
                  <button
                    onClick={handleCreateEvent}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  >
                    Create First Event
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* College Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">College Profile</h2>
                <Link href="/profile/college/edit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Edit Profile
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">College Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">College Name:</span>
                      <span>{collegeInfo?.collegeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span>{collegeInfo?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Location:</span>
                      <span>{collegeInfo?.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">College Type:</span>
                      <span>{collegeInfo?.collegeType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Established:</span>
                      <span>{collegeInfo?.establishedYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Website:</span>
                      <span>{collegeInfo?.website || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Contact & Verification</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Contact Person:</span>
                      <span>{collegeInfo?.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Phone:</span>
                      <span>{collegeInfo?.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Affiliation:</span>
                      <span>{collegeInfo?.affiliation || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Verification:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        collegeInfo?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {collegeInfo?.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Status:</span>
                      <span>{collegeInfo?.verificationStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-4">Profile Completeness</h3>
                <div className="bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.collegeProfileCompleteness}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{stats.collegeProfileCompleteness}% Complete</span>
                  <span className="text-purple-600 font-medium">
                    {stats.collegeProfileCompleteness === 100 ? '🎉 Profile Complete!' : `${100 - stats.collegeProfileCompleteness}% remaining`}
                  </span>
                </div>
              </div>
            </div>

            {/* College Description */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-medium text-gray-900 mb-4">College Description</h3>
              {collegeInfo?.description ? (
                <p className="text-gray-600 leading-relaxed">{collegeInfo.description}</p>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No college description added yet</p>
                  <Link href="/profile/college/edit" className="text-blue-600 hover:text-blue-800 text-sm">
                    Add Description
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Profile Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-medium text-gray-900 mb-4">Quick Profile Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/profile/college/edit" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                  <BuildingIcon />
                  <div>
                    <p className="font-medium">Edit College Info</p>
                    <p className="text-xs text-gray-500">Update college details</p>
                  </div>
                </Link>
                
                <Link href="/verification/college" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                  <DocumentIcon />
                  <div>
                    <p className="font-medium">College Verification</p>
                    <p className="text-xs text-gray-500">Verify college credentials</p>
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

export default CollegeDashboard;
