'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/Button';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import { useModals } from '../hooks/useModals';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isApprovalPending, setIsApprovalPending] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Modal management
  const {
    loginModal,
    registerModal,
    openLoginModal,
    openRegisterModal,
    closeLoginModal,
    closeRegisterModal,
  } = useModals();

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Auth + role state from token
  useEffect(() => {
    if (!isHydrated) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsLoggedIn(!!token);

    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const parsedRole = payload.role || null;
        setRole(parsedRole);

        // Check if we're on approval pending page
        setIsApprovalPending(pathname?.includes('approval-pending') ?? false);

        // Check approval status for college/recruiter roles
        if (parsedRole === 'college' || parsedRole === 'recruiter') {
          void checkApprovalStatus(parsedRole);
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
  }, [pathname, isHydrated]);

  const checkApprovalStatus = async (userRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        setIsApproved(false);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const endpoint =
        userRole === 'college'
          ? `${baseUrl}/api/colleges/user/${userId}`
          : `${baseUrl}/api/recruiters/user/${userId}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setIsApproved(Boolean(data?.approvalStatus === 'approved' && data?.isActive));
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
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { href: '/colleges', label: 'Colleges' },
    { href: '/employers', label: 'Employers' },
    { href: '/fees', label: 'Pay Fees' },
  ];

  const canAccessDashboard = () => {
    if (!isLoggedIn || !role) return false;
    if (role === 'student') return true;
    if ((role === 'college' || role === 'recruiter') && isApproved) return true;
    return false;
  };

  const getDashboardLink = () => {
    if (role === 'student') return '/dashboard/student';
    if (role === 'recruiter') return '/dashboard/recruiter';
    if (role === 'college_admin' || role === 'placement_officer' || role === 'college') return '/dashboard/college';
    if (role === 'admin') return '/admin';
    return '/login';
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md"
        role="navigation"
        aria-label="Primary"
      >
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* Left: Logo - Always visible */}
            <div className="flex items-center flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Image 
                  src="/logo1.svg" 
                  alt="CampusPe" 
                  width={112} 
                  height={32} 
                  className="h-6 sm:h-8 w-auto" 
                  priority 
                />
              </Link>
            </div>

            {/* Center: Desktop Nav - Hidden on mobile */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="flex items-center gap-4 xl:gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative whitespace-nowrap text-sm xl:text-[15px] font-medium text-gray-700 transition-colors hover:text-blue-600 px-2 py-1"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-2 h-0.5 w-0 bg-blue-600 transition-all duration-200 group-hover:w-[calc(100%-16px)] group-focus-visible:w-[calc(100%-16px)]" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Actions - Hidden on mobile */}
              {!isHydrated ? (
                <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-red-500 font-semibold animate-pulse mb-1">Exclusive</span>
                    <div className="text-sm font-medium text-blue-700 cursor-default">
                      Register College
                    </div>
                  </div>
                  <Button variant="ghost" className="px-3 py-2 text-sm" disabled>
                    Login
                  </Button>
                  <Button className="px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700" disabled>
                    Get Started
                  </Button>
                </div>
              ) : !isLoggedIn ? (
                <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-red-500 font-semibold animate-pulse mb-1">Exclusive</span>
                    <button 
                      onClick={() => openRegisterModal('college')}
                      className="text-sm font-medium text-blue-700 hover:text-blue-600 transition-colors"
                    >
                      Register College
                    </button>
                  </div>
                  <button onClick={() => openLoginModal('student')}>
                    <Button variant="ghost" className="px-3 py-2 text-sm">
                      Login
                    </Button>
                  </button>
                  <button onClick={() => openRegisterModal('student')}>
                    <Button className="px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700">
                      Get Started
                    </Button>
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                  {canAccessDashboard() && (
                    <Link href={getDashboardLink()}>
                      <Button variant="ghost" className="px-3 py-2 text-sm">
                        Dashboard
                      </Button>
                    </Link>
                  )}

                  {isApproved && (role === 'recruiter' || role === 'college') && (
                    <Link href="/connect">
                      <Button variant="ghost" className="px-3 py-2 text-sm">
                        Connect
                      </Button>
                    </Link>
                  )}

                  {!isApproved && (role === 'college' || role === 'recruiter') && !isApprovalPending && (
                    <Link href={`/approval-pending?type=${role}`}>
                      <Button variant="outline" className="border-orange-200 px-3 py-2 text-sm text-orange-600">
                        Status
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Logout
                  </Button>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence initial={false}>
            {isMobileMenuOpen && (
              <motion.div
                id="mobile-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="lg:hidden overflow-hidden border-t border-gray-100"
              >
                <div className="py-4 space-y-4">
                  {/* Navigation Links */}
                  <nav className="space-y-1 px-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Actions */}
                  <div className="space-y-3 px-4">
                    {!isLoggedIn ? (
                      <>
                        <div className="text-center">
                          <span className="text-xs text-red-500 font-semibold animate-pulse mb-2 block">Exclusive</span>
                          <button 
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              openRegisterModal('college');
                            }} 
                            className="w-full"
                          >
                            <Button variant="outline" className="w-full justify-center text-blue-700 border-blue-200">
                              Register College
                            </Button>
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            openLoginModal('student');
                          }} 
                          className="w-full"
                        >
                          <Button variant="ghost" className="w-full justify-center">
                            Login
                          </Button>
                        </button>
                        
                        <button 
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            openRegisterModal('student');
                          }} 
                          className="w-full"
                        >
                          <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700">
                            Get Started
                          </Button>
                        </button>
                      </>
                    ) : (
                      <>
                        {canAccessDashboard() && (
                          <Link href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-center">
                              Dashboard
                            </Button>
                          </Link>
                        )}

                        {isApproved && (role === 'recruiter' || role === 'college') && (
                          <Link href="/connect" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-center">
                              Connect
                            </Button>
                          </Link>
                        )}

                        {!isApproved && (role === 'college' || role === 'recruiter') && !isApprovalPending && (
                          <Link href={`/approval-pending?type=${role}`} onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full justify-center border-orange-200 text-orange-600">
                              Check Status
                            </Button>
                          </Link>
                        )}

                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="w-full justify-center text-red-600 hover:text-red-700"
                        >
                          Logout
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Modals */}
      <LoginModal 
        isOpen={loginModal.isOpen} 
        onClose={closeLoginModal}
        initialUserType={loginModal.defaultTab}
        onSwitchToRegister={openRegisterModal}
      />
      <RegisterModal 
        isOpen={registerModal.isOpen} 
        onClose={closeRegisterModal}
        initialUserType={registerModal.defaultTab}
      />
    </>
  );
}
