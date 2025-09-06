import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

interface CollegeRegistrationNavbarProps {
  currentStep?: number;
  status?: 'pending' | 'approved' | 'rejected';
  isAfterSubmission?: boolean;
  registrationStatus?: string;
  collegeName?: string;
}

const CollegeRegistrationNavbar: React.FC<CollegeRegistrationNavbarProps> = ({ 
  currentStep = 1, 
  status = 'pending',
  isAfterSubmission = false,
  registrationStatus,
  collegeName = "College"
}) => {
  // Get first letter of college name (fallback to "C")
  const profileInitial = collegeName?.charAt(0).toUpperCase() || "C";
  
  // State for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check if user is approved (dropdown should only show for approved users)
  const isApproved = status === 'approved';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('collegeData');
    setIsDropdownOpen(false);
    router.push('/login');
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    setIsDropdownOpen(false);
    router.push(path);
  };

  return (
<nav className="bg-white border-b border-gray-200">
    <div className="flex items-center justify-between max-w-screen-2xl mx-auto px-6 h-16">

        {/* Logo Section */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3">
            <Image 
              src="/logo1.svg" 
              alt="CampusPe Logo" 
              width={140} 
              height={40} 
              className="h-10 w-auto"
            />
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/jobs/create" className="text-gray-500 hover:text-blue-900 font-medium">
            Post a Job
          </Link>
          <Link href="/collect-fees" className="text-gray-500 hover:text-blue-900 font-medium">
            Collect Fees
          </Link>
          <Link href="/connect" className="text-gray-500 hover:text-blue-900 font-medium">
            Connect with companies
          </Link>
        </div>

        {/* Profile Section */}
        <div className="relative flex items-center space-x-4" ref={dropdownRef}>
          {isApproved ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-white text-green-500 font-bold text-lg hover:border-green-500 transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label="Profile Menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {profileInitial}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => handleNavigation('/profile/setup')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  
                  <button
                    onClick={() => handleNavigation('/dashboard/college')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0" />
                    </svg>
                    Dashboard
                  </button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-gray-100 text-gray-400 font-bold text-lg cursor-not-allowed"
              aria-label="Profile (Pending Approval)"
              disabled
            >
              {profileInitial}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default CollegeRegistrationNavbar;
