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
  
  // Additional state for document resubmission
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [resubmissionNotes, setResubmissionNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      console.log('ApprovalStatus - Rejection reason:', response.data.rejectionReason);
      console.log('ApprovalStatus - Resubmission notes:', response.data.resubmissionNotes);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

    const handleResubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resubmissionNotes.trim()) {
      setError('Please provide resubmission notes');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log('Starting resubmission with notes:', resubmissionNotes);
      console.log('Selected files:', selectedFiles.length);

      // Upload documents if any are selected
      let uploadedDocuments: string[] = [];
      if (selectedFiles.length > 0) {
        console.log('Uploading documents...');
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('documents', file);
        });
        formData.append('notes', resubmissionNotes);

        // Use the appropriate endpoint based on user role
        const uploadUrl = `${API_BASE_URL}/api/files/${userRole}/reverification-documents`;
        console.log('Upload URL:', uploadUrl);
        console.log('User role:', userRole);

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        console.log('Upload response status:', uploadResponse.status);
        const uploadResult = await uploadResponse.json();
        console.log('Upload result:', uploadResult);
        
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.message || 'Failed to upload documents');
        }

        uploadedDocuments = uploadResult.uploadResults?.map((result: any) => result.url).filter(Boolean) || [];
        console.log('Uploaded documents URLs:', uploadedDocuments);
      }

      // Submit resubmission with or without documents
      const resubmissionData = {
        resubmissionNotes,
        uploadedDocuments
      };

      console.log('Submitting resubmission data:', resubmissionData);
      const resubmitUrl = `${API_BASE_URL}/api/${userRole}s/resubmit`;
      console.log('Resubmit URL:', resubmitUrl);

      const response = await fetch(resubmitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(resubmissionData)
      });

      console.log('Resubmit response status:', response.status);
      const result = await response.json();
      console.log('Resubmit result:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to resubmit application');
      }

      // Reset form and update parent component
      setResubmissionNotes('');
      setSelectedFiles([]);
      setShowResubmitForm(false);
      setError(null);
      
      // Show success message
      alert('Application resubmitted successfully! Your status has been updated to pending.');
      
      // Refresh the status data
      await fetchStatus();
      
    } catch (error: any) {
      console.error('Resubmission error:', error);
      setError(error.message || 'Failed to resubmit application');
    } finally {
      setIsSubmitting(false);
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
                <div className="mx-auto mb-8 w-80 h-64">
                  {/* Verification in Progress Illustration - Hourglass with people */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Background decorative elements */}
                    <div className="absolute top-4 left-8 w-2 h-2 bg-blue-300 rounded-full"></div>
                    <div className="absolute top-12 right-12 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                    <div className="absolute bottom-8 left-16 w-1 h-1 bg-green-300 rounded-full"></div>
                    <div className="absolute bottom-16 right-8 w-2 h-2 bg-purple-300 rounded-full"></div>
                    
                    {/* Main hourglass illustration */}
                    <div className="relative">
                      {/* Person sitting on top */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                        <div className="w-8 h-8 bg-blue-400 rounded-full mb-1"></div>
                        <div className="w-10 h-12 bg-blue-500 rounded-lg"></div>
                        <div className="w-6 h-8 bg-blue-600 rounded-sm mx-auto"></div>
                      </div>
                      
                      {/* Hourglass */}
                      <div className="relative w-20 h-32 mx-auto">
                        <div className="w-full h-14 bg-gradient-to-b from-blue-100 to-blue-200 rounded-t-lg border-2 border-blue-300"></div>
                        <div className="w-full h-4 bg-gradient-to-r from-blue-200 to-yellow-300 flex items-center justify-center">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                        </div>
                        <div className="w-full h-14 bg-gradient-to-t from-yellow-300 to-yellow-400 rounded-b-lg border-2 border-blue-300"></div>
                      </div>
                      
                      {/* People around hourglass */}
                      <div className="absolute -left-16 top-8">
                        <div className="w-6 h-6 bg-purple-400 rounded-full mb-1"></div>
                        <div className="w-8 h-10 bg-purple-500 rounded-lg"></div>
                        <div className="w-4 h-6 bg-purple-600 rounded-sm mx-auto"></div>
                      </div>
                      
                      <div className="absolute -right-16 top-12">
                        <div className="w-6 h-6 bg-green-400 rounded-full mb-1"></div>
                        <div className="w-8 h-10 bg-green-500 rounded-lg"></div>
                        <div className="w-4 h-6 bg-green-600 rounded-sm mx-auto"></div>
                      </div>
                      
                      {/* Gear/settings icon */}
                      <div className="absolute -bottom-4 -left-8 w-6 h-6 bg-orange-400 rounded-sm flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                      </div>
                      
                      {/* Lock icon */}
                      <div className="absolute -bottom-2 -right-8 w-5 h-6 bg-yellow-500 rounded-sm flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification in Progress</h1>
                <p className="text-gray-600 text-lg mb-8">We're reviewing your details.</p>
                
                <h2 className="text-2xl font-semibold text-blue-600 mb-4">Your Application is under review.</h2>
                <p className="text-gray-700 mb-2">Your account is under verification.</p>
                <p className="text-gray-600 text-sm mb-8">Our team will reach out shortly to confirm the information.</p>
                
                <button
                  onClick={fetchStatus}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Pending Review
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
                  <h2 className="text-2xl font-bold text-red-800 mb-6">Application Rejected</h2>
                  <p className="text-red-700 mb-4">Your {userRole} application has been rejected by our admin team.</p>
                  
                  {statusData.rejectionReason ? (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-red-800 mb-2">Rejection Reason:</h3>
                      <p className="text-red-700">{statusData.rejectionReason}</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-yellow-800 mb-2">No Rejection Reason Provided</h3>
                      <p className="text-yellow-700">The admin did not provide a specific reason for rejection. Please contact support for more details.</p>
                    </div>
                  )}

                  {statusData.resubmissionNotes && (
                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-blue-800 mb-2">Your Last Resubmission Notes:</h3>
                      <p className="text-blue-700">{statusData.resubmissionNotes}</p>
                    </div>
                  )}

                  {statusData.submittedDocuments && statusData.submittedDocuments.length > 0 && (
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">Previously Submitted Documents:</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {statusData.submittedDocuments.map((doc, index) => (
                          <button
                            key={index}
                            onClick={() => window.open(doc, '_blank')}
                            className="p-2 bg-white border border-gray-300 rounded text-sm text-blue-600 hover:bg-blue-50"
                          >
                            Document {index + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-red-600 mb-6">Would you like to make a reverification request with the necessary changes?</p>
                  <button
                    onClick={() => setShowResubmitForm(true)}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Start Reverification
                  </button>
                </div>

                {showResubmitForm && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-blue-800 mb-6">Reverification</h2>
                    <p className="text-blue-700 mb-6">Provide required details and documents to reverify your {userRole}.</p>
                    
                    <form onSubmit={handleResubmission} className="text-left space-y-6">
                      <div>
                        <label className="block text-blue-800 font-medium mb-2">Reason for Reverify <span className="text-red-500">*</span></label>
                        <textarea
                          value={resubmissionNotes}
                          onChange={(e) => setResubmissionNotes(e.target.value)}
                          placeholder="Please explain how you've addressed the rejection reasons and what changes you've made..."
                          rows={4}
                          className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-blue-800 font-medium mb-2">Upload Supporting Documents</label>
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="mb-4">
                              <span className="text-4xl text-blue-400">☁</span>
                            </div>
                            <p className="text-blue-700 font-medium mb-2">Choose files or drag & drop them here</p>
                            <p className="text-blue-500 text-sm mb-4">PDF, DOC, DOCX, JPG, PNG formats (Max 5 files)</p>
                            <button type="button" className="bg-white border border-blue-300 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50">
                              Browse Files
                            </button>
                          </label>
                        </div>
                        
                        {selectedFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-blue-800">Selected Files:</p>
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-blue-200">
                                <span className="text-sm text-gray-700">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700 ml-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded">
                          {error}
                        </div>
                      )}
                      
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowResubmitForm(false);
                            setResubmissionNotes('');
                            setSelectedFiles([]);
                            setError(null);
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !resubmissionNotes.trim()}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Verify Request'}
                        </button>
                      </div>
                    </form>
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
