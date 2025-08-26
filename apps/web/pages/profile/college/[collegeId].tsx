import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import { CollegeProfile } from '../../../types/profiles';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const CollegeProfilePage = () => {
  const router = useRouter();
  const { collegeId } = router.query;
  const [loading, setLoading] = useState(true);
  const [college, setCollege] = useState<CollegeProfile | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

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
      const response = await axios.get(`${API_BASE_URL}/api/colleges/${collegeId}`, { headers });
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

  const StatCard = ({ emoji, label, value, trend, color = "blue" }: {
    emoji: string;
    label: string;
    value: string | number;
    trend?: string;
    color?: string;
  }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-2xl">{emoji}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <div className="text-right">
            <span className="text-sm text-green-600 font-medium">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );

  const TabButton = ({ id, label, isActive, onClick }: {
    id: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg scale-105'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading college profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.768 0L3.046 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'College profile could not be loaded'}</p>
              <button
                onClick={() => router.back()}
                className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-purple-900 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-blue-300/20 rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-300/20 rounded-full animate-pulse delay-700"></div>
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
            {/* College Logo and Basic Info */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl bg-white p-4 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                  {college.logo ? (
                    <img
                      src={college.logo}
                      alt={college.name}
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                      <span className="text-4xl font-bold text-blue-600">
                        {college.name?.charAt(0) || 'C'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Verification Badge */}
                {college.isVerified && (
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>
            </div>

            {/* College Information */}
            <div className="flex-1 text-center lg:text-left">
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                    {college.name}
                  </h1>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-4">
                    <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                      {college.collegeInfo?.type || 'College'}
                    </span>
                    <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                      Est. {college.establishedYear || 'N/A'}
                    </span>
                    {college.collegeInfo?.nirf_ranking && (
                      <span className="bg-yellow-500/20 backdrop-blur-sm text-yellow-100 px-3 py-1 rounded-full text-sm font-medium border border-yellow-400/30">
                        NIRF #{college.collegeInfo.nirf_ranking}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-white/90">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📍</span>
                    <span className="text-sm font-medium">
                      {college.address ? 
                        `${college.address.city || ''}, ${college.address.state || ''}`.trim() || 'Location not specified' :
                        'Location not specified'
                      }
                    </span>
                  </div>
                  {college.website && (
                    <a
                      href={college.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 hover:text-white transition-colors"
                    >
                      <span className="text-lg">🌐</span>
                      <span className="text-sm font-medium">Visit Website</span>
                    </a>
                  )}
                </div>

                {college.description && (
                  <p className="text-lg text-white/90 leading-relaxed max-w-2xl">
                    {college.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            emoji="👥"
            label="Total Students"
            value={college.stats?.totalStudents || "N/A"}
            trend="+12%"
            color="blue"
          />
          <StatCard
            emoji="🎓"
            label="Programs"
            value={college.stats?.totalPrograms || "N/A"}
            color="purple"
          />
          <StatCard
            emoji="🏆"
            label="Placement Rate"
            value={college.stats?.placementRate ? `${college.stats.placementRate}%` : "N/A"}
            trend="+5%"
            color="green"
          />
          <StatCard
            emoji="⭐"
            label="Rating"
            value={college.stats?.rating ? `${college.stats.rating}/5` : "N/A"}
            color="yellow"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            <TabButton
              id="overview"
              label="Overview"
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <TabButton
              id="academics"
              label="Academics"
              isActive={activeTab === 'academics'}
              onClick={() => setActiveTab('academics')}
            />
            <TabButton
              id="facilities"
              label="Facilities"
              isActive={activeTab === 'facilities'}
              onClick={() => setActiveTab('facilities')}
            />
            <TabButton
              id="placements"
              label="Placements"
              isActive={activeTab === 'placements'}
              onClick={() => setActiveTab('placements')}
            />
            <TabButton
              id="contact"
              label="Contact"
              isActive={activeTab === 'contact'}
              onClick={() => setActiveTab('contact')}
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 pb-12">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">ℹ️</span>
                About {college.name}
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {college.description || "Detailed description about the college will be available soon."}
                </p>
              </div>
            </div>

            {/* Key Highlights */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-2xl mr-3">✨</span>
                  Key Highlights
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">Established in {college.establishedYear || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">NAAC Accredited Institution</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">Industry-Academia Partnerships</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">Modern Infrastructure & Facilities</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  Quick Facts
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">College Type</span>
                    <span className="font-semibold text-gray-900">{college.collegeInfo?.type || 'College'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Affiliation</span>
                    <span className="font-semibold text-gray-900">{college.collegeInfo?.affiliation || college.affiliation || "Autonomous"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Campus Size</span>
                    <span className="font-semibold text-gray-900">50+ Acres</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Student Faculty Ratio</span>
                    <span className="font-semibold text-gray-900">15:1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academics' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🎓</span>
                Academic Programs
              </h2>
              
              {college.programs && college.programs.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {college.programs.map((program, index) => (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <span className="text-xl">📚</span>
                        </div>
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          {program.duration || "4 Years"}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{program.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{program.description || "Comprehensive program designed for industry readiness"}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Seats: {program.seats || "60"}</span>
                        <span className="text-sm font-semibold text-green-600">Available</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-6xl text-gray-300 block mb-4">🎓</span>
                  <p className="text-gray-600">Academic program details will be updated soon.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'facilities' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🏛️</span>
                Campus Facilities
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Modern Library", emoji: "📚", description: "Digital & Physical Resources" },
                  { name: "Research Labs", emoji: "🧪", description: "State-of-the-art Equipment" },
                  { name: "Computer Centers", emoji: "💻", description: "Latest Technology" },
                  { name: "Sports Complex", emoji: "🏆", description: "Indoor & Outdoor Facilities" },
                  { name: "Hostel Facilities", emoji: "🏠", description: "Comfortable Accommodation" },
                  { name: "Medical Center", emoji: "❤️", description: "24/7 Healthcare Services" },
                ].map((facility, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors w-fit mb-4">
                      <span className="text-xl">{facility.emoji}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{facility.name}</h3>
                    <p className="text-gray-600 text-sm">{facility.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'placements' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">💼</span>
                Placement Statistics
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {college.stats?.placementRate || "85"}%
                  </div>
                  <div className="text-sm text-gray-600">Placement Rate</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ₹{college.stats?.averagePackage || "6.5"}L
                  </div>
                  <div className="text-sm text-gray-600">Average Package</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    ₹{college.stats?.highestPackage || "45"}L
                  </div>
                  <div className="text-sm text-gray-600">Highest Package</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Recruiting Companies</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["TCS", "Infosys", "Wipro", "Accenture", "IBM", "Microsoft", "Amazon", "Google"].map((company, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm font-medium text-gray-900">{company}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">📞</span>
                Contact Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <span className="text-xl">📍</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                      <p className="text-gray-600">
                        {college.collegeInfo?.location?.address || college.collegeInfo?.name || college.name || 'Address not available'}<br />
                        {college.collegeInfo?.location?.city || 'City'}, {college.collegeInfo?.location?.state || 'State'}<br />
                        PIN: {college.collegeInfo?.location?.pincode || "000000"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <span className="text-xl">📞</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                      <p className="text-gray-600">{college.collegeInfo?.contact?.phone || "+91 (XXX) XXX-XXXX"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <span className="text-xl">✉️</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                      <p className="text-gray-600">{college.collegeInfo?.contact?.email || "info@college.edu"}</p>
                    </div>
                  </div>

                  {college.collegeInfo.website && (
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <span className="text-xl">🌐</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Website</h3>
                        <a 
                          href={college.collegeInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Visit Official Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Get In Touch</h3>
                  <p className="text-gray-600 mb-6">
                    Have questions about admissions or want to know more about our programs? 
                    Contact our admissions office for detailed information.
                  </p>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Schedule Campus Visit
                    </button>
                    <button className="w-full bg-white text-blue-600 border-2 border-blue-600 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                      Download Brochure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeProfilePage;