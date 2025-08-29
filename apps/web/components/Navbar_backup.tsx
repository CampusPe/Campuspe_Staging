'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/Button';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isApprovalPending, setIsApprovalPending] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

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
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md"
      role="navigation"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Left: Logo with Exclusive */}
          <div className="flex flex-none items-center gap-3">
            <Link
              href="/"
              className="flex flex-none items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Image src="/logo1.svg" alt="CampusPe" width={112} height={32} className="h-8 w-auto" priority />
            </Link>
            <div className="relative">
              <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse">
                Exclusive
              </span>
            </div>
          </div>

          {/* Center: Desktop Nav */}
          <div className="hidden flex-1 items-center justify-center gap-8 lg:flex">
            {/* Nav links */}
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative whitespace-nowrap text-[15px] font-medium text-gray-700 transition-colors hover:text-primary-600"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary-600 transition-all duration-200 group-hover:w-full group-focus-visible:w-full" />
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Desktop Actions */}
          <div className="hidden flex-none items-center gap-2 lg:flex">
            {!isHydrated ? (
              <>
                <Button
                  variant="outline"
                  className="relative overflow-hidden bg-white px-4 py-2 text-sm font-medium text-[#064BB3]-700 ring-1 ring-[#064BB3]-300 shadow-[0_8px_24px_rgba(168,85,247,0.25)] hover:shadow-[0_12px_32px_rgba(168,85,247,0.4)]"
                  aria-disabled
                >
                  Register College
                  <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white animate-pulse">Exclusive</span>
                </Button>
                <Button variant="ghost" className="px-4 py-2 text-sm text-gray-700 border border-gray-200 hover:border-gray-300" aria-disabled>
                  Login
                </Button>
                <Button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700" aria-disabled>
                  Get Started
                </Button>
              </>
            ) : !isLoggedIn ? (
              <>
                <Link href="/register" className="inline-flex">
                  <Button variant="outline" className="relative overflow-hidden bg-white px-4 py-2 text-sm font-medium text-purple-700 ring-1 ring-purple-300 shadow-[0_8px_24px_rgba(168,85,247,0.25)] hover:shadow-[0_12px_32px_rgba(168,85,247,0.4)]">
                    Register College
                    <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white animate-pulse">Exclusive</span>
                  </Button>
                </Link>
                <Link href="/login" className="inline-flex">
                  <Button variant="ghost" className="px-4 py-2 text-sm text-gray-700 border border-gray-200 hover:border-gray-300">
                    Login
                  </Button>
                </Link>
                <Link href="/register" className="inline-flex">
                  <Button className="rounded-lg bg-[#2463EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#064BB3]">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {canAccessDashboard() && (
                  <Link href={getDashboardLink()} className="inline-flex">
                    <Button variant="ghost" className="px-4 py-2 text-sm">
                      Dashboard
                    </Button>
                  </Link>
                )}

                {isApproved && role === 'recruiter' && (
                  <Link href="/connect" className="inline-flex">
                    <Button variant="ghost" className="px-3 py-2 text-sm">
                      Connect
                    </Button>
                  </Link>
                )}
                {isApproved && role === 'college' && (
                  <Link href="/connect" className="inline-flex">
                    <Button variant="ghost" className="px-3 py-2 text-sm">
                      Connect
                    </Button>
                  </Link>
                )}

                {!isApproved && (role === 'college' || role === 'recruiter') && !isApprovalPending && (
                  <Link href={`/approval-pending?type=${role}`} className="inline-flex">
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
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen((s) => !s)}
            className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence initial={false}>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden lg:hidden"
            >
              <div className="border-t border-gray-100 py-4">
                {/* Links */}
                <nav className="space-y-1 px-2 sm:px-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* Actions */}
                <div className="mt-6 space-y-4 px-2 sm:px-4">
                  {!isLoggedIn ? (
                    <>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block">
                        <Button variant="outline" className="w-full justify-center">
                          Register College
                        </Button>
                      </Link>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                        <Button variant="ghost" className="w-full justify-center">
                          Login
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block">
                        <Button className="w-full justify-center">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      {canAccessDashboard() && (
                        <Link href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)} className="block">
                          <Button variant="ghost" className="w-full justify-center">
                            Dashboard
                          </Button>
                        </Link>
                      )}

                      {isApproved && (role === 'recruiter' || role === 'college') && (
                        <Link href="/connect" onClick={() => setIsMobileMenuOpen(false)} className="block">
                          <Button variant="ghost" className="w-full justify-center">
                            Connect
                          </Button>
                        </Link>
                      )}

                      {!isApproved && (role === 'college' || role === 'recruiter') && !isApprovalPending && (
                        <Link href={`/approval-pending?type=${role}`} onClick={() => setIsMobileMenuOpen(false)} className="block">
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
  );
}
