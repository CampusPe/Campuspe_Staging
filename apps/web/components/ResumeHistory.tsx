import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';

interface ResumeHistoryItem {
  resumeId: string;
  jobDescription: string;
  jobTitle?: string;
  resumeData: any;
  fileName: string;
  generatedAt: string;
  matchScore?: number;
  downloadCount: number;
  whatsappSharedCount: number;
  status: string;
}

interface ResumeStats {
  totalResumes: number;
  totalDownloads: number;
  totalWhatsAppShares: number;
  avgMatchScore: number;
  lastGenerated: string;
}

interface ResumeHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResumeHistory: React.FC<ResumeHistoryProps> = ({ isOpen, onClose }) => {
  const [resumeHistory, setResumeHistory] = useState<ResumeHistoryItem[]>([]);
  const [stats, setStats] = useState<ResumeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showShareModal, setShowShareModal] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchResumeHistory();
    }
  }, [isOpen]);

  const fetchResumeHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/generated-resume/history');
      
      if (response.data.success) {
        setResumeHistory(response.data.data.resumes);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching resume history:', error);
    } finally {
      setLoading(false);
    }
  };

    const downloadResume = async (resume: ResumeHistoryItem) => {
    try {
      const response = await apiClient.get(`/api/generated-resume/${resume.resumeId}/download`, {
        responseType: 'blob'
      });

      // Create blob URL for download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Refresh history to update download count
      fetchResumeHistory();
    } catch (error) {
      console.error('Error downloading resume:', error);
      alert('Failed to download resume');
    }
  };

    const shareOnWhatsApp = async () => {
    if (!phoneNumber || !showShareModal) return;

    try {
      setSharing(showShareModal);
      
      // Use the new WABB-compatible endpoint
      const response = await apiClient.post('/api/generated-resume/wabb-send-document', {
        resumeId: showShareModal,
        number: phoneNumber
      });

      if (response.data.success) {
        alert('Resume shared on WhatsApp successfully!');
        setShowShareModal(null);
        setPhoneNumber('');
        // Refresh history to update share count
        fetchResumeHistory();
      }
    } catch (error) {
      console.error('Error sharing on WhatsApp:', error);
      alert('Failed to share resume on WhatsApp');
    } finally {
      setSharing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Resume History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Statistics Section */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.totalResumes}</div>
              <div className="text-sm text-gray-600">Total Resumes</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalDownloads}</div>
              <div className="text-sm text-gray-600">Downloads</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.totalWhatsAppShares}</div>
              <div className="text-sm text-gray-600">WhatsApp Shares</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.avgMatchScore}%</div>
              <div className="text-sm text-gray-600">Avg Match Score</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : resumeHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No resume history found. Generate your first AI resume to see it here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resumeHistory.map((resume) => (
              <div key={resume.resumeId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {resume.jobTitle || 'Resume'}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Generated on {formatDate(resume.generatedAt)}
                    </p>
                    <p className="text-gray-700 mt-2 line-clamp-2">
                      {resume.jobDescription.substring(0, 150)}...
                    </p>
                    {resume.matchScore && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {resume.matchScore}% Match
                        </span>
                      </div>
                    )}
                    
                    {/* Additional stats */}
                    <div className="mt-3 flex space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        📥 {resume.downloadCount} downloads
                      </span>
                      <span className="flex items-center">
                        📱 {resume.whatsappSharedCount} shares
                      </span>
                      <span className="flex items-center capitalize">
                        📄 {resume.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => downloadResume(resume)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                      📥 Download PDF
                    </button>
                    
                    <button
                      onClick={() => setShowShareModal(resume.resumeId)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      📱 Share WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WhatsApp Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Share on WhatsApp</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (with country code)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., +919156621088"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include country code (e.g., +91 for India)
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => shareOnWhatsApp()}
                  disabled={sharing === showShareModal}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {sharing === showShareModal ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sharing...
                    </span>
                  ) : (
                    'Share Resume'
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setShowShareModal(null);
                    setPhoneNumber('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeHistory;
