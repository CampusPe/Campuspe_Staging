'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/Button';
import dynamic from 'next/dynamic';

// Dynamically import GlobalSearch to avoid SSR issues
const GlobalSearch = dynamic(() => import('./GlobalSearch'), {
  ssr: false,
  loading: () => <div className="w-full h-10 bg-gray-100 rounded-lg animate-pulse" />,
});

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
    { href: '/colleges', label: 'Colleges' },
    { href: '/employers', label: 'Employers' },
    { href: '/pay-fees', label: 'Pay Fees' },
  ];

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
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex flex-none items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Image src="/logo1.svg" alt="CampusPe" width={112} height={32} className="h-8 w-auto" priority />
          </Link>

          {/* Center: Desktop Nav + Search */}
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

            {/* Search */}
            <div className="relative w-full max-w-lg">
              <GlobalSearch />
              <div className="pointer-events-none absolute inset-y-0 left-3 right-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
                <div className="marquee whitespace-nowrap text-xs leading-10 text-gray-400/80">
                  <span className="mr-8">Try: “Find colleges with CS in Bengaluru”</span>
                  <span className="mr-8">Search jobs, colleges, fees…</span>
                 
                </div>
              </div>
            </div>
          </div>

          {/* Right: Desktop Actions */}
          <div className="hidden flex-none items-center gap-2 lg:flex">
            {!isHydrated ? (
              <>
                <Button
                  variant="outline"
                  className="relative overflow-hidden bg-white px-4 py-2 text-sm font-medium text-purple-700 ring-1 ring-purple-300 shadow-[0_8px_24px_rgba(168,85,247,0.25)] hover:shadow-[0_12px_32px_rgba(168,85,247,0.4)]"
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
                  <Button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
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
                {/* Search */}
                <div className="relative px-2 sm:px-4">
                  <GlobalSearch />
                  <div className="pointer-events-none absolute inset-y-0 left-5 right-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
                    <div className="marquee whitespace-nowrap text-xs leading-10 text-gray-400/80">
                      <span className="mr-8">Discover colleges, jobs & fees</span>
                      <span className="mr-8">Type to search • Try “BTech Pune”</span>
                      <span className="mr-8">Swipe down to close</span>
                    </div>
                  </div>
                </div>

                {/* Links */}
                <nav className="mt-4 space-y-1 px-2 sm:px-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* Auth */}
                <div className="mt-4 space-y-3 border-t border-gray-100 px-2 pt-4 sm:px-4">
                  {!isHydrated ? (
                    <>
                      <Button variant="ghost" className="w-full justify-start">
                        Login
                      </Button>
                      <Button variant="outline" className="w-full">
                        Register College
                      </Button>
                      <Button className="w-full bg-purple-600 text-white hover:bg-purple-700">Get Started</Button>
                    </>
                  ) : !isLoggedIn ? (
                    <>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                        <Button variant="ghost" className="w-full justify-start">
                          Login
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block">
                        <Button variant="outline" className="w-full">
                          Register College
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block">
                        <Button className="w-full bg-purple-600 text-white hover:bg-purple-700">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      {canAccessDashboard() && (
                        <Link href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)} className="block">
                          <Button variant="ghost" className="w-full justify-start">
                            Dashboard
                          </Button>
                        </Link>
                      )}

                      {isApproved && (role === 'recruiter' || role === 'college') && (
                        <Link href="/connect" onClick={() => setIsMobileMenuOpen(false)} className="block">
                          <Button variant="ghost" className="w-full justify-start">
                            Connect
                          </Button>
                        </Link>
                      )}

                      {!isApproved && (role === 'college' || role === 'recruiter') && !isApprovalPending && (
                        <Link href={`/approval-pending?type=${role}`} onClick={() => setIsMobileMenuOpen(false)} className="block">
                          <Button variant="outline" className="w-full border-orange-200 text-orange-600">
                            Approval Status
                          </Button>
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
          )}
        </AnimatePresence>
      </div>
        <style jsx global>{`
          @keyframes marqueeMove { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
          .marquee { animation: marqueeMove 12s linear infinite; }
        `}</style>
    </motion.nav>
  );
}
