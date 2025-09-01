import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ApprovalStatus from '../components/ApprovalStatus';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ApprovalPending() {
  const router = useRouter();
  const { type } = router.query;
  const [userRole, setUserRole] = useState<'college' | 'recruiter'>('college');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    determineUserRole();
  }, [type]);

  const determineUserRole = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        router.push('/login');
        return;
      }

      // If type is provided in URL, use it
      if (type) {
        setUserRole(type as 'college' | 'recruiter');
        setLoading(false);
        return;
      }

      // Try to determine user role by checking both endpoints
      try {
        // First try college endpoint
        const collegeResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/colleges/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (collegeResponse.ok) {
          setUserRole('college');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('Not a college user');
      }

      try {
        // Then try recruiter endpoint
        const recruiterResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/recruiters/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (recruiterResponse.ok) {
          setUserRole('recruiter');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('Not a recruiter user');
      }

      // If both fail, redirect to login
      localStorage.clear();
      router.push('/login');
    } catch (error) {
      console.error('Error determining user role:', error);
      localStorage.clear();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    console.log('Status changed to:', status);
    // If approved and active, redirect to dashboard
    if (status === 'approved') {
      // Check if user is also active
      checkUserActiveStatus();
    }
  };

  const checkUserActiveStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        router.push('/login');
        return;
      }

      const endpoint = userRole === 'college' 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/colleges/user/${userId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/recruiters/user/${userId}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.approvalStatus === 'approved' && data.isActive) {
        // Redirect to appropriate dashboard
        if (userRole === 'college') {
          router.push('/dashboard/college');
        } else {
          router.push('/dashboard/recruiter');
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-full w-full">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Checking user status...</span>
            </div>
          ) : (
            <ApprovalStatus 
              userRole={userRole} 
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
