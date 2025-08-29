'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';
import GoogleSignup from './GoogleSignup';
import ForgotPasswordModal from './ForgotPasswordModal';

type UserType = 'student' | 'college' | 'company';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserType?: UserType;
  onSwitchToRegister?: (userType: UserType) => void;
}

export default function LoginModal({ isOpen, onClose, initialUserType = 'student', onSwitchToRegister }: LoginModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserType>(initialUserType);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let endpoint = '';
      if (activeTab === 'student') {
        endpoint = '/api/auth/login';
      } else if (activeTab === 'college') {
        endpoint = '/api/auth/college-login';
      } else if (activeTab === 'company') {
        endpoint = '/api/auth/recruiter-login';
      }

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        email: formData.email,
        password: formData.password
      });

      const { token } = response.data;
      localStorage.setItem('token', token);

      // Decode token to get user info
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      const { userId, role } = payload;

      localStorage.setItem('userId', userId);
      localStorage.setItem('role', role);

      // Redirect based on role
      onClose();
      if (role === 'student') {
        router.push('/dashboard/student');
      } else if (['college', 'college_admin', 'placement_officer'].includes(role)) {
        router.push('/dashboard/college');
      } else if (role === 'recruiter') {
        router.push('/dashboard/recruiter');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignupSuccess = () => {
    onClose();
  };

  const handleGoogleSignupError = (error: string) => {
    setError(error);
  };

  const tabs = [
    { key: 'student' as UserType, label: 'Student' },
    { key: 'college' as UserType, label: 'College' },
    { key: 'company' as UserType, label: 'Company' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full min-h-[600px]">
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#edf9f8] to-[#edf9f8] items-center justify-center p-12">
              <div className="text-center max-w-md">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-80 h-80 mx-auto mb-8 flex items-center justify-center bg-transparent"
                >
                  {activeTab === 'student' && (
                    <img
                      src="/wykfrtuwbtfwby3wi6428v4ywjer.png"
                      alt="Student login illustration"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {activeTab === 'college' && (
                    <img
                      src="/jvduoqngoyaejdcnedqhhv3nrp7e.png"
                      alt="College login illustration"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {activeTab === 'company' && (
                    <img
                      src="/bwcykufbcucantu3fr3c462eyg.png"
                      alt="Company login illustration"
                      className="w-full h-full object-contain"
                    />
                  )}
                </motion.div>

                <motion.div
                  key={`${activeTab}-content`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {activeTab === 'student' && (
                    <>
                      <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Search hundreds of <span className="text-blue-600">colleges in one go</span>
                      </h1>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        <span className="text-blue-600">Programs, fees, placements</span> - sorted in one view.
                      </p>
                    </>
                  )}
                  {activeTab === 'college' && (
                    <>
                      <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Boost your <span className="text-blue-600">online presence</span>
                      </h1>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        Connect with thousands of students instantly and showcase your college programs online.
                      </p>
                    </>
                  )}
                  {activeTab === 'company' && (
                    <>
                      <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Hire interns & <span className="text-blue-600">fresh graduates</span>
                      </h1>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        Connect with job-ready students from verified colleges — faster, smarter.
                      </p>
                    </>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={20} />
              </button>

              {/* Form Card */}
              <div className="w-full max-w-md">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                  Welcome to your <span className="text-blue-600">Profile !!</span>
                </h2>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                  <div className="relative flex w-full max-w-sm justify-between">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === tab.key ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}

                    {/* Animated underline */}
                    <motion.div
                      className="absolute bottom-0 h-0.5 bg-blue-600"
                      initial={false}
                      animate={{
                        width: `${100 / tabs.length}%`,
                        x: `${tabs.findIndex(t => t.key === activeTab) * 100}%`,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6 mb-6">
                  <div>
                    <input
                      type={activeTab === 'student' ? 'tel' : 'email'}
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={
                        activeTab === 'student' 
                          ? "Phone Number" 
                          : activeTab === 'college' 
                            ? "College Email" 
                            : "Company Email"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                  {/* WhatsApp OTP for Students / Forgot Password for College/Company */}
                  {activeTab === 'student' ? (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
                      >
                        Send OTP on
                        <span className="flex items-center gap-1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"
                              fill="#25D366"
                            />
                          </svg>
                          WhatsApp
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing in...' : 'Login'}
                  </button>

                  <div className="text-center text-sm">
                    <span className="text-gray-600">I don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSwitchToRegister?.(activeTab);
                      }}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </div>
                </form>

                {/* Google Signup - Only for Students */}
                {activeTab === 'student' && (
                  <>
                    <div className="text-center mb-4">
                      <span className="text-gray-400 text-sm">OR</span>
                    </div>
                    <button
                      onClick={() => {
                        // Handle Google signup for students
                        console.log('Google signup for student');
                      }}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign up with google
                    </button>
                  </>
                )}

                {/* Google Signup Component (hidden for now) */}
                <div className="hidden">
                  <GoogleSignup 
                    userType={activeTab === 'company' ? 'recruiter' : activeTab} 
                    onSuccess={handleGoogleSignupSuccess}
                    onError={handleGoogleSignupError}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          userType={activeTab}
        />
      </motion.div>
    </AnimatePresence>
  );
}
