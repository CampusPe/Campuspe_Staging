import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ApprovalStatus from '../components/ApprovalStatus';
import Navbar from '../components/Navbar';

export default function ApprovalPending() {
  const router = useRouter();
  const { type } = router.query;
  const [userRole, setUserRole] = useState<'college' | 'recruiter'>('college');

  useEffect(() => {
    if (type) {
      setUserRole(type as 'college' | 'recruiter');
    }
  }, [type]);

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
          <ApprovalStatus 
            userRole={userRole} 
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </>
  );
}
