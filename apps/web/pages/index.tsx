'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white px-16 py-24 text-gray-900">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          {/* Hero Section */}
          <h1 className="text-5xl font-semibold leading-tight text-blue-600">
            Find Your Next Career Opportunity 🚀
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Discover your dream job, create impressive resumes, and connect with top companies. GitHub Actions v2.1
          </p>

          {/* Call-to-Actions */}
          <div className="flex gap-6 justify-center items-center mt-10">
            <Link href="/jobs">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-md text-xl hover:bg-blue-700 transition-all ease-in-out duration-200">
                Browse Jobs
              </button>
            </Link>
            {!isLoggedIn && (
              <Link href="/register">
                <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-md text-xl hover:bg-blue-50 transition-all ease-in-out duration-200">
                  Register Now
                </button>
              </Link>
            )}
          </div>

          {/* Icons Section (with better spacing and clarity) */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 px-6">
            <div className="flex flex-col items-center space-y-2">
              <svg className="h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v4m0 0H8l4 4 4-4h-4z" />
              </svg>
              <span className="text-xl text-gray-800">Find Jobs</span>
              <p className="text-gray-500 text-sm">Explore job opportunities tailored to your skill set.</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <svg className="h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v4m0 0H8l4 4 4-4h-4z" />
              </svg>
              <span className="text-xl text-gray-800">Build Resume</span>
              <p className="text-gray-500 text-sm">Create a resume that stands out to employers with ease.</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <svg className="h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v4m0 0H8l4 4 4-4h-4z" />
              </svg>
              <span className="text-xl text-gray-800">Connect with Companies</span>
              <p className="text-gray-500 text-sm">Get in touch with top companies for exciting roles.</p>
            </div>
          </div>

          {/* Information Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 px-6">
            <div className="bg-white text-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all ease-in-out duration-300">
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">Seamless Application Process</h2>
              <p className="text-gray-600">
                Apply to jobs in seconds with our easy-to-use platform. Track your applications with ease.
              </p>
            </div>
            <div className="bg-white text-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all ease-in-out duration-300">
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">Partnering with Top Companies</h2>
              <p className="text-gray-600">
                We work with leading organizations to bring you the best career opportunities available.
              </p>
            </div>
          </div>

          {/* Scroll Animation (Improved, Subtle) */}
          <div className="mt-20 text-center">
            <p className="text-sm text-gray-600">Scroll Down for More</p>
            <div className="w-8 h-8 mx-auto mt-4 border-4 border-t-4 border-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
