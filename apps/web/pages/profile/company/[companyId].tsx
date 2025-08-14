import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';

interface CompanyProfile {
  _id: string;
  email: string;
  companyInfo: {
    name: string;
    industry: string;
    website?: string;
    logo?: string;
    description?: string;
    size: string;
    foundedYear?: number;
    headquarters: {
      city: string;
      state: string;
      country: string;
    };
  };
  recruiterProfile: {
    firstName: string;
    lastName: string;
    designation: string;
    phoneNumber?: string;
    linkedinUrl?: string;
  };
  isVerified: boolean;
  approvalStatus: string;
  verificationStatus: string;
  createdAt: string;
  stats?: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    hiredCandidates: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const CompanyProfilePage = () => {
  const router = useRouter();
  const { companyId } = router.query;
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchCompanyProfile();
    }
  }, [companyId]);

  const fetchCompanyProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/recruiters/${companyId}/profile`, { headers });
      setCompany(response.data);
    } catch (error) {
      console.error('Error fetching company profile:', error);
      setError('Failed to load company profile');
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

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error || 'Company profile not found'}</p>
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
              {company.companyInfo?.logo ? (
                <img 
                  src={company.companyInfo.logo} 
                  alt={company.companyInfo.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-3xl">
                    {company.companyInfo?.name?.charAt(0) || company.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {company.companyInfo?.name || 'Company Name'}
                </h1>
                <p className="text-gray-600 text-lg">{company.companyInfo?.industry || 'Industry'}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {company.isVerified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      ✓ Verified Company
                    </span>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    company.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    company.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {company.approvalStatus === 'approved' ? '✅ Approved' :
                     company.approvalStatus === 'rejected' ? '❌ Rejected' :
                     '⏳ Pending Approval'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <a
                href={`mailto:${company.email}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Contact Company
              </a>
              {company.companyInfo?.website && (
                <a
                  href={company.companyInfo.website}
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
            {/* Company Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Company</h2>
              {company.companyInfo?.description ? (
                <p className="text-gray-600 leading-relaxed">{company.companyInfo.description}</p>
              ) : (
                <p className="text-gray-400 italic">No company description available</p>
              )}
            </div>

            {/* Company Stats */}
            {company.stats && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{company.stats.totalJobs}</div>
                    <div className="text-sm text-gray-600">Total Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{company.stats.activeJobs}</div>
                    <div className="text-sm text-gray-600">Active Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{company.stats.totalApplications}</div>
                    <div className="text-sm text-gray-600">Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{company.stats.hiredCandidates}</div>
                    <div className="text-sm text-gray-600">Hired</div>
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
                    {company.recruiterProfile?.firstName?.charAt(0)}{company.recruiterProfile?.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {company.recruiterProfile?.firstName} {company.recruiterProfile?.lastName}
                  </h3>
                  <p className="text-gray-600">{company.recruiterProfile?.designation || 'Recruiter'}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <a href={`mailto:${company.email}`} className="text-blue-600 hover:text-blue-800 text-sm">
                      ✉️ {company.email}
                    </a>
                    {company.recruiterProfile?.phoneNumber && (
                      <a href={`tel:${company.recruiterProfile.phoneNumber}`} className="text-blue-600 hover:text-blue-800 text-sm">
                        📞 {company.recruiterProfile.phoneNumber}
                      </a>
                    )}
                    {company.recruiterProfile?.linkedinUrl && (
                      <a href={company.recruiterProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                        🔗 LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Industry:</span>
                  <p className="text-gray-900">{company.companyInfo?.industry || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Company Size:</span>
                  <p className="text-gray-900">{company.companyInfo?.size || 'Not specified'}</p>
                </div>
                {company.companyInfo?.foundedYear && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Founded:</span>
                    <p className="text-gray-900">{company.companyInfo.foundedYear}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-600">Headquarters:</span>
                  <p className="text-gray-900">
                    {company.companyInfo?.headquarters ? 
                      `${company.companyInfo.headquarters.city}, ${company.companyInfo.headquarters.state}, ${company.companyInfo.headquarters.country}` :
                      'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Member Since:</span>
                  <p className="text-gray-900">
                    {new Date(company.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>
              <div className="space-y-2">
                {company.companyInfo?.website && (
                  <a
                    href={company.companyInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <span>🌐</span>
                    <span>Company Website</span>
                  </a>
                )}
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <span>✉️</span>
                  <span>Email</span>
                </a>
                {company.recruiterProfile?.linkedinUrl && (
                  <a
                    href={company.recruiterProfile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <span>🔗</span>
                    <span>LinkedIn</span>
                  </a>
                )}
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Company Verified:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    company.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {company.isVerified ? '✅ Verified' : '⏳ Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Approval Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    company.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    company.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {company.approvalStatus === 'approved' ? '✅ Approved' :
                     company.approvalStatus === 'rejected' ? '❌ Rejected' :
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

export default CompanyProfilePage;
