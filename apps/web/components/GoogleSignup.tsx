'use client';

import React, { useState } from 'react';
// Force Azure rebuild - import GoogleAuthContext with explicit path
import { useGoogleAuth } from '../contexts/GoogleAuthContext';

interface GoogleSignupProps {
  userType: 'student' | 'college' | 'recruiter';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

const GoogleSignup: React.FC<GoogleSignupProps> = ({ 
  userType, 
  onSuccess, 
  onError, 
  className = '' 
}) => {
  const { signIn, isLoading, error } = useGoogleAuth();
  const [phone, setPhone] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const handleGoogleSignup = async () => {
    try {
      if (userType === 'student') {
        setShowPhoneInput(true);
      } else {
        await signIn(userType);
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google signup failed';
      onError?.(errorMessage);
    }
  };

  const handleStudentSignup = async () => {
    if (!phone) {
      onError?.('Phone number is required for students');
      return;
    }

    try {
      await signIn(userType, phone);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google signup failed';
      onError?.(errorMessage);
    }
  };

  if (showPhoneInput && userType === 'student') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number (required for students)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleStudentSignup}
          disabled={isLoading || !phone}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Signing up...
            </>
          ) : (
            <>
              <span className="text-blue-600 bg-white rounded px-2 py-1 font-bold">G</span>
              Complete Google Sign-up
            </>
          )}
        </button>
        <button
          onClick={() => setShowPhoneInput(false)}
          className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
        >
          Back
        </button>
        {error && (
          <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleSignup}
      disabled={isLoading}
      className={`w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${className}`}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
          Signing up...
        </>
      ) : (
        <>
          <span className="text-blue-600 font-bold text-lg">G</span>
          Sign up with Google
        </>
      )}
    </button>
  );
};

export default GoogleSignup;
