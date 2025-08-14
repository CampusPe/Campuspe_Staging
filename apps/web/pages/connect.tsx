import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../components/Navbar';

interface Company {
  _id: string;
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
  };
  email: string;
  isVerified: boolean;
  createdAt: string;
}

interface College {
  _id: string;
  name: string;
  email: string;
  address: {
    city: string;
    state: string;
    country: string;
  };
  website?: string;
  placementContact: {
    name: string;
    email: string;
    phone: string;
  };
  establishedYear?: number;
  type: string;
  affiliation?: string;
  description?: string;
  logo?: string;
  isVerified: boolean;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const ConnectPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'companies' | 'colleges'>('companies');

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      setUserRole(payload.role);
      
      // Set default tab based on user role
      if (payload.role === 'recruiter') {
        setActiveTab('colleges');
      } else if (payload.role === 'college') {
        setActiveTab('companies');
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch both companies and colleges
      const [companiesResponse, collegesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/recruiters/public`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/colleges/public`, { headers }).catch(() => ({ data: [] }))
      ]);

      setCompanies(Array.isArray(companiesResponse.data) ? companiesResponse.data : []);
      setColleges(Array.isArray(collegesResponse.data) ? collegesResponse.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetId: string, targetType: 'company' | 'college') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Sending connection request:', { targetId, targetType });
      
      // Create a connection request
      const response = await axios.post(`${API_BASE_URL}/api/connections/request`, {
        targetId,
        targetType,
        message: `Hello! I would like to connect with your ${targetType}.`
      }, { headers });

      console.log('Connection response:', response.data);
      alert('Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;
        console.log('Connection error details:', error.response?.data);
        
        if (statusCode === 404) {
          alert('Connection feature is not yet implemented. Please contact the administrator.');
        } else {
          alert(`Failed to send connection request (${statusCode}): ${errorMessage}`);
        }
      } else {
        alert('Failed to send connection request. Please try again.');
      }
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.companyInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.companyInfo?.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${company.companyInfo?.headquarters?.city} ${company.companyInfo?.headquarters?.state}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredColleges = colleges.filter(college =>
    college.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${college.address?.city} ${college.address?.state}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64 pt-28">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect & Collaborate</h1>
          <p className="text-gray-600">
            {userRole === 'recruiter' 
              ? 'Find and connect with colleges for campus placements'
              : userRole === 'college'
              ? 'Connect with companies for student placements'
              : 'Discover companies and colleges in our network'
            }
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('companies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'companies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Companies ({companies.length})
            </button>
            <button
              onClick={() => setActiveTab('colleges')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'colleges'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Colleges ({colleges.length})
            </button>
          </nav>
        </div>

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <div key={company._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{company.companyInfo?.name || 'Company Name'}</h3>
                      <p className="text-sm text-blue-600 mb-2">{company.companyInfo?.industry || 'Industry'}</p>
                      <p className="text-sm text-gray-600 mb-2">📍 {company.companyInfo?.headquarters?.city}, {company.companyInfo?.headquarters?.state}</p>
                      {company.companyInfo?.foundedYear && (
                        <p className="text-sm text-gray-500 mb-2">Est. {company.companyInfo?.foundedYear}</p>
                      )}
                    </div>
                    {company.isVerified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  
                  {company.companyInfo?.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {company.companyInfo?.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Contact: {company.recruiterProfile?.firstName} {company.recruiterProfile?.lastName}
                    </div>
                    <button
                      onClick={() => handleConnect(company._id, 'company')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                  
                  {company.companyInfo?.website && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <a
                        href={company.companyInfo?.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No companies found matching your search.</p>
              </div>
            )}
          </div>
        )}

        {/* Colleges Tab */}
        {activeTab === 'colleges' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredColleges.length > 0 ? (
              filteredColleges.map((college) => (
                <div key={college._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{college.name || 'College Name'}</h3>
                      <p className="text-sm text-blue-600 mb-2">{college.type || 'College Type'}</p>
                      <p className="text-sm text-gray-600 mb-2">📍 {college.address?.city}, {college.address?.state}</p>
                      {college.affiliation && (
                        <p className="text-sm text-gray-500 mb-2">Affiliated to: {college.affiliation}</p>
                      )}
                      {college.establishedYear && (
                        <p className="text-sm text-gray-500 mb-2">Est. {college.establishedYear}</p>
                      )}
                    </div>
                    {college.isVerified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  
                  {college.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {college.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Contact: {college.placementContact?.name || 'Contact Person'}
                    </div>
                    <button
                      onClick={() => handleConnect(college._id, 'college')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                  
                  {college.website && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <a
                        href={college.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No colleges found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ConnectPage;
