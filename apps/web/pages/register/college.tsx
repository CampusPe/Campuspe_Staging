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
  recognizedByOther: string;
  collegeType: string;
  website: string;
  affiliatedTo: string;
  affiliatedUniversityName: string;
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
  coordinatorDesignationOther: string;
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
  const [showPassword, setShowPassword] = useState(false);
  
  // Search states for dropdowns
  const [recognizedBySearch, setRecognizedBySearch] = useState('');
  const [affiliatedToSearch, setAffiliatedToSearch] = useState('');
  const [coordinatorDesignationSearch, setCoordinatorDesignationSearch] = useState('');
  
  // Location states
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  
  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpModalType, setOtpModalType] = useState<'email' | 'mobile'>('email');
  const [emailOtpId, setEmailOtpId] = useState('');
  const [mobileOtpId, setMobileOtpId] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
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
    recognizedByOther: '',
    collegeType: '',
    website: '',
    affiliatedTo: '',
    affiliatedUniversityName: '',
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
    coordinatorDesignationOther: '',
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
      
      // Auto-validate pincode when it's 6 digits
      if (name === 'pincode' && value.length === 6 && /^\d+$/.test(value)) {
        validatePincode(value);
      }
    }
  };

  // Handle step from URL parameter and pre-filled data
  useEffect(() => {
    if (router.isReady && router.query.step) {
      const stepParam = parseInt(router.query.step as string);
      if (stepParam >= 1 && stepParam <= 4) {
        setStep(stepParam as Step);
      }

      // Handle verified data from registration modal
      if (router.query.verified_name && router.query.verified_email) {
        setFormData(prev => ({
          ...prev,
          collegeName: decodeURIComponent(router.query.verified_name as string),
          email: decodeURIComponent(router.query.verified_email as string)
        }));
      }
    }
  }, [router.isReady, router.query.step, router.query.verified_name, router.query.verified_email]);

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

  // Auto-request location when step 3 loads
  useEffect(() => {
    if (step === 3 && !hasRequestedLocation) {
      setHasRequestedLocation(true);
      requestLocation();
    }
  }, [step, hasRequestedLocation]);

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
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('API_ENDPOINTS.SEND_OTP:', API_ENDPOINTS.SEND_OTP);
      console.log('Full URL:', `${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`);
      
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SEND_OTP}`, {
        email: formData.email,
        userType: 'college'
      });

      if (response.data.otpId) {
        setEmailOtpId(response.data.otpId);
        setSuccess('OTP sent to your email successfully!');
        setOtpTimer(120); // 2 minutes
        setOtpModalType('email');
        setShowOtpModal(true); // Show email OTP modal
      }
    } catch (error: any) {
      console.error('OTP send error:', error.response?.data || error.message);
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

    if (!formData.collegeName) {
      setError('Please enter your college name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log('📱 Sending WhatsApp OTP via URL parameters:', {
        phone: formData.mobile,
        name: formData.collegeName,
        otp: otp
      });
      
      // Send OTP via WhatsApp webhook using URL parameters
      const webhookUrl = `https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/?Phone=${encodeURIComponent(formData.mobile)}&Name=${encodeURIComponent(formData.collegeName)}&OTP=${encodeURIComponent(otp)}`;
      
      console.log('📡 Webhook URL:', webhookUrl);
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('📡 Webhook response:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        ok: webhookResponse.ok
      });

      if (webhookResponse.ok || webhookResponse.status === 200) {
        // Store the OTP temporarily (in real app, this should be stored securely on backend)
        localStorage.setItem('tempMobileOtp', otp);
        localStorage.setItem('tempMobileOtpExpiry', (Date.now() + 10 * 60 * 1000).toString()); // 10 minutes
        
        console.log('✅ OTP stored:', {
          otp: otp,
          expiry: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });
        
        setMobileOtpId('webhook-' + Date.now()); // Use timestamp as OTP ID
        setOtpModalType('mobile');
        setShowOtpModal(true);
        setOtpTimer(120);
        setSuccess('OTP sent to your WhatsApp number!');
      } else {
        const errorText = await webhookResponse.text();
        console.error('❌ Webhook error:', errorText);
        throw new Error(`Failed to send WhatsApp OTP: ${errorText}`);
      }
    } catch (error: any) {
      console.error('WhatsApp OTP send error:', error);
      setError('Failed to send WhatsApp OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string, type: 'email' | 'mobile') => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      if (type === 'email') {
        const newOtp = formData.emailOtp.split('');
        newOtp[index] = value;
        setFormData(prev => ({ ...prev, emailOtp: newOtp.join('') }));
      } else {
        const newOtp = formData.mobileOtp.split('');
        newOtp[index] = value;
        setFormData(prev => ({ ...prev, mobileOtp: newOtp.join('') }));
      }
      
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const verifyEmailOTP = async () => {
    if (!formData.emailOtp || formData.emailOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.VERIFY_OTP}`, {
        otpId: emailOtpId,
        otp: formData.emailOtp,
        userType: 'college',
        method: 'email'
      });

      if (response.data.verified) {
        setSuccess('Email verified successfully!');
        setShowOtpModal(false);
        setStep(2); // Move to next step
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

    // Function to send WhatsApp notification
  const sendWhatsAppNotification = async (message: string) => {
    try {
      await fetch('https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          timestamp: new Date().toISOString(),
          type: 'college_registration'
        }),
      });
    } catch (error) {
      console.error('WhatsApp notification failed:', error);
    }
  };

  // Function to validate pincode and auto-fill city/state
  const validatePincode = async (pincode: string) => {
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          
          setFormData(prev => ({
            ...prev,
            pincode: pincode,
            city: postOffice.District || '',
            state: postOffice.State || ''
          }));
          
          return true;
        } else {
          alert('Invalid pincode. Please check and try again.');
          return false;
        }
      } catch (error) {
        console.error('Error validating pincode:', error);
        return false;
      }
    }
    return false;
  };

  // Function to request location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use a simpler reverse geocoding API
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await response.json();
          
          if (data.address) {
            const address = data.address;
            
            setFormData(prev => ({
              ...prev,
              address: data.display_name || '',
              city: address.city || address.town || address.village || address.suburb || '',
              state: address.state || '',
              pincode: address.postcode || ''
            }));
          }
        } catch (error) {
          console.error('Error getting location details:', error);
        }
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
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
          recognizedBy: formData.recognizedBy === 'Other' ? formData.recognizedByOther : formData.recognizedBy,
          website: formData.website,
          affiliatedTo: formData.affiliatedTo === 'Other' ? formData.affiliatedUniversityName : formData.affiliatedTo,
          affiliatedUniversityName: formData.affiliatedUniversityName,
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
          contactDesignation: formData.coordinatorDesignation === 'Other' ? formData.coordinatorDesignationOther : formData.coordinatorDesignation,
          contactEmail: formData.coordinatorEmail,
          contactPhone: formData.coordinatorNumber,
          
          // Also include coordinator fields for backward compatibility
          coordinatorName: formData.coordinatorName,
          coordinatorDesignation: formData.coordinatorDesignation === 'Other' ? formData.coordinatorDesignationOther : formData.coordinatorDesignation,
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
        
        // Send WhatsApp notification
        await sendWhatsAppNotification(`New college registration: ${formData.collegeName} (${formData.email})`);
        
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
      // Get stored OTP and check expiry
      const storedOtp = localStorage.getItem('tempMobileOtp');
      const otpExpiry = localStorage.getItem('tempMobileOtpExpiry');
      
      console.log('🔍 Verifying OTP:', {
        enteredOtp: formData.mobileOtp,
        storedOtp: storedOtp,
        expiry: otpExpiry ? new Date(parseInt(otpExpiry)).toISOString() : 'none',
        isExpired: otpExpiry ? Date.now() > parseInt(otpExpiry) : 'no expiry'
      });
      
      if (!storedOtp || !otpExpiry || Date.now() > parseInt(otpExpiry)) {
        setError('OTP has expired. Please request a new one.');
        localStorage.removeItem('tempMobileOtp');
        localStorage.removeItem('tempMobileOtpExpiry');
        setLoading(false);
        return;
      }
      
      if (formData.mobileOtp === storedOtp) {
        console.log('✅ OTP verification successful!');
        setSuccess('Mobile number verified successfully!');
        
        // Clean up stored OTP
        localStorage.removeItem('tempMobileOtp');
        localStorage.removeItem('tempMobileOtpExpiry');
        
        await submitRegistration();
      } else {
        console.log('❌ OTP mismatch');
        setError('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Mobile OTP verification error:', error);
      setError('OTP verification failed. Please try again.');
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
      
      // Check about college minimum characters
      if (formData.aboutCollege.length < 50) {
        setError('About the college must be minimum 50 characters');
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
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl w-full">
              {/* Left Side - Illustration */}
              <div className="w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 p-12 flex flex-col justify-center">
                <div className="text-center mb-8">
                  <div className="relative mb-8">
                    <div className="w-80 h-80 mx-auto relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full"></div>
                      <div className="absolute inset-8 bg-gradient-to-br from-yellow-400 to-orange-300 rounded-full flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-2xl mb-2">💼</div>
                          <div className="text-sm font-medium">Best college fresh talents</div>
                        </div>
                      </div>
                      {/* Chat bubbles */}
                      <div className="absolute top-12 right-8 bg-blue-500 rounded-full p-3">
                        <div className="text-white text-sm">👥</div>
                      </div>
                      <div className="absolute top-24 right-4 bg-red-500 rounded-full p-2">
                        <div className="text-white text-xs">❤</div>
                      </div>
                      <div className="absolute bottom-16 left-8 bg-purple-500 rounded-full p-3">
                        <div className="text-white text-sm">💬</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    Hire interns & <span className="text-blue-600">fresh</span><br />
                    <span className="text-blue-600">graduates</span>
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Connect with job-ready students from verified<br />
                    colleges—faster, smarter.
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
                  <button 
                    onClick={() => router.push('/register/student')}
                    className="flex-1 py-2 px-4 text-sm text-gray-600 rounded-lg transition-colors"
                  >
                    Student
                  </button>
                  <button className="flex-1 py-2 px-4 text-sm bg-white text-blue-600 rounded-lg shadow-sm font-medium">
                    College
                  </button>
                  <button 
                    onClick={() => router.push('/register/company')}
                    className="flex-1 py-2 px-4 text-sm text-gray-600 rounded-lg transition-colors"
                  >
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
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center bg-blue-50">
                  {logoPreview ? (
                    <div className="mb-4">
                      <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden border-2 border-gray-200">
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview('');
                          setFormData(prev => ({ ...prev, logoFile: null }));
                        }}
                        className="mt-2 text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mb-2">Upload PNG, JPEG (max 5MB)*</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    id="logoUpload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          setError('File size should be less than 5MB');
                          return;
                        }
                        
                        // Create preview URL
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setLogoPreview(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                        
                        setFormData(prev => ({ ...prev, logoFile: file }));
                        setError('');
                      }
                    }}
                  />
                  <label
                    htmlFor="logoUpload"
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    {formData.logoFile ? 'Change Logo' : 'Upload College Logo*'}
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                    readOnly={!!router.query.verified_name}
                    style={router.query.verified_name ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College establish year*</label>
                  <input
                    name="establishedYear"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    placeholder="Enter establishment year (e.g. 1985)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.establishedYear}
                    onChange={handleInputChange}
                    required
                  />
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
                    readOnly={!!router.query.verified_email}
                    style={router.query.verified_email ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed' } : {}}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recognized by*</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter recognized by"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={recognizedBySearch}
                      onChange={(e) => setRecognizedBySearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const value = recognizedBySearch.trim();
                          if (value) {
                            const current = formData.recognizedByOther ? formData.recognizedByOther.split(',').map(s => s.trim()).filter(s => s) : [];
                            if (!current.includes(value)) {
                              setFormData(prev => ({ 
                                ...prev, 
                                recognizedBy: 'Other',
                                recognizedByOther: [...current, value].join(', ')
                              }));
                            }
                            setRecognizedBySearch('');
                          }
                        }
                      }}
                    />
                    
                    {/* Dropdown suggestions */}
                    {recognizedBySearch && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg">
                        {['UGC', 'AICTE', 'MCI', 'DCI', 'BCI', 'NCTE', 'ICAR']
                          .filter(option => option.toLowerCase().includes(recognizedBySearch.toLowerCase()))
                          .map(option => (
                            <div
                              key={option}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                              onClick={() => {
                                const current = formData.recognizedByOther ? formData.recognizedByOther.split(',').map(s => s.trim()).filter(s => s) : [];
                                if (!current.includes(option)) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    recognizedBy: 'Other',
                                    recognizedByOther: [...current, option].join(', ')
                                  }));
                                }
                                setRecognizedBySearch('');
                              }}
                            >
                              {option}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                  
                  {/* Selected tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.recognizedByOther && formData.recognizedByOther.split(',').map(tag => tag.trim()).filter(tag => tag).map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const current = formData.recognizedByOther.split(',').map(s => s.trim()).filter(s => s);
                            const updated = current.filter(t => t !== tag);
                            setFormData(prev => ({ 
                              ...prev, 
                              recognizedByOther: updated.join(', '),
                              recognizedBy: updated.length > 0 ? 'Other' : ''
                            }));
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
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
                    <option value="Private College">Private College</option>
                    <option value="Aided College">Aided College</option>
                    <option value="Autonomous College">Autonomous College</option>
                    <option value="Deemed University">Deemed University</option>
                    <option value="State University">State University</option>
                    <option value="Central University">Central University</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College Website</label>
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
                  <select
                    name="affiliatedTo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.affiliatedTo}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Visvesvaraya Technological University">Visvesvaraya Technological University</option>
                    <option value="Banglore Central University">Banglore Central University</option>
                    <option value="Banglore University">Banglore University</option>
                    <option value="Gulbarga University">Gulbarga University</option>
                    <option value="Karnataka University">Karnataka University</option>
                    <option value="Mysore University">Mysore University</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {formData.affiliatedTo === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Affiliated University Name*</label>
                    <input
                      name="affiliatedUniversityName"
                      type="text"
                      placeholder="Enter Your University Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.affiliatedUniversityName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">About the college*</label>
                <textarea
                  name="aboutCollege"
                  rows={6}
                  placeholder="Enter about your college (minimum 50 characters)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.aboutCollege}
                  onChange={handleInputChange}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500">
                    {formData.aboutCollege.length} characters 
                    {formData.aboutCollege.length < 50 && (
                      <span className="text-red-500"> (minimum 50 required)</span>
                    )}
                  </span>
                </div>
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
                    <input
                      name="city"
                      type="text"
                      placeholder="City will auto-fill from pincode"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
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
                      <select
                        name="coordinatorDesignation"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.coordinatorDesignation}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Principal">Principal</option>
                        <option value="Vice Principal">Vice Principal</option>
                        <option value="Dean">Dean</option>
                        <option value="Admission Officer">Admission Officer</option>
                        <option value="Admin Head">Admin Head</option>
                        <option value="Training Placement Officer">Training Placement Officer</option>
                        <option value="Other">Other</option>
                      </select>
                      {formData.coordinatorDesignation === 'Other' && (
                        <div className="mt-2">
                          <input
                            name="coordinatorDesignationOther"
                            type="text"
                            placeholder="Enter designation"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.coordinatorDesignationOther}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      )}
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
                        onClick={sendMobileOTP}
                        disabled={loading || !formData.mobile}
                        className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Get OTP'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start space-x-3">
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          name="whatsappOptIn"
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.whatsappOptIn}
                          onChange={handleInputChange}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        <span className={`ml-2 text-sm font-medium px-2 py-1 rounded ${formData.whatsappOptIn ? 'text-white bg-green-500' : 'text-gray-600 bg-gray-200'}`}>
                          {formData.whatsappOptIn ? 'ON' : 'OFF'}
                        </span>
                      </label>
                    </div>
                    <span className="text-sm text-gray-600 flex-1">
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

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {otpModalType === 'email' ? 'Verification code' : 'Verify your number'}
              </h2>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 text-center mb-8">
              {otpModalType === 'email' 
                ? 'Enter the 6 digits code that we have send through your email' 
                : 'Enter 6-digits code we sent to your mobile number'
              }
            </p>
            
            <div className="flex justify-center space-x-3 mb-8">
              {Array.from({ length: otpModalType === 'email' ? 6 : 6 }).map((_, index) => (
                <input
                  key={index}
                  ref={el => {
                    if (el) otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  className="w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:border-blue-500"
                  value={
                    otpModalType === 'email' 
                      ? formData.emailOtp[index] || '' 
                      : formData.mobileOtp[index] || ''
                  }
                  onChange={(e) => handleOtpInput(index, e.target.value, otpModalType)}
                />
              ))}
            </div>
            
            <button
              onClick={otpModalType === 'email' ? verifyEmailOTP : verifyMobileOTP}
              disabled={
                loading || 
                (otpModalType === 'email' ? formData.emailOtp.length !== 6 : formData.mobileOtp.length !== 6)
              }
              className="w-full bg-gray-400 text-white py-3 rounded-full font-medium disabled:opacity-50 hover:bg-gray-500 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            
            <p className="text-center text-sm text-gray-600 mt-4">
              Did not receive code?{' '}
              {otpTimer > 0 ? (
                <span className="text-blue-600">Resend in {formatTime(otpTimer)}</span>
              ) : (
                <button
                  onClick={otpModalType === 'email' ? sendEmailOTP : sendMobileOTP}
                  className="text-blue-600 hover:underline"
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
