'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import GlobalSearch from './GlobalSearch';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isApprovalPending, setIsApprovalPending] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        setRole(payload.role || null);
        
        // Check if we're on approval pending page
        setIsApprovalPending(router.pathname.includes('approval-pending'));
        
        // Check approval status for college/recruiter roles
        if (payload.role === 'college' || payload.role === 'recruiter') {
          checkApprovalStatus(payload.role);
        } else {
          setIsApproved(true); // Students don't need approval
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setRole(null);
        setIsApproved(false);
      }
    } else {
      setRole(null);
      setIsApproved(false);
    }
  }, [router.pathname]);

  const checkApprovalStatus = async (userRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        setIsApproved(false);
        return;
      }

      const endpoint = userRole === 'college' 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/colleges/user/${userId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/recruiters/user/${userId}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsApproved(data.approvalStatus === 'approved' && data.isActive);
      } else {
        setIsApproved(false);
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setIsApproved(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setRole(null);
    setIsApproved(false);
    router.push('/login');
  };

  const getDashboardLink = () => {
    if (role === 'student') return '/dashboard/student';
    if (role === 'recruiter') return '/dashboard/recruiter';
    if (role === 'college') return '/dashboard/college';
    return '/';
  };

  const canAccessDashboard = () => {
    if (role === 'student') return true;
    return isApproved;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          CampusPe
        </Link>

        {/* Global Search - Show on all pages */}
        <div className="flex-1 max-w-lg mx-6">
          <GlobalSearch />
        </div>

        <div className="flex gap-4 text-sm items-center">
          <Link href="/" className="hover:text-blue-600 font-medium">Home</Link>
        {!isLoggedIn ? (
            <>
              <Link href="/login" className="hover:text-blue-600 font-medium">Login</Link>
              <Link href="/register" className="hover:text-blue-600 font-medium">Register</Link>
            </>
          ) : (
            <>
              {/* Only show dashboard link if approved or student */}
              {canAccessDashboard() && (
                <Link href={getDashboardLink()} className="hover:text-blue-600 font-medium">Dashboard</Link>
              )}
              
              {/* Only show connect links if approved */}
              {isApproved && role === 'recruiter' && (
                <Link href="/connect" className="hover:text-blue-600 font-medium">Connect with Colleges</Link>
              )}
              {isApproved && role === 'college' && (
                <Link href="/connect" className="hover:text-blue-600 font-medium">Connect with Companies</Link>
              )}
              
              {/* Show approval status for pending users */}
              {!isApproved && (role === 'college' || role === 'recruiter') && !isApprovalPending && (
                <Link href={`/approval-pending?type=${role}`} className="text-orange-600 hover:text-orange-800 font-medium">
                  Approval Status
                </Link>
              )}
              
              <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
