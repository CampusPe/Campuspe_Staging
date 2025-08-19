'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import GlobalSearch from './GlobalSearch';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isApprovalPending, setIsApprovalPending] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/colleges', label: 'Colleges' },
    { href: '/employers', label: 'Employers' },
    { href: '/pay-fees', label: 'Pay Fees' },
  ];


  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm"
    >
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CampusPe</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* Global Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <GlobalSearch />
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="bg-primary-50 border-primary-200">
                    Register College
                    <span className="ml-1 text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded">Exclusive</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="gradient" size="lg">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {canAccessDashboard() && (
                  <Link href={getDashboardLink()}>
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                )}
                
                {isApproved && role === 'recruiter' && (
                  <Link href="/connect">
                    <Button variant="ghost">Connect with Colleges</Button>
                  </Link>
                )}
                {isApproved && role === 'college' && (
                  <Link href="/connect">
                    <Button variant="ghost">Connect with Companies</Button>
                  </Link>
                )}
                
                {!isApproved && (role === 'college' || role === 'recruiter') && !isApprovalPending && (
                  <Link href={`/approval-pending?type=${role}`}>
                    <Button variant="outline" className="text-orange-600 border-orange-200">
                      Approval Status
                    </Button>
                  </Link>
                )}
                
                <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700">
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: isMobileMenuOpen ? 'auto' : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4 border-t border-gray-100">
            {/* Mobile Search */}
            <div className="px-4">
              <GlobalSearch />
            </div>

            {/* Mobile Navigation */}
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile Auth */}
            <div className="px-4 space-y-2 border-t border-gray-100 pt-4">
              {!isLoggedIn ? (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Login</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Register</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="gradient" className="w-full">Get Started</Button>
                  </Link>
                </>
              ) : (
                <>
                  {canAccessDashboard() && (
                    <Link href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }} 
                    className="w-full justify-start text-red-600 hover:text-red-700"
                  >
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}
