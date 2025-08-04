'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);

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
      } catch (error) {
        console.error('Error decoding token:', error);
        setRole(null);
      }
    } else {
      setRole(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setRole(null);
    router.push('/login');
  };

  const getDashboardLink = () => {
    if (role === 'student') return '/dashboard/student';
    if (role === 'recruiter') return '/dashboard/recruiter';
    if (role === 'college') return '/dashboard/college';
    return '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          CampusPe
        </Link>

        <div className="flex gap-4 text-sm">
          <Link href="/" className="hover:text-blue-600 font-medium">Home</Link>
        {!isLoggedIn ? (
            <>
              <Link href="/login" className="hover:text-blue-600 font-medium">Login</Link>
              <Link href="/register" className="hover:text-blue-600 font-medium">Register</Link>
            </>
          ) : (
            <>
              <Link href={getDashboardLink()} className="hover:text-blue-600 font-medium">Dashboard</Link>
              <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
