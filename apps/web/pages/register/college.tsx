'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CollegeSearchDropdown from '../../components/CollegeSearchDropdown';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/api';

export default function CollegeRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verified, approved

  const [formData, setFormData] = useState({
    // College Information
    collegeName: '',
    collegeType: '',
    establishedYear: '',
    email: '',
    recognizedBy: '',
    website: '',
    affiliatedTo: '',
    aboutCollege: '',
    
    // Contact Information  
    address: '',
    location: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
    
    // Contact Person
    coordinatorName: '',
    coordinatorDesignation: '',
    coordinatorNumber: '',
    coordinatorEmail: '',
    mobile: '',
    
    // Auth
    password: '',
    otp: ''
  });

  // Year options for establishment year dropdown
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear; year >= 1800; year--) {
    yearOptions.push(year);
  }

  // State options
  const stateOptions = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  // Recognized by options
  const recognizedByOptions = [
    'UGC', 'AICTE', 'MCI', 'DCI', 'BCI', 'NCTE', 'ICAR', 'Other'
  ];

  // Designation options
  const designationOptions = [
    'Principal', 'Vice Principal', 'Dean', 'Admission Officer', 
    'Training Placement Officer', 'Admin Head', 'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCollegeTypeSelect = (college: any) => {
    setFormData(prev => ({ ...prev, collegeType: college.name }));
  };

  const sendOTP = async () => {
    if (!formData.mobile || !formData.email) {
      setError('Mobile number and email are required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Check if email already exists
      const emailCheckResponse = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.CHECK_EMAIL}`, { 
        email: formData.email 
      });
      if (!emailCheckResponse.data.available) {
        router.push('/login');
        setLoading(false);
        return;
      }

      // Check if phone number already exists
      const phoneCheckResponse = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.CHECK_PHONE}`, { 
        phone: formData.mobile 
      });
      if (!phoneCheckResponse.data.available) {
        router.push('/login');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`, {
        email: formData.email,
        phoneNumber: formData.mobile,
        userType: 'college'
      });

      setOtpId(response.data.otpId);
      setOtpSent(true);
      console.log('OTP sent successfully:', response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
      console.error('OTP send error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!formData.otp || !otpId) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`, {
        otpId,
        otp: formData.otp,
        userType: 'college'
      });

      if (response.data.verified) {
        setOtpVerified(true);
        setStep(3);
        console.log('OTP verified successfully');
        
        // Submit registration
        await submitRegistration();
      } else {
        setError('OTP verification failed');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP');
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError('');

    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      const registrationData = {
        email: formData.email,
        password: tempPassword,
        role: 'college',
        userType: 'college',
        phoneNumber: formData.mobile,
        whatsappNumber: formData.mobile,
        otpId,
        profileData: {
          collegeName: formData.collegeName,
          collegeType: formData.collegeType,
          establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
          recognizedBy: formData.recognizedBy,
          website: formData.website,
          affiliatedTo: formData.affiliatedTo,
          aboutCollege: formData.aboutCollege,
          address: formData.address,
          location: formData.location,
          landmark: formData.landmark,
          pincode: formData.pincode,
          city: formData.city,
          state: formData.state,
          coordinatorName: formData.coordinatorName,
          coordinatorDesignation: formData.coordinatorDesignation,
          coordinatorNumber: formData.coordinatorNumber,
          coordinatorEmail: formData.coordinatorEmail
        }
      };

      console.log('College registration data:', registrationData);

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, registrationData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Decode token to get userId
        const token = response.data.token;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        const payload = JSON.parse(jsonPayload);
        localStorage.setItem('userId', payload.userId);
        
        setVerificationStatus('verified');
        setStep(4);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate step 1
      if (!formData.collegeName || !formData.establishedYear || !formData.email) {
        setError('Please fill in all required fields');
        return;
      }
      setStep(2);
    } else if (step === 2 && !otpSent) {
      // Validate step 2 and send OTP
      if (!formData.address || !formData.city || !formData.state || !formData.coordinatorName || !formData.mobile) {
        setError('Please fill in all required fields');
        return;
      }
      sendOTP();
    } else if (step === 2 && otpSent) {
      verifyOTP();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setOtpSent(false);
      setError('');
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an Account!!</h1>
            
            {/* Step Tabs */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-4">
                <button 
                  className={`px-4 py-2 rounded-md ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  Student
                </button>
                <button 
                  className={`px-4 py-2 rounded-md ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  College
                </button>
                <button 
                  className={`px-4 py-2 rounded-md ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  Company
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            {/* Step 1: College Information */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">College Information</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Please share a few basic details about your institution. This helps us to verify your college and present 
                  it to students and recruiters with trust and credibility.
                </p>
                
                <div className="space-y-6">
                  {/* Logo Upload */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <button className="text-blue-600 text-sm hover:underline">
                      Upload College Logo*
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">College name*</label>
                    <input
                      type="text"
                      name="collegeName"
                      value={formData.collegeName}
                      onChange={handleInputChange}
                      placeholder="Enter your college name"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">College establish year*</label>
                    <select
                      name="establishedYear"
                      value={formData.establishedYear}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Enter your established Year</option>
                      {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">College email*</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your college email"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recognized by*</label>
                    <select
                      name="recognizedBy"
                      value={formData.recognizedBy}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select recognition body</option>
                      {recognizedByOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select your college type*</label>
                    <CollegeSearchDropdown
                      onSelect={handleCollegeTypeSelect}
                      placeholder="Select your college type"
                      value={formData.collegeType}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">College Website*</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="Enter your college URL"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Affiliated University Name**</label>
                    <input
                      type="text"
                      name="affiliatedTo"
                      value={formData.affiliatedTo}
                      onChange={handleInputChange}
                      placeholder="Enter the University Name"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">About the college*</label>
                    <textarea
                      name="aboutCollege"
                      value={formData.aboutCollege}
                      onChange={handleInputChange}
                      placeholder="Write about your college"
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Contact information</h2>
                <p className="text-gray-600 text-sm mb-6">
                  One more step! Share your contact details to verify your college and connect with recruiters.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">College address*</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Ex: ABC Institute of Technology, Outer Ring Road, Bengaluru, Karnataka - 560103"
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location*</label>
                      <select
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select location</option>
                        {stateOptions.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Landmark*</label>
                      <input
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        placeholder="Near nearest landmark"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode*</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="Pin code"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City*</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Select your city"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State*</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select your state</option>
                      {stateOptions.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mt-8 mb-4">Contact Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Co-ordinator name*</label>
                      <input
                        type="text"
                        name="coordinatorName"
                        value={formData.coordinatorName}
                        onChange={handleInputChange}
                        placeholder="Enter your co-ordinator name"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Co-ordinator designation*</label>
                      <select
                        name="coordinatorDesignation"
                        value={formData.coordinatorDesignation}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select your designation</option>
                        {designationOptions.map(designation => (
                          <option key={designation} value={designation}>{designation}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Co-ordinator number*</label>
                      <input
                        type="tel"
                        name="coordinatorNumber"
                        value={formData.coordinatorNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your co-ordinator number"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Co-ordinator email*</label>
                      <input
                        type="email"
                        name="coordinatorEmail"
                        value={formData.coordinatorEmail}
                        onChange={handleInputChange}
                        placeholder="Enter your co-ordinator email"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile*</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="+91xxxxxx"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* OTP Section */}
                  {!otpSent ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-medium text-blue-800 mb-2">📱 Mobile Verification Required</h3>
                      <p className="text-blue-600 text-sm mb-4">
                        We'll send an OTP to your mobile number to verify your account.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="text-lg font-medium text-green-800 mb-2">📱 Verify your number</h3>
                      <p className="text-green-600 text-sm mb-4">
                        We have sent a 6 digit OTP to your registered number
                      </p>
                      
                      <div className="flex justify-center mb-4">
                        <div className="flex space-x-2">
                          {[...Array(6)].map((_, index) => (
                            <input
                              key={index}
                              type="text"
                              maxLength={1}
                              className="w-10 h-12 text-center border-2 border-gray-300 rounded-md focus:border-green-500 focus:outline-none text-lg font-semibold"
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length === 1 && index < 5) {
                                  const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                                  if (nextInput) nextInput.focus();
                                }
                                
                                // Update OTP in form data
                                const inputs = Array.from(e.target.parentElement?.children || []) as HTMLInputElement[];
                                const otp = inputs.map(input => input.value).join('');
                                setFormData(prev => ({ ...prev, otp }));
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          Did not receive code? Requesting in <span className="font-semibold">00:59</span>
                        </p>
                        <button 
                          type="button" 
                          className="text-blue-600 text-sm hover:underline"
                          onClick={sendOTP}
                        >
                          Resend
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Verification in Progress */}
            {step === 3 && (
              <div className="text-center py-12">
                <div className="mb-8">
                  <div className="mx-auto w-64 h-48 mb-6">
                    <svg viewBox="0 0 400 300" className="w-full h-full">
                      {/* Email illustration */}
                      <rect x="50" y="100" width="300" height="200" rx="20" fill="#FCD34D" />
                      <rect x="60" y="110" width="280" height="180" rx="15" fill="#F59E0B" />
                      <polygon points="60,110 200,200 340,110" fill="#D97706" />
                      
                      {/* People illustrations */}
                      <circle cx="120" cy="180" r="20" fill="#3B82F6" />
                      <rect x="100" y="200" width="40" height="60" rx="20" fill="#3B82F6" />
                      
                      <circle cx="280" cy="180" r="20" fill="#10B981" />
                      <rect x="260" y="200" width="40" height="60" rx="20" fill="#10B981" />
                      
                      {/* Decorative elements */}
                      <circle cx="80" cy="60" r="8" fill="#EF4444" />
                      <circle cx="320" cy="70" r="6" fill="#8B5CF6" />
                      <circle cx="100" cy="40" r="4" fill="#F59E0B" />
                    </svg>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification in Progress</h1>
                <p className="text-gray-600 mb-2">We're reviewing your details.</p>
                
                <div className="bg-blue-50 p-6 rounded-lg mb-8 max-w-md mx-auto">
                  <h2 className="text-xl font-semibold text-blue-800 mb-2">
                    Thank you for providing us the information
                  </h2>
                  <p className="text-blue-700 text-sm mb-4">Your account is under verification.</p>
                  <p className="text-blue-600 text-sm">
                    Our team will reach out shortly to confirm the information.
                  </p>
                </div>
                
                <button 
                  onClick={() => router.push('/approval-pending?type=college')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Check Status
                </button>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="text-center py-12">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  You have successfully created account.
                </h1>
                <p className="text-gray-600 mb-8">Now you can explore all the features.</p>
                
                <div className="bg-blue-50 p-6 rounded-lg mb-8 max-w-md mx-auto">
                  <h2 className="text-xl font-semibold text-blue-800 mb-2">
                    Congratulations your account has been created.
                  </h2>
                  <p className="text-blue-600 text-sm">
                    All the features are now enabled go and explore them.
                  </p>
                </div>
                
                <button 
                  onClick={() => router.push('/dashboard/college')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Explore Dashboard
                </button>
              </div>
            )}

            {/* Navigation Buttons */}
            {step <= 2 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={loading}
                  className={`px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${step === 1 ? 'ml-auto' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {step === 2 && otpSent ? 'Verifying...' : step === 2 ? 'Sending OTP...' : 'Please wait...'}
                    </span>
                  ) : (
                    step === 2 && otpSent ? 'Continue' : step === 2 ? 'Get OTP' : 'Continue'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
