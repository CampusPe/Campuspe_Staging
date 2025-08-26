import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface Connection {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    userType: 'college' | 'recruiter' | 'student';
    profile?: {
      firstName: string;
      lastName: string;
      designation: string;
    };
    companyInfo?: any;
  };
  target: {
    _id: string;
    name: string;
    email: string;
    userType: 'college' | 'recruiter' | 'student';
    profile?: {
      firstName: string;
      lastName: string;
      designation: string;
    };
    companyInfo?: any;
  };
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
  acceptedAt?: string;
  isRequester?: boolean;
}

interface CollegeConnectionManagerProps {
  onRefresh?: () => void;
}

const CollegeConnectionManager: React.FC<CollegeConnectionManagerProps> = ({ onRefresh }) => {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConnections(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      setActionLoading(connectionId);
      
      // Safety check: Find the connection and verify we're the target
      const connection = connections.find(c => c._id === connectionId);
      if (!connection) {
        console.error('Connection not found:', connectionId);
        return;
      }
      
      if (connection.isRequester) {
        console.error('❌ SAFETY CHECK FAILED: Cannot accept connection where we are the requester');
        console.error('Connection details:', {
          id: connectionId,
          isRequester: connection.isRequester,
          status: connection.status,
          requesterEmail: connection.requester?.email,
          targetEmail: connection.target?.email
        });
        alert('Error: You cannot accept a connection request that you sent.');
        return;
      }
      
      console.log('✅ Accepting connection:', connectionId, 'isRequester:', connection.isRequester);
      
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/connections/${connectionId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh connections
      await fetchConnections();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('Failed to accept connection. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineConnection = async (connectionId: string) => {
    try {
      setActionLoading(connectionId);
      
      // Safety check: Find the connection and verify we're the target
      const connection = connections.find(c => c._id === connectionId);
      if (!connection) {
        console.error('Connection not found:', connectionId);
        return;
      }
      
      if (connection.isRequester) {
        console.error('❌ SAFETY CHECK FAILED: Cannot decline connection where we are the requester');
        console.error('Connection details:', {
          id: connectionId,
          isRequester: connection.isRequester,
          status: connection.status,
          requesterEmail: connection.requester?.email,
          targetEmail: connection.target?.email
        });
        alert('Error: You cannot decline a connection request that you sent.');
        return;
      }
      
      console.log('✅ Declining connection:', connectionId, 'isRequester:', connection.isRequester);
      
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/connections/${connectionId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh connections
      await fetchConnections();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error declining connection:', error);
      alert('Failed to decline connection. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewCompany = (connection: Connection) => {
    // Get the company/recruiter ID from the connection
    const companyUserId = connection.isRequester ? connection.target._id : connection.requester._id;
    
    // Navigate to the company profile page
    router.push(`/profile/company/${companyUserId}`);
  };

  const handleWithdrawConnection = async (connectionId: string) => {
    try {
      setActionLoading(connectionId);
      
      // Safety check: Find the connection and verify we're the requester
      const connection = connections.find(c => c._id === connectionId);
      if (!connection) {
        console.error('Connection not found:', connectionId);
        return;
      }
      
      if (!connection.isRequester) {
        console.error('❌ SAFETY CHECK FAILED: Cannot withdraw connection where we are not the requester');
        console.error('Connection details:', {
          id: connectionId,
          isRequester: connection.isRequester,
          status: connection.status,
          requesterEmail: connection.requester?.email,
          targetEmail: connection.target?.email
        });
        alert('Error: You can only withdraw connection requests that you sent.');
        return;
      }
      
      console.log('✅ Withdrawing connection:', connectionId, 'isRequester:', connection.isRequester);
      
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/connections/${connectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh connections
      await fetchConnections();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error withdrawing connection:', error);
      alert('Failed to withdraw connection. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getConnectionStatus = (connection: Connection) => {
    switch (connection.status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Connected</span>;
      case 'declined':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Declined</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Company Connections</h3>
        <div className="text-center py-8">Loading connections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Company Connections</h3>
        <div className="text-center py-8 text-red-500">{error}</div>
      </div>
    );
  }

  // Separate connections by type
  const incomingRequests = connections.filter(conn => 
    conn.status === 'pending' && !conn.isRequester
  );

  const sentRequests = connections.filter(conn => 
    conn.status === 'pending' && conn.isRequester
  );

  // Debug logging
  console.log('🐛 DEBUG: All connections:', connections.length);
  connections.forEach(conn => {
    console.log(`🐛 Connection ${conn._id}:`, {
      status: conn.status,
      isRequester: conn.isRequester,
      requesterEmail: conn.requester?.email,
      targetEmail: conn.target?.email
    });
  });
  console.log('🐛 Incoming requests (should be empty for problematic conn):', incomingRequests.length);
  console.log('🐛 Sent requests:', sentRequests.length);

  const establishedConnections = connections.filter(conn => conn.status === 'accepted');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Company Connections</h3>
        <button
          onClick={fetchConnections}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Incoming Requests */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Incoming Requests</h4>
        {incomingRequests.length > 0 ? (
          <div className="space-y-3">
            {incomingRequests.map(connection => (
              <div key={connection._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium">
                        {connection.requester?.companyInfo?.name || 
                         `${connection.requester?.profile?.firstName || ''} ${connection.requester?.profile?.lastName || ''}`.trim() ||
                         connection.requester?.email}
                      </h5>
                      {getConnectionStatus(connection)}
                    </div>
                    {connection.requester?.companyInfo?.industry && (
                      <p className="text-sm text-gray-600">{connection.requester.companyInfo.industry}</p>
                    )}
                    {connection.message && (
                      <p className="text-sm text-gray-700 mt-2">"{connection.message}"</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Received: {formatDate(connection.createdAt)}
                    </p>
                  </div>
                  {connection.status === 'pending' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleAcceptConnection(connection._id)}
                        disabled={actionLoading === connection._id}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === connection._id ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDeclineConnection(connection._id)}
                        disabled={actionLoading === connection._id}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading === connection._id ? '...' : 'Decline'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No incoming connection requests</p>
        )}
      </div>

      {/* Sent Requests */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Sent Requests</h4>
        {sentRequests.length > 0 ? (
          <div className="space-y-3">
            {sentRequests.map(connection => (
              <div key={connection._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium">
                        {connection.target?.companyInfo?.name || 
                         `${connection.target?.profile?.firstName || ''} ${connection.target?.profile?.lastName || ''}`.trim() ||
                         connection.target?.email}
                      </h5>
                      {getConnectionStatus(connection)}
                    </div>
                    {connection.target?.companyInfo?.industry && (
                      <p className="text-sm text-gray-600">{connection.target.companyInfo.industry}</p>
                    )}
                    {connection.message && (
                      <p className="text-sm text-gray-700 mt-2">Your message: "{connection.message}"</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Sent: {formatDate(connection.createdAt)}
                    </p>
                  </div>
                  {connection.status === 'pending' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleWithdrawConnection(connection._id)}
                        disabled={actionLoading === connection._id}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading === connection._id ? '...' : 'Withdraw'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No sent connection requests</p>
        )}
      </div>

      {/* Established Connections */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Established Connections</h4>
        {establishedConnections.length > 0 ? (
          <div className="space-y-3">
            {establishedConnections.map(connection => (
              <div key={connection._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium">
                        {connection.requester?.companyInfo?.name || connection.target?.companyInfo?.name ||
                         `${connection.requester?.profile?.firstName || connection.target?.profile?.firstName || ''} ${connection.requester?.profile?.lastName || connection.target?.profile?.lastName || ''}`.trim() ||
                         connection.requester?.email || connection.target?.email}
                      </h5>
                      {getConnectionStatus(connection)}
                    </div>
                    {(connection.requester?.companyInfo?.industry || connection.target?.companyInfo?.industry) && (
                      <p className="text-sm text-gray-600">
                        {connection.requester?.companyInfo?.industry || connection.target?.companyInfo?.industry}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Connected: {connection.acceptedAt ? formatDate(connection.acceptedAt) : 'Unknown'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Message
                    </button>
                    <button 
                      onClick={() => handleViewCompany(connection)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      View Company
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 01 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 01 9.288 0M15 7a3 3 0 11-6 0 3 3 0 01 6 0zm6 3a2 2 0 11-4 0 2 2 0 01 4 0zM7 10a2 2 0 11-4 0 2 2 0 01 4 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900">No connections yet</h3>
            <p className="text-sm text-gray-500 mt-1">
              Companies can send you connection requests from the Connect page.
            </p>
            <div className="mt-4">
              <a 
                href="/connect"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Browse Companies
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeConnectionManager;
