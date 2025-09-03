import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        <div className="flex items-center space-x-4">
          <button 
            className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-white text-green-500 font-bold text-lg hover:border-green-500 transition"
            aria-label="Profile"
          >
            {profileInitial}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default CollegeRegistrationNavbar;
