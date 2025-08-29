'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

type UserType = 'student' | 'college' | 'company';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: UserType;
}

export default function ForgotPasswordModal({ isOpen, onClose, userType }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpId, setOtpId] = useState('');
  const [otpMethod, setOtpMethod] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const sendOtp = async () => {
    setError('');
    setLoading(true);

    try {
      // Use the forgot-password endpoint for existing users
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: userType === 'student' ? undefined : formData.email,
        phone: userType === 'student' ? formData.email : undefined, // For students, email field contains phone
        preferredMethod: userType === 'student' ? 'phone' : 'email'
      });

      // Store OTP ID and method for verification
      if (response.data.otpId) {
        setOtpId(response.data.otpId);
        setOtpMethod(response.data.method || (userType === 'student' ? 'whatsapp' : 'email'));
      }

      setStep('otp');
      setResendTimer(30); // 30 seconds countdown
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    setLoading(true);

    try {
      const otpString = otp.join('');
      if (otpString.length !== 6) {
        setError('Please enter complete 6-digit OTP');
        setLoading(false);
        return;
      }

      await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        otpId: otpId,
        otp: otpString,
        userType: userType,
        method: otpMethod
      });

      setStep('newPassword');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email: formData.email,
        newPassword: formData.newPassword,
        userType
      });

      // Success - close modal
      onClose();
      // You might want to show a success toast here
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    await sendOtp();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            {step !== 'email' && (
              <button
                onClick={() => setStep(step === 'otp' ? 'email' : 'otp')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Email Step */}
          {step === 'email' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
              <p className="text-gray-600 mb-8">
                Enter your email address and we'll send you an OTP to reset your password.
              </p>

              <div className="space-y-6">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <button
                  onClick={sendOtp}
                  disabled={loading || !formData.email}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : `Send OTP via ${userType === 'student' ? 'WhatsApp' : 'Email'}`}
                </button>
              </div>
            </div>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your number</h2>
              <p className="text-gray-600 mb-8">
                Enter 6-digits code we sent to your {userType === 'student' ? 'mobile number' : 'email'}
              </p>

              <div className="flex justify-center gap-3 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    maxLength={1}
                  />
                ))}
              </div>

              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

              <button
                onClick={verifyOtp}
                disabled={loading || otp.some(digit => !digit)}
                className="w-full bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 rounded-full transition-all duration-200 mb-6 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>

              <div className="text-center">
                <span className="text-gray-600">Did not receive code? </span>
                {resendTimer > 0 ? (
                  <span className="text-green-600 font-medium">
                    Resend in {formatTime(resendTimer)}
                  </span>
                ) : (
                  <button
                    onClick={resendOtp}
                    className="text-green-600 hover:underline font-medium"
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
          )}

          {/* New Password Step */}
          {step === 'newPassword' && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
              <p className="text-gray-600 mb-8">Create a new password for your account</p>

              <div className="space-y-6">
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="New password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />

                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />

                {error && <div className="text-red-500 text-sm">{error}</div>}

                <button
                  onClick={resetPassword}
                  disabled={loading || !formData.newPassword || !formData.confirmPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
