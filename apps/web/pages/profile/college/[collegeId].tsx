import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';

interface CollegeProfile {
  _id: string;
  email: string;
  isVerified: boolean;
  role: string;
  collegeInfo: {
    name: string;
    type: string;
    establishment: string;
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
    };
    website?: string;
    logo?: string;
    description?: string;
    nirf_ranking?: number;
    accreditation?: string;
    affiliation?: string;
    courses?: string[];
    departments?: string[];
    facilities?: string[];
    student_strength?: number;
    faculty_strength?: number;
  };
  contactPerson: {
    name: string;
    designation: string;
    email: string;
    phone?: string;
  };
  verificationStatus: string;
  approvalStatus: string;
  createdAt: string;
  stats?: {
    totalStudents: number;
    placedStudents: number;
    recruitingCompanies: number;
    averagePackage: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const CollegeProfilePage = () => {
  const router = useRouter();
  const { collegeId } = router.query;
  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState<CollegeProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (collegeId) {
      fetchCollegeProfile();
    }
  }, [collegeId]);

  const fetchCollegeProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/colleges/${collegeId}/profile`, { headers });
      setCollege(response.data);
    } catch (error) {
      console.error('Error fetching college profile:', error);
      setError('Failed to load college profile');
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

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

  if (error || !college) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error || 'College profile not found'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {college.collegeInfo?.logo ? (
                <img 
                  src={college.collegeInfo.logo} 
                  alt={college.collegeInfo.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-3xl">
                    {college.collegeInfo?.name?.charAt(0) || college.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {college.collegeInfo?.name || 'College Name'}
                </h1>
                <p className="text-gray-600 text-lg">{college.collegeInfo?.type || 'Educational Institution'}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {college.isVerified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      ✓ Verified College
                    </span>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    college.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    college.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {college.approvalStatus === 'approved' ? '✅ Approved' :
                     college.approvalStatus === 'rejected' ? '❌ Rejected' :
                     '⏳ Pending Approval'}
                  </span>
                  {college.collegeInfo?.nirf_ranking && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      NIRF Rank: {college.collegeInfo.nirf_ranking}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <a
                href={`mailto:${college.email}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Contact College
              </a>
              {college.collegeInfo?.website && (
                <a
                  href={college.collegeInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* College Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About the College</h2>
              {college.collegeInfo?.description ? (
                <p className="text-gray-600 leading-relaxed">{college.collegeInfo.description}</p>
              ) : (
                <p className="text-gray-400 italic">No college description available</p>
              )}
            </div>

            {/* Academic Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Information</h2>
              
              {/* Courses */}
              {college.collegeInfo?.courses && college.collegeInfo.courses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Courses Offered</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {college.collegeInfo.courses.map((course, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Departments */}
              {college.collegeInfo?.departments && college.collegeInfo.departments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Departments</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {college.collegeInfo.departments.map((dept, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities */}
              {college.collegeInfo?.facilities && college.collegeInfo.facilities.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Facilities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {college.collegeInfo.facilities.map((facility, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Placement Statistics */}
            {college.stats && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Placement Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{college.stats.totalStudents}</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{college.stats.placedStudents}</div>
                    <div className="text-sm text-gray-600">Placed Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{college.stats.recruitingCompanies}</div>
                    <div className="text-sm text-gray-600">Recruiting Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">₹{college.stats.averagePackage}L</div>
                    <div className="text-sm text-gray-600">Average Package</div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Person */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Person</h2>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-bold">
                    {college.contactPerson?.name?.charAt(0) || college.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {college.contactPerson?.name || 'Contact Person'}
                  </h3>
                  <p className="text-gray-600">{college.contactPerson?.designation || 'College Representative'}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <a href={`mailto:${college.contactPerson?.email || college.email}`} className="text-blue-600 hover:text-blue-800 text-sm">
                      ✉️ {college.contactPerson?.email || college.email}
                    </a>
                    {college.contactPerson?.phone && (
                      <a href={`tel:${college.contactPerson.phone}`} className="text-blue-600 hover:text-blue-800 text-sm">
                        📞 {college.contactPerson.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* College Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">College Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Type:</span>
                  <p className="text-gray-900">{college.collegeInfo?.type || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Establishment:</span>
                  <p className="text-gray-900">{college.collegeInfo?.establishment || 'Not specified'}</p>
                </div>
                {college.collegeInfo?.accreditation && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Accreditation:</span>
                    <p className="text-gray-900">{college.collegeInfo.accreditation}</p>
                  </div>
                )}
                {college.collegeInfo?.affiliation && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Affiliation:</span>
                    <p className="text-gray-900">{college.collegeInfo.affiliation}</p>
                  </div>
                )}
                {college.collegeInfo?.student_strength && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Student Strength:</span>
                    <p className="text-gray-900">{college.collegeInfo.student_strength.toLocaleString()}</p>
                  </div>
                )}
                {college.collegeInfo?.faculty_strength && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Faculty Strength:</span>
                    <p className="text-gray-900">{college.collegeInfo.faculty_strength.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-600">Member Since:</span>
                  <p className="text-gray-900">
                    {new Date(college.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <div className="space-y-2">
                {college.collegeInfo?.location ? (
                  <>
                    <p className="text-gray-900">{college.collegeInfo.location.address}</p>
                    <p className="text-gray-900">
                      {college.collegeInfo.location.city}, {college.collegeInfo.location.state}
                    </p>
                    <p className="text-gray-900">
                      {college.collegeInfo.location.country} - {college.collegeInfo.location.pincode}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400 italic">Location not specified</p>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>
              <div className="space-y-2">
                {college.collegeInfo?.website && (
                  <a
                    href={college.collegeInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <span>🌐</span>
                    <span>College Website</span>
                  </a>
                )}
                <a
                  href={`mailto:${college.email}`}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <span>✉️</span>
                  <span>Email</span>
                </a>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">College Verified:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    college.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {college.isVerified ? '✅ Verified' : '⏳ Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Approval Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    college.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    college.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {college.approvalStatus === 'approved' ? '✅ Approved' :
                     college.approvalStatus === 'rejected' ? '❌ Rejected' :
                     '⏳ Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollegeProfilePage;
