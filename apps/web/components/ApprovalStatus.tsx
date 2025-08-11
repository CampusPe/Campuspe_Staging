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
      
      if (!token || !userId) {
        router.push('/login');
        return;
      }

      const endpoint = userRole === 'college' 
        ? `${API_BASE_URL}/api/colleges/user/${userId}`
        : `${API_BASE_URL}/api/recruiters/user/${userId}`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatusData(response.data);
      
      if (onStatusChange) {
        onStatusChange(response.data.approvalStatus);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch status');
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchStatus}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!statusData) {
    return null;
  }

  const entityName = statusData.name || statusData.companyInfo?.name || (userRole === 'college' ? 'College' : 'Company');

  // If approved and active, don't show the component
  if (statusData.approvalStatus === 'approved' && statusData.isActive) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg">
        <div className="p-8">
          {/* Status Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              {statusData.approvalStatus === 'pending' && (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                  <span className="text-3xl">⏳</span>
                </div>
              )}
              {statusData.approvalStatus === 'rejected' && (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <span className="text-3xl">❌</span>
                </div>
              )}
              {!statusData.isActive && statusData.approvalStatus === 'approved' && (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <span className="text-3xl">🚫</span>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {statusData.approvalStatus === 'pending' && 'Approval Pending'}
              {statusData.approvalStatus === 'rejected' && 'Application Rejected'}
              {!statusData.isActive && statusData.approvalStatus === 'approved' && 'Account Deactivated'}
            </h1>
            
            <p className="text-gray-600">
              {entityName}
            </p>
          </div>

          {/* Status Content */}
          <div className="space-y-6">
            {statusData.approvalStatus === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-800 mb-2">Your application is under review</h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Our admin team is reviewing your {userRole} registration. This typically takes 1-3 business days.
                </p>
                <div className="flex items-center text-sm text-yellow-600">
                  <span className="animate-pulse mr-2">●</span>
                  We'll notify you via email once the review is complete
                </div>
              </div>
            )}

            {statusData.approvalStatus === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="font-semibold text-red-800 mb-2">Application Rejected</h3>
                {statusData.rejectionReason && (
                  <div className="mb-4">
                    <p className="text-sm text-red-700 mb-2">Reason for rejection:</p>
                    <p className="text-red-600 bg-red-100 p-3 rounded border">
                      {statusData.rejectionReason}
                    </p>
                  </div>
                )}
                
                <div className="mt-6">
                  <h4 className="font-medium text-red-800 mb-3">Request Re-review</h4>
                  <p className="text-sm text-red-700 mb-3">
                    You can request a re-review by providing additional information or addressing the concerns mentioned above.
                  </p>
                  
                  <textarea
                    value={resubmissionMessage}
                    onChange={(e) => setResubmissionMessage(e.target.value)}
                    placeholder="Please explain what changes you've made or provide additional information..."
                    rows={4}
                    className="w-full border border-red-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                  />
                  
                  <button
                    onClick={handleResubmission}
                    disabled={submitting || !resubmissionMessage.trim()}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Request Re-review'}
                  </button>
                </div>
              </div>
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-500 hover:text-red-700 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex space-x-4">
                <button
                  onClick={goToDashboard}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={fetchStatus}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
