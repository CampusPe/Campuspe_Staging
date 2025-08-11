'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/api';

interface DashboardStats {
  totalColleges: number;
  totalRecruiters: number;
  pendingColleges: number;
  pendingRecruiters: number;
  approvedColleges: number;
  approvedRecruiters: number;
  rejectedColleges: number;
  rejectedRecruiters: number;
  totalPending: number;
}

interface PendingApproval {
  _id: string;
  name?: string;
  companyInfo?: {
    name: string;
  };
  approvalStatus: string;
  createdAt: string;
  userId: {
    email: string;
    phone?: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<{
    pendingColleges: PendingApproval[];
    pendingRecruiters: PendingApproval[];
  }>({ pendingColleges: [], pendingRecruiters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'colleges' | 'recruiters'>('overview');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Verify admin access
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'admin') {
        router.push('/login');
        return;
      }
    } catch (e) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [statsResponse, approvalsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/admin/pending-approvals`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsResponse.data);
      setPendingApprovals(approvalsResponse.data);
    } catch (err: any) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (type: 'college' | 'recruiter', id: string) => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token!.split('.')[1]));
      
      await axios.post(
        `${API_BASE_URL}/api/admin/${type === 'college' ? 'colleges' : 'recruiters'}/${id}/approve`,
        {}, // No need to send adminId, it's taken from authenticated user
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
      fetchDashboardData();
    } catch (err: any) {
      setError(`Failed to approve ${type}`);
      console.error(`Approve ${type} error:`, err);
    }
  };

  const handleReject = async (type: 'college' | 'recruiter', id: string, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token!.split('.')[1]));
      
      await axios.post(
        `${API_BASE_URL}/api/admin/${type === 'college' ? 'colleges' : 'recruiters'}/${id}/reject`,
        { rejectionReason: reason }, // Only send rejection reason, adminId comes from auth
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
      fetchDashboardData();
    } catch (err: any) {
      setError(`Failed to reject ${type}`);
      console.error(`Reject ${type} error:`, err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage college and recruiter approvals</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-medium">!</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalPending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">🏫</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Colleges</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalColleges}</p>
                  <p className="text-sm text-gray-500">
                    {stats.approvedColleges} approved, {stats.pendingColleges} pending
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-medium">💼</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Recruiters</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalRecruiters}</p>
                  <p className="text-sm text-gray-500">
                    {stats.approvedRecruiters} approved, {stats.pendingRecruiters} pending
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-medium">❌</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Rejected</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.rejectedColleges + stats.rejectedRecruiters}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stats.rejectedColleges} colleges, {stats.rejectedRecruiters} recruiters
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('colleges')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'colleges'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Colleges ({pendingApprovals.pendingColleges.length})
              </button>
              <button
                onClick={() => setSelectedTab('recruiters')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'recruiters'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Recruiters ({pendingApprovals.pendingRecruiters.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {selectedTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">System Status</p>
                    <p className="text-sm text-gray-600">All systems operational</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Pending Reviews</p>
                    <p className="text-sm text-gray-600">
                      {stats?.totalPending} applications awaiting approval
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Action Required
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'colleges' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Pending College Approvals</h2>
              {pendingApprovals.pendingColleges.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending college approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.pendingColleges.map((college) => (
                    <div key={college._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{college.name}</h3>
                          <p className="text-sm text-gray-600">
                            Email: {college.userId.email}
                          </p>
                          {college.userId.phone && (
                            <p className="text-sm text-gray-600">
                              Phone: {college.userId.phone}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            Applied: {new Date(college.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove('college', college._id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection:');
                              if (reason) handleReject('college', college._id, reason);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => router.push(`/admin/colleges/${college._id}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'recruiters' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Pending Recruiter Approvals</h2>
              {pendingApprovals.pendingRecruiters.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending recruiter approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.pendingRecruiters.map((recruiter) => (
                    <div key={recruiter._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{recruiter.companyInfo?.name}</h3>
                          <p className="text-sm text-gray-600">
                            Email: {recruiter.userId.email}
                          </p>
                          {recruiter.userId.phone && (
                            <p className="text-sm text-gray-600">
                              Phone: {recruiter.userId.phone}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            Applied: {new Date(recruiter.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove('recruiter', recruiter._id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection:');
                              if (reason) handleReject('recruiter', recruiter._id, reason);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => router.push(`/admin/recruiters/${recruiter._id}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            View Details
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
      </main>
      <Footer />
    </>
  );
}
