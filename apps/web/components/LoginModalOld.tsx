import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, Phone } from 'lucide-react';
import GoogleSignup from './GoogleSignup';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserType?: 'student' | 'college' | 'company';
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialUserType = 'student' }) => {
  const [userType, setUserType] = useState<'student' | 'college' | 'company'>(initialUserType);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-sliding images
  const images = [
    '/images/login-slide-1.jpg',
    '/images/login-slide-2.jpg', 
    '/images/login-slide-3.jpg',
    '/images/login-slide-4.jpg'
  ];

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 4000); // Change image every 4 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen, images.length]);

  const handleUserTypeChange = (type: 'student' | 'college' | 'company') => {
    setUserType(type);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Panel - Auto-sliding Images */}
            <div className="w-1/2 relative bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col justify-between p-8 text-white">
              <div className="relative h-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="w-64 h-64 bg-white/20 rounded-2xl mb-6 flex items-center justify-center">
                      <div className="text-6xl">🎓</div>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">
                      {currentImageIndex === 0 && "Welcome to CampusPe"}
                      {currentImageIndex === 1 && "Connect with Opportunities"}
                      {currentImageIndex === 2 && "Build Your Future"}
                      {currentImageIndex === 3 && "Join Our Community"}
                    </h3>
                    <p className="text-lg opacity-90">
                      {currentImageIndex === 0 && "Your gateway to endless possibilities"}
                      {currentImageIndex === 1 && "Discover jobs, internships, and more"}
                      {currentImageIndex === 2 && "Create your professional profile"}
                      {currentImageIndex === 3 && "Network with industry leaders"}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center space-x-2 mt-8">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-1/2 p-8 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Sign In</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* User Type Tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
                {(['student', 'college', 'company'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleUserTypeChange(type)}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                      userType === type
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Google Signup - Only for Students */}
              {userType === 'student' && (
                <div className="mb-6">
                  <GoogleSignup userType="student" />
                  <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-sm text-gray-500">or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {userType === 'student' ? 'Email or Phone' : 'Email'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {userType === 'student' ? (
                        <Phone className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Mail className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <input
                      type={userType === 'student' ? 'text' : 'email'}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        userType === 'student' 
                          ? 'Enter email or phone number'
                          : 'Enter your email'
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Send OTP for Students OR Forgot Password for College/Company */}
                <div className="flex justify-between items-center">
                  {userType === 'student' ? (
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Send OTP instead
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Forgot your password?
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  Sign In
                </button>

                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="font-medium text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      onClose();
                      // Open register modal - you might need to implement this
                    }}
                  >
                    Create Account
                  </button>
                </p>
              </form>
            </div>
          </motion.div>

          {/* Forgot Password Modal */}
          <AnimatePresence>
            {showForgotPassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
                onClick={() => setShowForgotPassword(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Reset Password</h3>
                    <button
                      onClick={() => setShowForgotPassword(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <form className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email address"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                    >
                      Send Reset Link
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
