import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';

const InvitationDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchInvitation = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await axios.get(`http://localhost:5001/api/invitations/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data?.data?.invitation) {
          setInvitation(response.data.data.invitation);
        } else {
          setError('Invitation not found');
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [id, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Loading invitation details...</div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-red-600 text-lg">{error}</div>
    </div>
  );
  
  if (!invitation) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Invitation not found</div>
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="border-b pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Invitation Details</h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                invitation.status === 'declined' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {invitation.status.toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">ID: {invitation.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Job Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg text-gray-900">{invitation.job?.title}</h3>
                <p className="text-gray-600 mt-1">{invitation.job?.companyName}</p>
                <p className="text-gray-600 mt-2">{invitation.job?.description}</p>
                
                {invitation.job?.salary && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700">Salary: </span>
                    <span className="text-green-600">
                      {invitation.job.salary.currency} {invitation.job.salary.min?.toLocaleString()} - {invitation.job.salary.max?.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {invitation.job?.applicationDeadline && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">Application Deadline: </span>
                    <span className="text-gray-600">{formatDate(invitation.job.applicationDeadline)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg text-gray-900">{invitation.recruiter?.companyInfo?.name}</h3>
                <p className="text-gray-600">{invitation.recruiter?.companyInfo?.industry}</p>
                <div className="mt-3">
                  <span className="text-sm font-medium text-gray-700">Contact: </span>
                  <span className="text-gray-600">
                    {invitation.recruiter?.profile?.firstName} {invitation.recruiter?.profile?.lastName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Invitation Details</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Sent: </span>
                  <span className="text-gray-600">{formatDate(invitation.sentAt)}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Expires: </span>
                  <span className="text-gray-600">{formatDate(invitation.expiresAt)}</span>
                </div>
                {invitation.respondedAt && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Responded: </span>
                    <span className="text-gray-600">{formatDate(invitation.respondedAt)}</span>
                  </div>
                )}
              </div>
              
              {invitation.invitationMessage && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-700">Message: </span>
                  <p className="text-gray-600 mt-1">{invitation.invitationMessage}</p>
                </div>
              )}
            </div>

            {/* Proposed Dates */}
            {invitation.proposedDates && invitation.proposedDates.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Proposed Campus Visit Dates</h3>
                <div className="space-y-2">
                  {invitation.proposedDates.map((dateObj, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-gray-600">
                        {formatDate(dateObj.startDate)} - {formatDate(dateObj.endDate)}
                      </span>
                      {dateObj.isFlexible && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Flexible</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiation History */}
            {invitation.negotiationHistory && invitation.negotiationHistory.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-3">
                  {invitation.negotiationHistory.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 capitalize">{item.actor}</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-600 capitalize">{item.action}</span>
                          <span className="text-sm text-gray-500">{formatDate(item.timestamp)}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
            
            {invitation.status === 'pending' && (
              <>
                <button
                  onClick={() => router.push(`/dashboard/college?tab=invitations`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Respond to Invitation
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationDetails;