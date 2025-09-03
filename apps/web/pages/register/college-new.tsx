import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { API_BASE_URL, API_ENDPOINTS } from '../../utils/api';
import axios from 'axios';

// Step-wise state management
type Step = 1 | 2 | 3 | 4;

interface CollegeFormData {
  // Step 1: Account Creation
  collegeName: string;
  email: string;
  password: string;
  agreeTerms: boolean;
  
  // Email Verification
  emailOtp: string;
  
  // Step 2: College Information
  logoFile: File | null;
  logoUrl: string;
  establishedYear: string;
  recognizedBy: string;
  collegeType: string;
  website: string;
  affiliatedTo: string;
  aboutCollege: string;
  
  // Step 3: Contact Information
  address: string;
  location: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  coordinatorName: string;
  coordinatorDesignation: string;
  coordinatorNumber: string;
  coordinatorEmail: string;
  mobile: string;
  whatsappOptIn: boolean;
  
  // Mobile Verification
  mobileOtp: string;
}

export default function CollegeRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [emailOtpId, setEmailOtpId] = useState('');
  const [mobileOtpId, setMobileOtpId] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  
  const otpInputRefs = useRef<HTMLInputElement[]>([]);

  const [formData, setFormData] = useState<CollegeFormData>({
    // Step 1
    collegeName: '',
    email: '',
    password: '',
    agreeTerms: false,
    emailOtp: '',
    
    // Step 2
    logoFile: null,
    logoUrl: '',
    establishedYear: '',
    recognizedBy: '',
    collegeType: '',
    website: '',
    affiliatedTo: '',
    aboutCollege: '',
    
    // Step 3
    address: '',
    location: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
    coordinatorName: '',
    coordinatorDesignation: '',
    coordinatorNumber: '',
    coordinatorEmail: '',
    mobile: '',
    whatsappOptIn: true,
    
    mobileOtp: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // OTP Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendEmailOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`, {
        email: formData.email,
        userType: 'college'
      });

      if (response.data.otpId) {
        setEmailOtpId(response.data.otpId);
        setSuccess('OTP sent to your email successfully!');
        setOtpTimer(120); // 2 minutes
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const sendMobileOTP = async () => {
    if (!formData.mobile) {
      setError('Please enter your mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`, {
        phoneNumber: formData.mobile,
        userType: 'college',
        preferredMethod: 'whatsapp'
      });

      if (response.data.otpId) {
        setMobileOtpId(response.data.otpId);
        setShowOtpModal(true);
        setOtpTimer(120);
        setSuccess('OTP sent to your mobile number!');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = formData.mobileOtp.split('');
      newOtp[index] = value;
      setFormData(prev => ({ ...prev, mobileOtp: newOtp.join('') }));
      
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError('');

    try {
      let logoUrl = '';
      if (formData.logoFile) {
        console.log('Logo upload would happen here');
        // Note: You'll need to implement logo upload endpoint
      }

      const registrationData = {
        email: formData.email,
        password: formData.password,
        role: 'college',
        phoneNumber: formData.mobile,
        whatsappNumber: formData.mobile,
        otpId: emailOtpId,
        profileData: {
          collegeName: formData.collegeName,
          collegeType: formData.collegeType,
          establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
          recognizedBy: formData.recognizedBy,
          website: formData.website,
          affiliatedTo: formData.affiliatedTo,
          aboutCollege: formData.aboutCollege,
          
          // Address fields (direct fields)
          street: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          landmark: formData.landmark,
          location: formData.location,
          
          // Primary contact fields (direct fields as API expects)
          contactName: formData.coordinatorName,
          contactDesignation: formData.coordinatorDesignation,
          contactEmail: formData.coordinatorEmail,
          contactPhone: formData.coordinatorNumber,
          
          // Also include coordinator fields for backward compatibility
          coordinatorName: formData.coordinatorName,
          coordinatorDesignation: formData.coordinatorDesignation,
          coordinatorEmail: formData.coordinatorEmail,
          coordinatorNumber: formData.coordinatorNumber,
          mobile: formData.mobile,
          
          logo: logoUrl
        }
      };

      console.log('Registration data:', registrationData);

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, registrationData);

      console.log('Registration response:', response.data);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setStep(4); // Move to verification success page
        setSuccess('Registration successful! Your account is under review.');
      }
    } catch (error: any) {
      console.error('Registration error:', error.response?.data);
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
      setShowOtpModal(false);
    }
  };

  const verifyMobileOTP = async () => {
    if (!formData.mobileOtp || formData.mobileOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`, {
        otpId: mobileOtpId,
        otp: formData.mobileOtp,
        userType: 'college',
        method: 'whatsapp'
      });

      if (response.data.verified) {
        setSuccess('Mobile number verified successfully!');
        await submitRegistration();
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError('');
    
    if (step === 1) {
      if (!formData.collegeName || !formData.email || !formData.password || !formData.agreeTerms) {
        setError('Please fill all required fields and accept terms & conditions');
        return;
      }
      sendEmailOTP();
      return;
    }
    
    if (step === 2) {
      if (!formData.establishedYear || !formData.recognizedBy || !formData.collegeType) {
        setError('Please fill all required fields');
        return;
      }
    }
    
    if (step === 3) {
      if (!formData.address || !formData.coordinatorName || !formData.coordinatorNumber || !formData.mobile) {
        setError('Please fill all required fields');
        return;
      }
      sendMobileOTP();
      return;
    }
    
    setStep((prev) => (prev + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => (prev - 1) as Step);
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-8">
              <Image
                src="/88e21d9821e24bd22f3f4cd331e57683038b99c6.png"
                alt="Verification Success"
                width={400}
                height={300}
                className="mx-auto mb-6"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Verification in Progress
            </h1>
            <p className="text-gray-600 mb-6">
              We're reviewing your details.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-blue-800 mb-2">
                Thank you for providing us the information
              </h2>
              <p className="text-blue-700 mb-2">Your account is under verification.</p>
              <p className="text-blue-700">Our team will reach out shortly to confirm the information.</p>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Check Status
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Step 1: Create Account */}
        {step === 1 && (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl w-full">
              {/* Left Side - Illustration */}
              <div className="w-1/2 bg-gray-50 p-12 flex flex-col justify-center">
                <div className="text-center mb-8">
                  <div className="relative mb-8">
                    <div className="w-80 h-80 mx-auto relative">
                      <div className="absolute inset-0 bg-yellow-300 rounded-full"></div>
                      <div className="absolute inset-8 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Image
                          src="/3b4d5529440969da813eeb7824f7dd1c42a63f19.png"
                          alt="Laptop Illustration"
                          width={200}
                          height={150}
                          className="z-10"
                        />
                      </div>
                      {/* Social Icons */}
                      <div className="absolute top-12 right-8 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="text-white text-xl">👤</div>
                      </div>
                      <div className="absolute top-24 right-4 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                        <div className="text-white text-sm">❤</div>
                      </div>
                      <div className="absolute bottom-16 left-8 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="text-white text-xl">👍</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    Boost your <span className="text-blue-600">online</span><br />
                    <span className="text-blue-600">presence</span>
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Connect with thousands of students instantly and<br />
                    showcase your college programs online.
                  </p>
                </div>
                
                {/* Pagination dots */}
                <div className="flex justify-center mt-8 space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                </div>
              </div>
              
              {/* Right Side - Form */}
              <div className="w-1/2 p-12">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-800">
                    Create an <span className="text-blue-600">Account !!</span>
                  </h1>
                  <button
                    onClick={() => router.push('/')}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                {/* Account Type Tabs */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
                  <button className="flex-1 py-2 px-4 text-sm text-gray-600 rounded-lg">
                    Student
                  </button>
                  <button className="flex-1 py-2 px-4 text-sm bg-white text-blue-600 rounded-lg shadow-sm font-medium">
                    College
                  </button>
                  <button className="flex-1 py-2 px-4 text-sm text-gray-600 rounded-lg">
                    Company
                  </button>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                    {success}
                  </div>
                )}
                
                <form className="space-y-6">
                  <div>
                    <input
                      name="collegeName"
                      type="text"
                      placeholder="College Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.collegeName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <input
                      name="email"
                      type="email"
                      placeholder="College email Id"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="relative">
                    <input
                      name="password"
                      type="password"
                      placeholder="Password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      👁
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      name="agreeTerms"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                      required
                    />
                    <label className="text-sm text-gray-600">
                      I have read and agree with all terms and conditions.
                    </label>
                  </div>
                  
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? 'Sending OTP...' : 'Sign up'}
                  </button>
                  
                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="text-blue-600 hover:underline"
                    >
                      Login
                    </button>
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: College Information */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Image src="/logo.svg" alt="CampusPe" width={120} height={40} />
                  <div className="ml-8 flex space-x-6 text-sm text-gray-500">
                    <span>Post a Job</span>
                    <span>Collect Fees</span>
                    <span>Connect with companies</span>
                  </div>
                  <div className="ml-auto w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">B</span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2">College information</h2>
                <p className="text-gray-600">
                  Please share a few basic details about your institution. This helps us to verify your college and present it to students and recruiters with trust and credibility.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {/* Logo Upload */}
              <div className="mb-8">
                <div className="border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 h-36 sm:h-40 flex items-center justify-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">Upload PNG, JPEG (max 5MB)*</p>
                  <button
                    type="button"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Upload College Logo*
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5 md:gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College name*</label>
                  <input
                    name="collegeName"
                    type="text"
                    placeholder="Enter your college name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.collegeName}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College establish year*</label>
                  <select
                    name="establishedYear"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.establishedYear}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Enter your established year</option>
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College email*</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="admin@college.edu"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recognized by*</label>
                  <select
                    name="recognizedBy"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.recognizedBy}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="UGC">UGC</option>
                    <option value="AICTE">AICTE</option>
                    <option value="MCI">MCI</option>
                    <option value="DCI">DCI</option>
                    <option value="BCI">BCI</option>
                    <option value="NCTE">NCTE</option>
                    <option value="ICAR">ICAR</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select your college type*</label>
                  <select
                    name="collegeType"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.collegeType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select your institution type</option>
                    <option value="Engineering College">Engineering College</option>
                    <option value="Medical College">Medical College</option>
                    <option value="Management Institute">Management Institute</option>
                    <option value="Arts and Science College">Arts and Science College</option>
                    <option value="Law College">Law College</option>
                    <option value="Pharmacy College">Pharmacy College</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College Website*</label>
                  <input
                    name="website"
                    type="url"
                    placeholder="Enter your college URL link"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.website}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Affiliated to*</label>
                  <input
                    name="affiliatedTo"
                    type="text"
                    placeholder="Other"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.affiliatedTo}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Affiliated University Name?*</label>
                  <input
                    name="affiliatedUniversity"
                    type="text"
                    placeholder="Enter Your University Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">About the college*</label>
                <textarea
                  name="aboutCollege"
                  rows={6}
                  placeholder="Enter about your college"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.aboutCollege}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={nextStep}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact Information */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Image src="/logo.svg" alt="CampusPe" width={120} height={40} />
                  <div className="ml-8 flex space-x-6 text-sm text-gray-500">
                    <span>Post a Job</span>
                    <span>Collect Fees</span>
                    <span>Connect with companies</span>
                  </div>
                  <div className="ml-auto w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">B</span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Contact information</h2>
                <p className="text-gray-600">
                  One more step! Share your contact details to verify your college and connect with recruiters.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College address*</label>
                  <textarea
                    name="address"
                    rows={4}
                    placeholder="123, ABC Institute of Technology, Outer Ring Road, Bengaluru, Karnataka - 560037"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location*</label>
                    <input
                      name="location"
                      type="text"
                      placeholder="Search location"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Landmark*</label>
                    <input
                      name="landmark"
                      type="text"
                      placeholder="Enter your nearest landmark"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.landmark}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode*</label>
                    <input
                      name="pincode"
                      type="text"
                      placeholder="Enter six digit pincode"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City*</label>
                    <select
                      name="city"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select your city</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Pune">Pune</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State*</label>
                  <select
                    name="state"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select your state</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Gujarat">Gujarat</option>
                  </select>
                </div>

                <div className="border-t pt-6 mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Contact Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Co-ordinator name*</label>
                      <input
                        name="coordinatorName"
                        type="text"
                        placeholder="Please enter co-ordinator name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.coordinatorName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Co-ordinator designation*</label>
                      <input
                        name="coordinatorDesignation"
                        type="text"
                        placeholder="Enter co-ordinator designation"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.coordinatorDesignation}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Co-ordinator number*</label>
                      <input
                        name="coordinatorNumber"
                        type="tel"
                        placeholder="Enter co-ordinator number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.coordinatorNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Co-ordinator email*</label>
                      <input
                        name="coordinatorEmail"
                        type="email"
                        placeholder="Please enter co-ordinator email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.coordinatorEmail}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile*</label>
                    <div className="flex">
                      <input
                        name="mobile"
                        type="tel"
                        placeholder="9876543210"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        required
                      />
                      <button
                        type="button"
                        className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Get OTP
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-3">
                    <div className="flex items-center">
                      <input
                        name="whatsappOptIn"
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        checked={formData.whatsappOptIn}
                        onChange={handleInputChange}
                      />
                      <span className="ml-2 text-sm text-white bg-green-500 px-2 py-1 rounded">ON</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      Get instant alert on WhatsApp for recruiter invites and placement updates. You can turn off this anytime.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Verify your number</h2>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 text-center mb-8">
              Enter 6-digits code we sent to your mobile number
            </p>
            
            <div className="flex justify-center space-x-3 mb-8">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={el => {
                    if (el) otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  className="w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:border-blue-500"
                  value={formData.mobileOtp[index] || ''}
                  onChange={(e) => handleOtpInput(index, e.target.value)}
                />
              ))}
            </div>
            
            <button
              onClick={verifyMobileOTP}
              disabled={loading || formData.mobileOtp.length !== 6}
              className="w-full bg-gray-400 text-white py-3 rounded-full font-medium disabled:opacity-50 hover:bg-gray-500 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            
            <p className="text-center text-sm text-gray-600 mt-4">
              Did not receive code?{' '}
              {otpTimer > 0 ? (
                <span className="text-green-600">Resend in {formatTime(otpTimer)}</span>
              ) : (
                <button
                  onClick={sendMobileOTP}
                  className="text-green-600 hover:underline"
                >
                  Resend
                </button>
              )}
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
