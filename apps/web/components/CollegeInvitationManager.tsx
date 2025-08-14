import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5001/api';

interface Invitation {
  id: string;
  job: {
    id: string;
    title: string;
    companyName: string;
    description: string;
    salary: {
      min: number;
      max: number;
      currency: string;
    };
    applicationDeadline: string;
    locations: string[];
  };
  recruiter: {
    id: string;
    companyInfo: {
      name: string;
      industry: string;
    };
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  status: 'pending' | 'accepted' | 'declined' | 'negotiating' | 'expired';
  sentAt: string;
  respondedAt?: string;
  expiresAt: string;
  proposedDates: string[];
  campusVisitWindow?: {
    startDate: string;
    endDate: string;
  };
  invitationMessage: string;
  eligibilityCriteria: {
    departments: string[];
    minimumCgpa: number;
    allowedBatches: string[];
    skills: string[];
  };
  negotiationHistory: Array<{
    timestamp: string;
    actor: string;
    action: string;
    details: string;
  }>;
}

interface CollegeInvitationManagerProps {
  onRefresh?: () => void;
}

const CollegeInvitationManager: React.FC<CollegeInvitationManagerProps> = ({ onRefresh }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [campusWindow, setCampusWindow] = useState({ startDate: '', endDate: '' });
  const [responseMessage, setResponseMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'accept' | 'decline'>('view');

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/colleges/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.data.invitations);
      } else {
        console.error('Failed to fetch invitations');
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!campusWindow.startDate || !campusWindow.endDate) {
      alert('Please select campus visit dates');
      return;
    }

    setActionLoading(invitationId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/colleges/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campusVisitWindow: campusWindow,
          tpoMessage: responseMessage,
        }),
      });

      if (response.ok) {
        await fetchInvitations();
        setShowModal(false);
        setCampusWindow({ startDate: '', endDate: '' });
        setResponseMessage('');
        if (onRefresh) onRefresh();
        alert('Invitation accepted successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    if (!responseMessage) {
      alert('Please provide a reason for declining');
      return;
    }

    setActionLoading(invitationId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/colleges/invitations/${invitationId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: responseMessage,
        }),
      });

      if (response.ok) {
        await fetchInvitations();
        setShowModal(false);
        setResponseMessage('');
        if (onRefresh) onRefresh();
        alert('Invitation declined successfully');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      accepted: 'bg-green-100 text-green-800 border-green-300',
      declined: 'bg-red-100 text-red-800 border-red-300',
      negotiating: 'bg-blue-100 text-blue-800 border-blue-300',
      expired: 'bg-gray-100 text-gray-800 border-gray-300',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSalary = (salary: any) => {
    if (!salary) return 'Not specified';
    const { min, max, currency = 'INR' } = salary;
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    return `${currency} ${(min || max || 0).toLocaleString()}`;
  };

  const openModal = (invitation: Invitation, mode: 'view' | 'accept' | 'decline') => {
    setSelectedInvitation(invitation);
    setModalMode(mode);
    setShowModal(true);
    if (mode === 'accept') {
      // Set default dates if proposed dates exist
      if (invitation.proposedDates.length > 0) {
        const firstDate = new Date(invitation.proposedDates[0]);
        const lastDate = new Date(invitation.proposedDates[invitation.proposedDates.length - 1]);
        setCampusWindow({
          startDate: firstDate.toISOString().split('T')[0],
          endDate: lastDate.toISOString().split('T')[0],
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Job Invitations</h3>
        <div className="text-center py-8">Loading invitations...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Job Invitations ({invitations.length})</h3>
        <button
          onClick={fetchInvitations}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No job invitations found
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{invitation.job.title}</h4>
                  <p className="text-gray-600">{invitation.job.companyName}</p>
                </div>
                {getStatusBadge(invitation.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                <div>💰 {formatSalary(invitation.job.salary)}</div>
                <div>📅 Deadline: {formatDate(invitation.job.applicationDeadline)}</div>
                <div>📍 {invitation.job.locations.join(', ')}</div>
                <div>🕒 Received: {formatDate(invitation.sentAt)}</div>
              </div>

              {invitation.eligibilityCriteria && (
                <div className="mb-4 text-sm">
                  <strong>Eligibility:</strong>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {invitation.eligibilityCriteria.departments?.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        Departments: {invitation.eligibilityCriteria.departments.join(', ')}
                      </span>
                    )}
                    {invitation.eligibilityCriteria.minimumCgpa && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        Min CGPA: {invitation.eligibilityCriteria.minimumCgpa}
                      </span>
                    )}
                    {invitation.eligibilityCriteria.allowedBatches?.length > 0 && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                        Batches: {invitation.eligibilityCriteria.allowedBatches.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={() => openModal(invitation, 'view')}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  View Details
                </button>

                {invitation.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal(invitation, 'accept')}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => openModal(invitation, 'decline')}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      ✗ Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedInvitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedInvitation.job.title} - Invitation Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Job Description</h4>
                <p className="text-sm text-gray-600">{selectedInvitation.job.description}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Invitation Message</h4>
                <p className="text-sm text-gray-600">{selectedInvitation.invitationMessage}</p>
              </div>

              {selectedInvitation.proposedDates.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Proposed Visit Dates</h4>
                  <div className="text-sm text-gray-600">
                    {selectedInvitation.proposedDates.map((date, index) => (
                      <div key={index}>• {formatDate(date)}</div>
                    ))}
                  </div>
                </div>
              )}

              {modalMode === 'accept' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">Accept Invitation</h4>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Campus Visit Window *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={campusWindow.startDate}
                        onChange={(e) => setCampusWindow(prev => ({ ...prev, startDate: e.target.value }))}
                        className="border rounded px-3 py-2"
                        placeholder="Start Date"
                      />
                      <input
                        type="date"
                        value={campusWindow.endDate}
                        onChange={(e) => setCampusWindow(prev => ({ ...prev, endDate: e.target.value }))}
                        className="border rounded px-3 py-2"
                        placeholder="End Date"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                      placeholder="Add any comments or requirements..."
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptInvitation(selectedInvitation.id)}
                      disabled={actionLoading === selectedInvitation.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === selectedInvitation.id ? 'Accepting...' : 'Confirm Accept'}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalMode === 'decline' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">Decline Invitation</h4>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reason for Declining *
                    </label>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                      placeholder="Please provide a reason for declining..."
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeclineInvitation(selectedInvitation.id)}
                      disabled={actionLoading === selectedInvitation.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === selectedInvitation.id ? 'Declining...' : 'Confirm Decline'}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {selectedInvitation.negotiationHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Communication History</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedInvitation.negotiationHistory.map((entry, index) => (
                      <div key={index} className="text-sm border-l-2 border-gray-200 pl-3">
                        <div className="font-medium">
                          {entry.actor} - {entry.action}
                        </div>
                        <div className="text-gray-600">{entry.details}</div>
                        <div className="text-xs text-gray-400">
                          {formatDate(entry.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeInvitationManager;
