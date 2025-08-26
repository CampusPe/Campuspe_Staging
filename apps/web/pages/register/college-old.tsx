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
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayInputChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayField = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), '']
    }));
  };

  const removeArrayField = (index: number, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const generateDomainCode = () => {
    if (formData.collegeName) {
      const code = formData.collegeName
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 4) + Math.floor(Math.random() * 1000);
      setFormData(prev => ({ ...prev, domainCode: code }));
    }
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Check if email already exists
      const emailCheckResponse = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.CHECK_EMAIL}`, { email: formData.email });
      if (!emailCheckResponse.data.available) {
        router.push('/login');
        setLoading(false);
        return;
      }

      // Check if phone number already exists
      const phoneCheckResponse = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.CHECK_PHONE}`, { phone: formData.phoneNumber });
      if (!phoneCheckResponse.data.available) {
        router.push('/login');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`, {
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        userType: 'college'
      });

      setOtpId(response.data.otpId);
      setOtpSent(true);
      console.log('OTP sent successfully to college email:', response.data);
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
        setStep(2);
        console.log('College email OTP verified successfully');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields before submission
      if (!formData.email || !formData.password || !formData.collegeName || !formData.firstName || !formData.lastName) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Auto-fill primary contact fields if empty with admin info
      const contactName = formData.contactName && formData.contactName.trim() !== '' ? formData.contactName : `${formData.firstName} ${formData.lastName}`;
      const contactDesignation = formData.contactDesignation && formData.contactDesignation.trim() !== '' ? formData.contactDesignation : 'Administrator';
      const contactEmail = formData.contactEmail && formData.contactEmail.trim() !== '' ? formData.contactEmail : formData.email;
      const contactPhone = formData.contactPhone && formData.contactPhone.trim() !== '' ? formData.contactPhone : formData.phoneNumber;

      // Additional validation for auto-filled fields
      if (!contactName || contactName.trim() === '') {
        setError('Contact name is required');
        return;
      }
      if (!contactDesignation || contactDesignation.trim() === '') {
        setError('Contact designation is required');
        return;
      }
      if (!contactEmail || contactEmail.trim() === '') {
        setError('Contact email is required');
        return;
      }
      if (!contactPhone || contactPhone.trim() === '') {
        setError('Contact phone is required');
        return;
      }

      const registrationData = {
        email: formData.email,
        password: formData.password,
        role: 'college',
        userType: 'college',
        phoneNumber: formData.phoneNumber,
        whatsappNumber: formData.whatsappNumber || formData.phoneNumber,
        otpId,
        profileData: {
          collegeName: formData.collegeName,
          shortName: formData.shortName,
          domainCode: formData.domainCode,
          website: formData.website,
          establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
          affiliation: formData.affiliation,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          contactName,
          contactDesignation,
          contactEmail,
          contactPhone,
          placementContact: formData.placementContactName ? {
            name: formData.placementContactName,
            designation: formData.placementContactDesignation,
            email: formData.placementContactEmail,
            phone: formData.placementContactPhone
          } : undefined,
          accreditation: formData.accreditation.filter(acc => acc.trim() !== ''),
          departments: formData.departments.filter(dept => dept.trim() !== ''),
          allowDirectApplications: formData.allowDirectApplications,
          isPlacementActive: formData.isPlacementActive,
          placementCriteria: {
            minimumCGPA: formData.minimumCGPA,
            allowedBranches: formData.allowedBranches.filter(branch => branch.trim() !== ''),
            noOfBacklogs: formData.noOfBacklogs
          },
          firstName: formData.firstName,
          lastName: formData.lastName
        }
      };

      console.log('College registration data being sent:', JSON.stringify(registrationData, null, 2));

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, registrationData);
      
      localStorage.setItem('token', response.data.token);

      // Decode token to get userId and store in localStorage
      const token = response.data.token;
      console.log('Registration token:', token);
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const payload = JSON.parse(jsonPayload);
      console.log('Decoded token payload:', payload);
      const userId = payload.userId;
      localStorage.setItem('userId', userId);
      console.log('Stored userId in localStorage after registration:', userId);

      router.push('/approval-pending?type=college');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
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
          <h1 className="text-3xl font-bold text-center text-purple-700 mb-4">College Registration</h1>
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>1</div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>2</div>
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>3</div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Administrator Information & Verification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="firstName"
                  type="text"
                  placeholder="Admin First Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="lastName"
                  type="text"
                  placeholder="Admin Last Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Official Email"
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
                <input
                  name="whatsappNumber"
                  type="tel"
                  placeholder="WhatsApp Number (optional)"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.whatsappNumber}
                  onChange={handleInputChange}
                />
              </div>

              {!otpSent ? (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">📧 Email Verification Required</h3>
                  <p className="text-blue-600 text-sm mb-4">
                    We'll send an OTP to your college email address to verify your account.
                  </p>
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={loading || !formData.email}
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
                      '📧 Send Email OTP'
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-medium text-green-800 mb-2">✅ OTP Sent Successfully!</h3>
                  <p className="text-green-600 text-sm mb-4">
                    Please check your email inbox for a 6-digit verification code sent to: <strong>{formData.email}</strong>
                  </p>
                  
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
                        onClick={() => {
                          setOtpSent(false);
                          setOtpId('');
                          setFormData(prev => ({ ...prev, otp: '' }));
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        🔄 Resend OTP
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                      Didn't receive the OTP? Check your email inbox and spam folder or click "Resend OTP"
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">College Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="collegeName"
                  type="text"
                  placeholder="College Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.collegeName}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="shortName"
                  type="text"
                  placeholder="Short Name/Abbreviation"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.shortName}
                  onChange={handleInputChange}
                />
                <div className="flex gap-2">
                  <input
                    name="domainCode"
                    type="text"
                    placeholder="Domain Code"
                    className="flex-1 border px-4 py-2 rounded-md"
                    value={formData.domainCode}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={generateDomainCode}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Generate
                  </button>
                </div>
                <input
                  name="website"
                  type="url"
                  placeholder="College Website"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.website}
                  onChange={handleInputChange}
                />
                <input
                  name="establishedYear"
                  type="number"
                  placeholder="Established Year"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.establishedYear}
                  onChange={handleInputChange}
                />
                <input
                  name="affiliation"
                  type="text"
                  placeholder="University Affiliation"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.affiliation}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <h3 className="text-lg font-medium mt-6 mb-4">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="street"
                  type="text"
                  placeholder="Street Address"
                  className="w-full border px-4 py-2 rounded-md col-span-2"
                  value={formData.street}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="city"
                  type="text"
                  placeholder="City"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="state"
                  type="text"
                  placeholder="State"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="zipCode"
                  type="text"
                  placeholder="ZIP Code"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="country"
                  type="text"
                  placeholder="Country"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Contact Information & Settings</h2>
              
              <h3 className="text-lg font-medium mb-4">Primary Contact (if different from admin)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  name="contactName"
                  type="text"
                  placeholder="Contact Person Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.contactName}
                  onChange={handleInputChange}
                />
                <input
                  name="contactDesignation"
                  type="text"
                  placeholder="Designation"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.contactDesignation}
                  onChange={handleInputChange}
                />
                <input
                  name="contactEmail"
                  type="email"
                  placeholder="Contact Email"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                />
                <input
                  name="contactPhone"
                  type="tel"
                  placeholder="Contact Phone"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                />
              </div>

              <h3 className="text-lg font-medium mb-4">Placement Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  name="placementContactName"
                  type="text"
                  placeholder="Placement Officer Name"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.placementContactName}
                  onChange={handleInputChange}
                />
                <input
                  name="placementContactDesignation"
                  type="text"
                  placeholder="Designation"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.placementContactDesignation}
                  onChange={handleInputChange}
                />
                <input
                  name="placementContactEmail"
                  type="email"
                  placeholder="Placement Email"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.placementContactEmail}
                  onChange={handleInputChange}
                />
                <input
                  name="placementContactPhone"
                  type="tel"
                  placeholder="Placement Phone"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.placementContactPhone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Accreditations</h3>
                {formData.accreditation.map((acc, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Accreditation (e.g., NAAC A+, NBA)"
                      className="flex-1 border px-3 py-2 rounded-md"
                      value={acc}
                      onChange={(e) => handleArrayInputChange(index, 'accreditation', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField(index, 'accreditation')}
                      className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('accreditation')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Add Accreditation
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Departments</h3>
                {formData.departments.map((dept, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Department name"
                      className="flex-1 border px-3 py-2 rounded-md"
                      value={dept}
                      onChange={(e) => handleArrayInputChange(index, 'departments', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField(index, 'departments')}
                      className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('departments')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Add Department
                </button>
              </div>

              <h3 className="text-lg font-medium mb-4">Placement Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  name="minimumCGPA"
                  type="number"
                  step="0.1"
                  placeholder="Minimum CGPA for Placement"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.minimumCGPA}
                  onChange={handleInputChange}
                />
                <input
                  name="noOfBacklogs"
                  type="number"
                  placeholder="Maximum Backlogs Allowed"
                  className="w-full border px-4 py-2 rounded-md"
                  value={formData.noOfBacklogs}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <label className="flex items-center">
                  <input
                    name="allowDirectApplications"
                    type="checkbox"
                    checked={formData.allowDirectApplications}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Allow Direct Student Applications
                </label>
                <label className="flex items-center">
                  <input
                    name="isPlacementActive"
                    type="checkbox"
                    checked={formData.isPlacementActive}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Placement Activities Active
                </label>
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
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 ml-auto"
              >
                {loading ? 'Please wait...' : (otpSent && step === 1 ? 'Verify OTP' : 'Next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 ml-auto"
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
