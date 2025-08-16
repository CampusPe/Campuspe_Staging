import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import EnhancedStudentDashboard from '../../components/EnhancedStudentDashboard';
import Navbar from '../../components/Navbar';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      
      if (!token || userType !== 'student') {
        router.push('/login');
        return;
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <EnhancedStudentDashboard />
    </>
  );
}
