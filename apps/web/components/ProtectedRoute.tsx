'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ApprovalStatus from './ApprovalStatus';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproval?: boolean; // Whether to check approval status
  allowedRoles?: string[];   // Allowed roles for this route
}

export default function ProtectedRoute({ 
  children, 
  requireApproval = false, 
  allowedRoles 
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showApprovalStatus, setShowApprovalStatus] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [router]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Decode JWT to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;
      setUserRole(role);

      // Check if user role is allowed
      if (allowedRoles && !allowedRoles.includes(role)) {
        router.push('/login');
        return;
      }

      // Admin users don't need approval checks
      if (role === 'admin') {
        setIsAuthorized(true);
        return;
      }

      // Student users don't need approval checks (they get auto-approved)
      if (role === 'student') {
        setIsAuthorized(true);
        return;
      }

      // For college and recruiter users, check if approval is required
      if (requireApproval && (role === 'college' || role === 'recruiter')) {
        try {
          const userId = payload.userId;
          const endpoint = role === 'college' 
            ? `http://localhost:5001/api/colleges/user/${userId}`
            : `http://localhost:5001/api/recruiters/user/${userId}`;

          const response = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            
            // Check if approved and active
            if (data.approvalStatus === 'approved' && data.isActive) {
              setIsAuthorized(true);
            } else {
              setShowApprovalStatus(true);
              setIsAuthorized(false);
            }
          } else {
            // If API call fails, show approval status component
            setShowApprovalStatus(true);
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error('Error checking approval status:', error);
          setShowApprovalStatus(true);
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const handleStatusChange = (status: string) => {
    if (status === 'approved') {
      // Re-check authorization when status changes to approved
      checkAuth();
    }
  };

  // Loading state
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show approval status for non-approved users
  if (showApprovalStatus && userRole && (userRole === 'college' || userRole === 'recruiter')) {
    return (
      <ApprovalStatus 
        userRole={userRole as 'college' | 'recruiter'} 
        onStatusChange={handleStatusChange}
      />
    );
  }

  // Show children if authorized
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Fallback - shouldn't reach here normally
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
