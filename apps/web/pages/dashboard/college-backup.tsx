'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import ApprovalStatus from '../../components/ApprovalStatus';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/api';

function CollegeDashboardContent() {
  const router = useRouter();
  const [collegeInfo, setCollegeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          router.push('/login');
          return;
        }

        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.COLLEGE_BY_USER_ID(userId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCollegeInfo(response.data);

        // If approved and active, fetch students
        if (response.data.approvalStatus === 'approved' && response.data.isActive) {
          try {
            const studentsRes = await axios.get(`${API_BASE_URL}/api/students`, {
              params: { collegeId: response.data._id },
              headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(studentsRes.data);
          } catch (err) {
            console.error('Error fetching students:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching college data:', error);
        setError('Failed to load college information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  // If not approved or not active, show approval status
  if (!collegeInfo || collegeInfo.approvalStatus !== 'approved' || !collegeInfo.isActive) {
    return (
      <>
        <Navbar />
        <ApprovalStatus userRole="college" />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-blue-700">
            Welcome, {collegeInfo.name} 👋
          </h1>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✅ Approved
            </span>
            {collegeInfo.isActive && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                🟢 Active
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* College Information Card */}
          <div className="lg:col-span-2">
            <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">College Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                  <p className="text-gray-900">{collegeInfo.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                  <p className="text-gray-900">{collegeInfo.shortName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain Code</label>
                  <p className="text-gray-900">{collegeInfo.domainCode || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <p className="text-gray-900">
                    {collegeInfo.website ? (
                      <a href={collegeInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {collegeInfo.website}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                  <p className="text-gray-900">{collegeInfo.establishedYear || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation</label>
                  <p className="text-gray-900">{collegeInfo.affiliation || 'N/A'}</p>
                </div>
              </div>

              {collegeInfo.address && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Address</h3>
                  <p className="text-gray-700">
                    {[
                      collegeInfo.address.street,
                      collegeInfo.address.city,
                      collegeInfo.address.state,
                      collegeInfo.address.zipCode,
                      collegeInfo.address.country
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {collegeInfo.primaryContact && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Primary Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-gray-900">{collegeInfo.primaryContact.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <p className="text-gray-900">{collegeInfo.primaryContact.designation}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{collegeInfo.primaryContact.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-gray-900">{collegeInfo.primaryContact.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Students Section */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Registered Students</h2>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {students.length} Students
                </span>
              </div>

              {students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Course</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.slice(0, 10).map((student, index) => (
                        <tr key={student._id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{student.firstName} {student.lastName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.course || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              student.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {student.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length > 10 && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">Showing first 10 students out of {students.length}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">📚</div>
                  <p className="text-gray-500">No students registered yet</p>
                  <p className="text-sm text-gray-400 mt-1">Students will appear here once they register with your college</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Students</span>
                  <span className="font-semibold text-blue-600">{students.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Students</span>
                  <span className="font-semibold text-green-600">
                    {students.filter(s => s.isActive).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Departments</span>
                  <span className="font-semibold text-purple-600">
                    {collegeInfo.departments?.length || 0}
                  </span>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  View All Students
                </button>
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Export Student List
                </button>
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                  Manage Recruiters
                </button>
                <a
                  href="/notifications"
                  className="block w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-center"
                >
                  View Notifications
                </a>
              </div>
            </section>

            {/* Account Status */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Account Approved</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Profile Complete</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Ready to Receive Job Posts</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function CollegeDashboard() {
  return (
    <ProtectedRoute allowedRoles={['college']}>
      <CollegeDashboardContent />
    </ProtectedRoute>
  );
}
