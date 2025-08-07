'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';

import { useRouter } from 'next/router';

export default function ForgotPassword() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [otpRequestCount, setOtpRequestCount] = useState(0);
  const [otpMethod, setOtpMethod] = useState('whatsapp'); // default method
  const [resendTimer, setResendTimer] = useState(0);
  const [userType, setUserType] = useState<'student' | 'college' | 'recruiter'>('student');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Update otpMethod based on userType
  useEffect(() => {
    if (userType === 'student') {
      setOtpMethod('whatsapp');
    } else {
      setOtpMethod('email');
    }
  }, [userType]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (otpRequestCount >= 3) {
      setError('Maximum OTP requests reached. Please try again later.');
      return;
    }

    // Validate input based on userType
    if (userType === 'student' && !phone) {
      setError('Please enter your phone number.');
      return;
    }
    if ((userType === 'college' || userType === 'recruiter') && !email) {
      setError('Please enter your email.');
      return;
    }

    try {
      const payload = userType === 'student' ? { phone } : { email };
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.FORGOT_PASSWORD}`, { ...payload, preferredMethod: otpMethod });
      if (response.data && response.data.otpId) {
        setOtpSent(true);
        setOtpId(response.data.otpId);
        setMessage(`OTP has been sent to your ${otpMethod === 'whatsapp' ? 'WhatsApp' : 'email'}.`);
        setOtpRequestCount(otpRequestCount + 1);
        setResendTimer(60); // 60 seconds timer for resend
      } else {
        setError('Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`, {
        otpId,
        otp,
        userType,
        method: otpMethod,
        autoLogin: true,
        phone: userType === 'student' ? phone : undefined,
        email: userType !== 'student' ? email : undefined
      });

      if (response.data && response.data.token) {
        // Set profileData in localStorage for student after OTP login
        if (response.data.user && response.data.user.role === 'student') {
          // Fetch full student profile data from backend
          try {
            const studentResponse = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_BY_USER_ID(response.data.user.id)}`);
            if (studentResponse.data) {
              localStorage.setItem('profileData', JSON.stringify(studentResponse.data));
            } else {
              // fallback to minimal profile
              const studentProfile = {
                id: response.data.user.id,
                email: response.data.user.email,
                role: response.data.user.role,
                isVerified: response.data.user.isVerified,
                studentId: response.data.user.studentId
              };
              localStorage.setItem('profileData', JSON.stringify(studentProfile));
            }
          } catch (error) {
            console.error('Error fetching full student profile:', error);
            // fallback to minimal profile
            const studentProfile = {
              id: response.data.user.id,
              email: response.data.user.email,
              role: response.data.user.role,
              isVerified: response.data.user.isVerified,
              studentId: response.data.user.studentId
            };
            localStorage.setItem('profileData', JSON.stringify(studentProfile));
          }
        }

        import('../utils/auth').then(({ handleLoginSuccess }) => {
          handleLoginSuccess(response.data, router).then(() => {
            // Redirect to dashboard based on role after successful login
            if (response.data.user.role === 'student') {
              router.push('/dashboard/student');
            } else if (response.data.user.role === 'college') {
              router.push('/dashboard/college');
            } else if (response.data.user.role === 'recruiter') {
              router.push('/dashboard/recruiter');
            }
          }).catch((err) => {
            setError('Login failed: ' + err.message);
          });
        });
        setMessage('OTP verified. Logging you in...');
      } else {
        setError('OTP verification failed.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'OTP verification failed.');
    }
  };

  const handleResendOtp = () => {
    if (resendTimer === 0) {
      setOtpSent(false);
      setOtp('');
      setOtpId('');
      setMessage('');
      setError('');
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Forgot Password</h2>

          {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}
          {message && <p className="text-green-600 text-center text-sm mb-4">{message}</p>}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User Type</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as 'student' | 'college' | 'recruiter')}
              className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="student">Student</option>
              <option value="college">College</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {userType === 'student' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="e.g. 9876543210"
                    className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. example@example.com"
                    className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP Delivery Method</label>
                <div className="flex space-x-4">
                  {userType === 'student' ? (
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="otpMethod"
                        value="whatsapp"
                        checked={otpMethod === 'whatsapp'}
                        onChange={() => setOtpMethod('whatsapp')}
                        className="form-radio"
                      />
                      <span className="ml-2">WhatsApp</span>
                    </label>
                  ) : (
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="otpMethod"
                        value="email"
                        checked={otpMethod === 'email'}
                        onChange={() => setOtpMethod('email')}
                        className="form-radio"
                      />
                      <span className="ml-2">Email</span>
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={otpRequestCount >= 3}
                className={`w-full py-2 rounded-xl text-white transition ${
                  otpRequestCount >= 3 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="Enter the OTP"
                  className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition"
              >
                Verify OTP & Login
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0}
                className={`w-full mt-2 py-2 rounded-xl text-white transition ${
                  resendTimer > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
