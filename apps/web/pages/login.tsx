'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function UnifiedLoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT token to get user role
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        const role = payload.role;

        if (role === 'student') {
          router.push('/dashboard/student');
        } else if (role === 'recruiter') {
          router.push('/dashboard/recruiter');
        } else if (role === 'college') {
          router.push('/dashboard/college');
        } else if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        router.push('/login');
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', formData);
      const { token } = response.data;

      localStorage.setItem('token', token);

      // Decode token to get userId and role
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      const userId = payload.userId;
      const role = payload.role;

      // Fetch user profile data from backend (skip for admin)
      let url = '';
      if (role === 'student') {
        url = `http://localhost:5001/api/students/user/${userId}`;
      } else if (role === 'recruiter') {
        url = `http://localhost:5001/api/recruiters/user/${userId}`;
      } else if (role === 'college') {
        url = `http://localhost:5001/api/colleges/user/${userId}`;
      } else if (role === 'admin') {
        // For admin, directly redirect without fetching profile data
        localStorage.setItem('userId', userId);
        localStorage.setItem('role', role);
        router.push('/admin');
        return;
      }

      if (url) {
        try {
          const profileResponse = await axios.get(url);
          localStorage.setItem('profileData', JSON.stringify(profileResponse.data));
      localStorage.setItem('userId', userId);
      console.log('Stored userId in localStorage:', userId);
      console.log('Token payload:', payload);
      // Include studentId in redirect if role is student
      if (role === 'student' && profileResponse.data.studentId) {
        router.push(`/dashboard/student?studentId=${profileResponse.data.studentId}`);
        return;
      }
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      }

      if (role === 'student') router.push('/dashboard/student');
      else if (role === 'recruiter') router.push('/dashboard/recruiter');
      else if (role === 'college') router.push('/dashboard/college');
      else if (role === 'admin') router.push('/admin');
      else router.push('/login');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Login to Your Account</h2>

          {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="student">Student</option>
                <option value="recruiter">Recruiter</option>
                <option value="college">College</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                required
              />
            </div>

            <div className="text-right text-sm">
              <a href="/forgot-password" className="text-blue-600 hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
