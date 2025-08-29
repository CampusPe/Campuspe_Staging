'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api';

interface ApprovalStatusProps {
  userRole: 'college' | 'recruiter';
  onStatusChange?: (status: string) => void;
}

interface StatusData {
  approvalStatus: string;
  isActive: boolean;
  rejectionReason?: string;
  resubmissionNotes?: string;
  submittedDocuments?: string[];
  name?: string;
  companyInfo?: {
    name: string;
  };
}

export default function ApprovalStatus({ userRole, onStatusChange }: ApprovalStatusProps) {
  const router = useRouter();
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resubmissionMessage, setResubmissionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      console.log('ApprovalStatus - fetching status for:', { userRole, userId });
      
      if (!token || !userId) {
        console.error('ApprovalStatus - Missing token or userId:', { token: !!token, userId });
        router.push('/login');
        return;
      }

      const endpoint = userRole === 'college' 
        ? `${API_BASE_URL}/api/colleges/user/${userId}`
        : `${API_BASE_URL}/api/recruiters/user/${userId}`;

      console.log('ApprovalStatus - Making API call to:', endpoint);

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('ApprovalStatus - API response:', response.data);
      setStatusData(response.data);
      
      if (onStatusChange) {
        onStatusChange(response.data.approvalStatus);
      }
    } catch (err: any) {
      console.error('ApprovalStatus - API error:', err);
      console.error('ApprovalStatus - Error response:', err.response?.data);
      console.error('ApprovalStatus - Error status:', err.response?.status);
      setError(err.response?.data?.message || `Failed to fetch ${userRole} status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResubmission = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const endpoint = userRole === 'college'
        ? `${API_BASE_URL}/api/colleges/resubmit`
        : `${API_BASE_URL}/api/recruiters/resubmit`;

      await axios.post(endpoint, {
        resubmissionNotes: resubmissionMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchStatus(); // Refresh status
      setResubmissionMessage('');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Resubmission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const goToDashboard = () => {
    if (userRole === 'college') {
      router.push('/dashboard/college');
    } else {
      router.push('/dashboard/recruiter');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking approval status...</span>
      </div>
    );
  }

  if (error && !statusData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
  <div className="max-w-md w-full">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-2">
      <h3 className="text-sm font-medium text-red-800 mb-1">Error</h3>
      <p className="text-red-600 mb-2">{error}</p>
      <button
        onClick={fetchStatus}
        className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  </div>
</div>


    );
  }

  if (!statusData) {
    return null;
  }

  const entityName = statusData.name || statusData.companyInfo?.name || (userRole === 'college' ? 'College' : 'Company');

  // Only show this component for pending, rejected, or inactive users
  // If approved and active, this component shouldn't be shown (handled by ProtectedRoute)
  if (statusData.approvalStatus === 'approved' && statusData.isActive) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-12 text-center">
          {/* Status Header with Icons */}
          <div className="mb-8">
            {statusData.approvalStatus === 'pending' && (
              <>
                <div className="mx-auto mb-6 w-48 h-48">
                  {/* Verification in Progress Illustration */}
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20"></div>
                    <div className="absolute inset-4 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-2xl text-white">📋</span>
                        </div>
                        <div className="animate-pulse text-blue-600 text-xs">Processing...</div>
                      </div>
                    </div>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification in Progress</h1>
                <p className="text-gray-600 text-lg mb-6">We're reviewing your details.</p>
                <div className="bg-blue-50 rounded-lg p-6 mb-8">
                  <h2 className="text-xl font-semibold text-blue-900 mb-4">Thank you for providing us the information</h2>
                  <p className="text-blue-700 mb-4">Your account is under verification.</p>
                  <p className="text-blue-600 text-sm">Our team will reach out shortly to confirm the information.</p>
                </div>
                <button
                  onClick={fetchStatus}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Check Status
                </button>
              </>
            )}
            
            {statusData.approvalStatus === 'rejected' && (
              <>
                <div className="mx-auto mb-6 w-48 h-48">
                  {/* Verification Failed Illustration */}
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-20"></div>
                    <div className="absolute inset-4 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2 bg-red-500 rounded-full flex items-center justify-center relative">
                          <span className="text-2xl text-white">📄</span>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">✕</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification Failed !</h1>
                <p className="text-gray-600 text-lg mb-8">Unfortunately your verification is failed.</p>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 mb-8">
                  <h2 className="text-2xl font-bold text-red-800 mb-6">Rejected.</h2>
                  <p className="text-red-700 mb-4">Your application is rejected.</p>
                  {statusData.rejectionReason && (
                    <p className="text-red-600 mb-6">Reason: {statusData.rejectionReason}</p>
                  )}
                  <p className="text-red-600 mb-6">Do you want to make a reverify request?</p>
                  <button
                    onClick={() => setError('reverify-form')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Reverify Request
                  </button>
                </div>

                {error === 'reverify-form' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-blue-800 mb-6">Reverification !</h2>
                    <p className="text-blue-700 mb-6">Provide required details and documents to reverify your college.</p>
                    
                    <div className="text-left space-y-6">
                      <div>
                        <label className="block text-blue-800 font-medium mb-2">Reason for Reverify</label>
                        <textarea
                          value={resubmissionMessage}
                          onChange={(e) => setResubmissionMessage(e.target.value)}
                          placeholder="Please explain why your application should be reconsidered..."
                          rows={4}
                          className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-blue-800 font-medium mb-2">Upload Supporting Document</label>
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50">
                          <div className="mb-4">
                            <span className="text-4xl text-blue-400">☁</span>
                          </div>
                          <p className="text-blue-700 font-medium mb-2">Choose a file or drag & drop it here</p>
                          <p className="text-blue-500 text-sm mb-4">JPEG, PNG, PDF, and MP4 formats, up to 50MB</p>
                          <button className="bg-white border border-blue-300 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50">
                            Browse File
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <button
                          onClick={() => setError(null)}
                          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleResubmission}
                          disabled={submitting || !resubmissionMessage.trim()}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submitting ? 'Submitting...' : 'Submit Verify Request'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {!statusData.isActive && statusData.approvalStatus === 'approved' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-2">Account Deactivated</h3>
                <p className="text-gray-700 text-sm mb-4">
                  Your account has been temporarily deactivated by our admin team. 
                  Please contact support for assistance or to request reactivation.
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <a 
                    href="mailto:support@campuspe.com" 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Contact Support
                  </a>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">support@campuspe.com</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
