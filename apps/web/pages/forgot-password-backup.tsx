'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';

export default function ForgotPassword() {
  const router = useRouter();
  const { type } = router.query;

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array for 6 digit OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [otpRequestCount, setOtpRequestCount] = useState(0);
  const [otpMethod, setOtpMethod] = useState('whatsapp'); // default method
  const [resendTimer, setResendTimer] = useState(0);
  const [userType, setUserType] = useState<'student' | 'college' | 'recruiter'>('student');

  // Set user type based on URL parameter
  useEffect(() => {
    if (type && ['student', 'college', 'recruiter'].includes(type as string)) {
      setUserType(type as 'student' | 'college' | 'recruiter');
    }
  }, [type]);

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
      
      // Map frontend userType to backend expected values
      const backendUserType = userType === 'college' ? 'college_admin' : userType;
      
      console.log('Sending OTP request:', { ...payload, preferredMethod: otpMethod, userType: backendUserType });
      
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.FORGOT_PASSWORD}`, { 
        ...payload, 
        preferredMethod: otpMethod,
        userType: backendUserType // Use mapped user type
      });
      
      console.log('OTP Response:', response.data);
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

    const otpValue = otp.join(''); // Join array to create string
    if (otpValue.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      // Map frontend userType to backend expected values
      const backendUserType = userType === 'college' ? 'college_admin' : userType;
      
      console.log('Verifying OTP with:', { otpId, otp: otpValue, userType: backendUserType });
      
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`, {
        otpId,
        otp: otpValue,
        userType: backendUserType, // Use mapped user type
      });
      
      console.log('Verify OTP Response:', response.data);

      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('role', response.data.user.role);

        if (response.data.user.role === 'student') {
          try {
            const studentResponse = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.STUDENT_BY_USER_ID(response.data.user.id)}`);
            if (studentResponse.data) {
              localStorage.setItem('profileData', JSON.stringify(studentResponse.data));
            } else {
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
      setOtp(['', '', '', '', '', '']); // Reset to empty array for 6 digits
      setOtpId('');
      setMessage('');
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        {/* Illustration Container */}
        <div className="relative w-80 h-80 mx-auto mb-8 flex items-center justify-center bg-transparent">
          <div className="w-full h-full flex items-center justify-center">
            {/* Simplified illustration matching the 4th reference */}
            <div className="relative">
              <div className="w-48 h-48 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="text-6xl">👩‍💻</div>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                <div className="text-white text-2xl">⚛️</div>
              </div>
              <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <div className="text-lg">🏆</div>
              </div>
              <div className="absolute top-4 -left-8 w-16 h-16 bg-green-400 rounded-full flex items-center justify-center">
                <div className="text-white text-xl">🔑</div>
              </div>
              <div className="absolute bottom-8 -right-8 w-8 h-8 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Let's get started
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          Connect directly with recruiters open more opportunities for your students.
        </p>

        {error && <p className="text-red-500 text-center text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
        {message && <p className="text-green-600 text-center text-sm mb-4 bg-green-50 p-3 rounded-lg">{message}</p>}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            {/* User Type Selection - Hidden, managed by URL parameter */}
            <input type="hidden" value={userType} />

            {/* Email Input */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="abcduniversity123@gmail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Send OTP Button */}
            <button
              type="submit"
              disabled={otpRequestCount >= 3}
              className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                otpRequestCount >= 3 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {otpRequestCount >= 3 ? 'Max attempts reached' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Enter 6-digit OTP</h3>
            
            {/* 6-digit OTP Input */}
            <div className="flex justify-center space-x-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.match(/^[0-9]*$/)) {
                      const newOtp = [...otp];
                      newOtp[index] = value;
                      setOtp(newOtp);
                      
                      // Auto-focus next input
                      if (value && index < 5) {
                        const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                        if (nextInput) nextInput.focus();
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle backspace
                    if (e.key === 'Backspace' && !otp[index] && index > 0) {
                      const prevInput = e.target.parentElement?.children[index - 1] as HTMLInputElement;
                      if (prevInput) prevInput.focus();
                    }
                  }}
                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              ))}
            </div>

            {/* Verify OTP Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Verify OTP
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-gray-600 text-sm">
                  Resend OTP in {resendTimer} seconds
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (userType === 'college') {
                      router.push('/college-login');
                    } else if (userType === 'recruiter') {
                      router.push('/company-login');
                    } else {
                      router.push('/login');
                    }
                  }}
                  className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
        )}
      </div>
    </div>
  );
}
