'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import axios from 'axios';

interface College {
  _id: string;
  name: string;
  domainCode: string;
}

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState<College[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpId, setOtpId] = useState('');
  const [sessionId, setSessionId] = useState(''); // Add sessionId for SMS OTP
  const [otpMethod, setOtpMethod] = useState('whatsapp'); // WhatsApp or SMS
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // Timer for OTP resend

  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    whatsappNumber: '',
    dateOfBirth: '',
    gender: '',
    
    // College Info
    collegeId: '',
    studentId: '',
    enrollmentYear: new Date().getFullYear(),
    graduationYear: '',
    currentSemester: '',
    
    // Additional Info
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    
    // Skills & Preferences
    skills: [{ name: '', level: 'beginner', category: 'technical' }],
    jobPreferences: {
      jobTypes: [],
      preferredLocations: [''],
      expectedSalary: { min: 0, max: 0, currency: 'INR' },
      workMode: 'any',
      availableFrom: ''
    },
    
    // OTP
    otp: ''
  });

  useEffect(() => {
    fetchColleges();
  }, []);

  // OTP timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpTimer]);

const fetchColleges = async () => {
  try {
    const response = await axios.get('http://localhost:5001/api/colleges');

    // Ensure colleges is an array
    const collegeList = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data.colleges)
        ? response.data.colleges
        : [];

    setColleges(collegeList);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    setColleges([]); // fallback to empty array to prevent .map crash
  }
};


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillChange = (index: number, field: string, value: string) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index] = { ...updatedSkills[index], [field]: value };
    setFormData(prev => ({ ...prev, skills: updatedSkills }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', level: 'beginner', category: 'technical' }]
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleJobTypesChange = (jobType: string) => {
    const updatedJobTypes = formData.jobPreferences.jobTypes.includes(jobType)
      ? formData.jobPreferences.jobTypes.filter(type => type !== jobType)
      : [...formData.jobPreferences.jobTypes, jobType];
    
    setFormData(prev => ({
      ...prev,
      jobPreferences: { ...prev.jobPreferences, jobTypes: updatedJobTypes }
    }));
  };

const sendOTP = async () => {
    if (!formData.phoneNumber) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Check if email already exists
      const emailCheckResponse = await axios.post('http://localhost:5001/api/auth/check-email', { email: formData.email });
      if (!emailCheckResponse.data.available) {
        router.push('/login');
        setLoading(false);
        return;
      }

      // Check if phone number already exists
      const phoneCheckResponse = await axios.post('http://localhost:5001/api/auth/check-phone', { phone: formData.phoneNumber });
      if (!phoneCheckResponse.data.available) {
        router.push('/login');
        setLoading(false);
        return;
      }

      const response = await axios.post('http://localhost:5001/api/auth/send-otp', {
        phoneNumber: formData.phoneNumber,
        userType: 'student',
        preferredMethod: otpMethod,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      setOtpId(response.data.otpId);
      setSessionId(response.data.sessionId); // Store sessionId for verification
      setOtpSent(true);
      setOtpTimer(60); // Start 60 second timer for resend
      
      if (response.data.method === 'whatsapp') {
        setError(''); // Clear any previous errors
        // Show success message for WhatsApp
        alert('🔐 OTP sent to your WhatsApp! Please check your messages and enter the 6-digit code below.');
      }
      
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
      const payload: any = {
        otpId,
        otp: formData.otp,
        userType: 'student',
        method: otpMethod
      };

      // Add sessionId if available (required for SMS OTP)
      if (sessionId) {
        payload.sessionId = sessionId;
      }

      console.log('Verifying OTP with payload:', payload);
      const response = await axios.post('http://localhost:5001/api/auth/verify-otp', payload);

      if (response.data.verified) {
        setStep(2);
        console.log('OTP verified successfully');
        // Clear OTP-related state
        setFormData(prev => ({ ...prev, otp: '' }));
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

  const resendOTP = async () => {
    if (otpTimer > 0) return;
    
    setOtpSent(false);
    setOtpId('');
    setSessionId('');
    setFormData(prev => ({ ...prev, otp: '' }));
    await sendOTP();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle different steps
    if (step === 1) {
      if (!otpSent) {
        sendOTP();
      } else {
        verifyOTP();
      }
      return;
    }

    // Final registration submission (last step)
    setError('');
    setLoading(true);

    try {
      // Validate collegeId before submitting
      if (!formData.collegeId || formData.collegeId.trim() === '') {
        setError('Please select a college.');
        setLoading(false);
        return;
      }

      // Check if email already exists before submitting registration
      const emailCheckResponse = await axios.post('http://localhost:5001/api/auth/check-email', { email: formData.email });
      if (!emailCheckResponse.data.available) {
        router.push('/login');
        setLoading(false);
        return;
      }

      // Check if phone number already exists before submitting registration
      const phoneCheckResponse = await axios.post('http://localhost:5001/api/auth/check-phone', { phone: formData.phoneNumber });
      if (!phoneCheckResponse.data.available) {
        router.push('/login');
        setLoading(false);
        return;
      }

const registrationData = {
  email: formData.email,  
  password: formData.password,
  role: 'student',
  phoneNumber: formData.phoneNumber,
  whatsappNumber: formData.whatsappNumber || formData.phoneNumber,
  otpId,
  sessionId, // Include sessionId for verification
  profileData: {
    firstName: formData.firstName,
    lastName: formData.lastName,
    dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
    gender: formData.gender === '' ? undefined : formData.gender,
    phoneNumber: formData.phoneNumber,
    linkedinUrl: formData.linkedinUrl,
    githubUrl: formData.githubUrl,
    portfolioUrl: formData.portfolioUrl,
    collegeId: formData.collegeId && formData.collegeId.trim() !== '' ? formData.collegeId : null,
    studentId: formData.studentId,
    enrollmentYear: Number(formData.enrollmentYear) || new Date().getFullYear(),
    graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
    currentSemester: formData.currentSemester ? Number(formData.currentSemester) : undefined,
    skills: formData.skills.filter(skill => skill.name.trim() !== ''),
    jobPreferences: {
      ...formData.jobPreferences,
      expectedSalary: {
        min: Number(formData.jobPreferences.expectedSalary.min) || 0,
        max: Number(formData.jobPreferences.expectedSalary.max) || 0,
        currency: formData.jobPreferences.expectedSalary.currency || 'INR'
      },
      preferredLocations: formData.jobPreferences.preferredLocations.filter((loc: string) => loc.trim() !== '')
    }
  }
};

      console.log('Submitting registration:', registrationData);
      const response = await axios.post('http://localhost:5001/api/auth/register', registrationData);
      
      console.log('Registration response:', response.data);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);

        // Decode token to get userId and store in localStorage
        const token = response.data.token;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        const payload = JSON.parse(jsonPayload);
        const userId = payload.userId;
        localStorage.setItem('userId', userId);
        console.log('Stored userId in localStorage after registration:', userId);

        console.log('Token stored, redirecting...');
        router.push('/dashboard/student');
      } else {
        setError('Registration succeeded but no token received.');
        console.error('No token in registration response:', response.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !otpSent) {
      sendOTP();
    } else if (step === 1 && otpSent) {
      verifyOTP();
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-blue-700 mb-4">Student Registration</h1>
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>1</div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>2</div>
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>3</div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Basic Information & Verification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="phoneNumber"
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {!otpSent ? (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium text-blue-800 mb-3">📱 Phone Verification Required</h3>
                  
                  {/* OTP Method Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose verification method:</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="otpMethod"
                          value="whatsapp"
                          checked={otpMethod === 'whatsapp'}
                          onChange={(e) => setOtpMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">📱 WhatsApp (Recommended)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="otpMethod"
                          value="sms"
                          checked={otpMethod === 'sms'}
                          onChange={(e) => setOtpMethod(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">💬 SMS</span>
                      </label>
                    </div>
                  </div>
                  
                  <p className="text-blue-600 text-sm mb-4">
                    {otpMethod === 'whatsapp' 
                      ? "We'll send a verification code to your WhatsApp number. Make sure you have WhatsApp installed and accessible."
                      : "We'll send a verification code via SMS to your phone number."
                    }
                  </p>
                  
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={loading || !formData.phoneNumber}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending OTP...
                      </span>
                    ) : (
                      `${otpMethod === 'whatsapp' ? '📱 Send WhatsApp OTP' : '💬 Send SMS OTP'}`
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-medium text-green-800 mb-2">
                    {otpMethod === 'whatsapp' ? '📱 WhatsApp OTP Sent!' : '💬 SMS OTP Sent!'}
                  </h3>
                  <p className="text-green-600 text-sm mb-4">
                    {otpMethod === 'whatsapp' 
                      ? `Check your WhatsApp messages for a 6-digit verification code sent to: ${formData.phoneNumber}`
                      : `Check your SMS messages for a 6-digit verification code sent to: ${formData.phoneNumber}`
                    }
                  </p>
                  
                  {otpMethod === 'whatsapp' && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> You can also reply directly to our WhatsApp message with the 6-digit code, 
                        or enter it in the field below.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-digit OTP</label>
                      <input
                        name="otp"
                        type="text"
                        placeholder="000000"
                        className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 px-4 py-3 rounded-md text-center text-lg font-mono tracking-widest"
                        value={formData.otp}
                        onChange={handleInputChange}
                        maxLength={6}
                        pattern="[0-9]{6}"
                        autoComplete="one-time-code"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={verifyOTP}
                        disabled={loading || formData.otp.length !== 6}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </span>
                        ) : (
                          '✅ Verify OTP'
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={resendOTP}
                        disabled={otpTimer > 0}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                      >
                        {otpTimer > 0 ? `⏱️ Resend in ${otpTimer}s` : '🔄 Resend OTP'}
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center mt-3">
                      Didn't receive the OTP? Check your {otpMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'} or click "Resend OTP"
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">College & Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  name="collegeId"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.collegeId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select College</option>
                  {colleges.map(college => (
                    <option key={college._id} value={college._id}>{college.name}</option>
                  ))}
                </select>
                <input
                  name="studentId"
                  type="text"
                  placeholder="Student ID"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="enrollmentYear"
                  type="number"
                  placeholder="Enrollment Year"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.enrollmentYear}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="graduationYear"
                  type="number"
                  placeholder="Expected Graduation Year"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.graduationYear}
                  onChange={handleInputChange}
                />
                <input
                  name="currentSemester"
                  type="number"
                  placeholder="Current Semester"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.currentSemester}
                  onChange={handleInputChange}
                />
                <input
                  name="dateOfBirth"
                  type="date"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
                <select
                  name="gender"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Skills & Preferences</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Skills</h3>
                {formData.skills.map((skill, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Skill name"
                      className="border px-3 py-2 rounded-md"
                      value={skill.name}
                      onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                    />
                    <select
                      className="border px-3 py-2 rounded-md"
                      value={skill.level}
                      onChange={(e) => handleSkillChange(index, 'level', e.target.value)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                    <select
                      className="border px-3 py-2 rounded-md"
                      value={skill.category}
                      onChange={(e) => handleSkillChange(index, 'category', e.target.value)}
                    >
                      <option value="technical">Technical</option>
                      <option value="soft">Soft Skills</option>
                      <option value="language">Language</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Add Skill
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Job Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Job Types</label>
                    {['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'].map(type => (
                      <label key={type} className="flex items-center mb-1">
                        <input
                          type="checkbox"
                          checked={formData.jobPreferences.jobTypes.includes(type)}
                          onChange={() => handleJobTypesChange(type)}
                          className="mr-2"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Work Mode</label>
                    <select
                      name="jobPreferences.workMode"
                      className="w-full border px-4 py-2 rounded-md"
                      value={formData.jobPreferences.workMode}
                      onChange={handleInputChange}
                    >
                      <option value="any">Any</option>
                      <option value="remote">Remote</option>
                      <option value="onsite">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  name="linkedinUrl"
                  type="url"
                  placeholder="LinkedIn URL"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
                />
                <input
                  name="githubUrl"
                  type="url"
                  placeholder="GitHub URL"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                />
                <input
                  name="portfolioUrl"
                  type="url"
                  placeholder="Portfolio URL"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.portfolioUrl}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
              >
                Previous
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 ml-auto"
              >
                {loading ? 'Please wait...' : (otpSent && step === 1 ? 'Verify OTP' : 'Next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 ml-auto"
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
