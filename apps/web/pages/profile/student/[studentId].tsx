import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../../components/Navbar';

interface StudentProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  collegeId?: {
    _id: string;
    name: string;
    address: {
      city: string;
      state: string;
    };
  };
  profile?: {
    skills: string[];
    experience: string[];
    education: any[];
    projects: any[];
    achievements: string[];
    bio?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
  };
  resume?: {
    filename: string;
    uploadDate: string;
  };
  isVerified: boolean;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const StudentProfilePage = () => {
  const router = useRouter();
  const { studentId } = router.query;
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (studentId) {
      fetchStudentProfile();
    }
  }, [studentId]);

  const fetchStudentProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE_URL}/api/students/${studentId}/profile`, { headers });
      setStudent(response.data);
    } catch (error) {
      console.error('Error fetching student profile:', error);
      setError('Failed to load student profile');
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

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error || 'Student profile not found'}</p>
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-2xl">
                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {student.firstName} {student.lastName}
                </h1>
                <p className="text-gray-600">{student.email}</p>
                {student.phoneNumber && (
                  <p className="text-gray-600">{student.phoneNumber}</p>
                )}
                {student.isVerified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
                    ✓ Verified Student
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <a
                href={`mailto:${student.email}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Send Email
              </a>
              {student.phoneNumber && (
                <a
                  href={`tel:${student.phoneNumber}`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Call
                </a>
              )}
              {/* Check if current user is viewing their own profile */}
              {(() => {
                if (typeof window !== 'undefined') {
                  const userStr = localStorage.getItem('user');
                  const currentUser = userStr ? JSON.parse(userStr) : null;
                  const isOwnProfile = currentUser && currentUser._id === student._id;
                  
                  if (isOwnProfile) {
                    return (
                      <button
                        onClick={() => router.push('/profile/edit')}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                      >
                        Edit Profile
                      </button>
                    );
                  }
                }
                return null;
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {student.profile?.bio && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed">{student.profile.bio}</p>
              </div>
            )}

            {/* Education */}
            {student.profile?.education && student.profile.education.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>
                <div className="space-y-4">
                  {student.profile.education.map((edu: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-gray-900">{edu.degree || edu.course}</h3>
                      <p className="text-gray-600">{edu.institution || edu.college}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {edu.year && <span>{edu.year}</span>}
                        {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
                        {edu.percentage && <span>Percentage: {edu.percentage}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {student.profile?.experience && student.profile.experience.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Experience</h2>
                <div className="space-y-4">
                  {student.profile.experience.map((exp: any, index: number) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-semibold text-gray-900">{exp.position || exp.title}</h3>
                      <p className="text-gray-600">{exp.company}</p>
                      <p className="text-sm text-gray-500">{exp.duration || `${exp.startDate} - ${exp.endDate}`}</p>
                      {exp.description && (
                        <p className="text-gray-600 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {student.profile?.projects && student.profile.projects.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Projects</h2>
                <div className="space-y-4">
                  {student.profile.projects.map((project: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">{project.title || project.name}</h3>
                      {project.description && (
                        <p className="text-gray-600 mt-2">{project.description}</p>
                      )}
                      {project.technologies && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.technologies.map((tech: string, techIndex: number) => (
                            <span key={techIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                        >
                          View Project →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* College Information */}
            {student.collegeId && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">College</h3>
                <div>
                  <p className="font-medium text-gray-900">{student.collegeId.name}</p>
                  <p className="text-sm text-gray-600">
                    {student.collegeId.address.city}, {student.collegeId.address.state}
                  </p>
                </div>
              </div>
            )}

            {/* Skills */}
            {student.profile?.skills && student.profile.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {student.profile.skills.map((skill: string, index: number) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Links</h3>
              <div className="space-y-2">
                {student.profile?.linkedinUrl && (
                  <a
                    href={student.profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <span>🔗</span>
                    <span>LinkedIn</span>
                  </a>
                )}
                {student.profile?.githubUrl && (
                  <a
                    href={student.profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <span>💻</span>
                    <span>GitHub</span>
                  </a>
                )}
                {student.profile?.portfolioUrl && (
                  <a
                    href={student.profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <span>🌐</span>
                    <span>Portfolio</span>
                  </a>
                )}
                {student.resume && (
                  <a
                    href={`${API_BASE_URL}/uploads/resumes/${student.resume.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <span>📄</span>
                    <span>Resume</span>
                  </a>
                )}
              </div>
            </div>

            {/* Achievements */}
            {student.profile?.achievements && student.profile.achievements.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Achievements</h3>
                <ul className="space-y-2">
                  {student.profile.achievements.map((achievement: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-yellow-500 mt-1">🏆</span>
                      <span className="text-gray-600">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Member Since */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Member Since</h3>
              <p className="text-gray-600">
                {new Date(student.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
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

export default StudentProfilePage;
