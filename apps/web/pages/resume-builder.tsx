'use client';

import { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ResumeBuilder() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    education: '',
    experience: '',
    skills: '',
    projects: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to build your resume.');
        return;
      }

      await axios.post(
        'http://localhost:5001/api/resume/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage('Resume submitted successfully!');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit resume.');
    }
  };

  return (
    <>
      <Navbar />

      <main className="pt-24 px-6 max-w-2xl mx-auto min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-blue-700 text-center">Resume Builder</h1>

        {error && (
          <p className="text-red-500 bg-red-50 px-4 py-2 rounded-md text-sm mb-4 text-center">
            {error}
          </p>
        )}
        {message && (
          <p className="text-green-600 bg-green-50 px-4 py-2 rounded-md text-sm mb-4 text-center">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl shadow-md">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border px-4 py-2 rounded-md"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border px-4 py-2 rounded-md"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Education</label>
            <textarea
              name="education"
              value={formData.education}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md"
              rows={3}
              required
              placeholder="e.g. B.Tech in CSE, XYZ University, 2021, 8.5 CGPA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Experience</label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md"
              rows={3}
              placeholder="e.g. Web Developer Intern at ABC Company (June–Aug 2023)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Skills</label>
            <input
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md"
              required
              placeholder="e.g. React, Node.js, MongoDB"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Projects</label>
            <textarea
              name="projects"
              value={formData.projects}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md"
              rows={3}
              placeholder="e.g. CampusPe – A job portal for students. Built with MERN stack."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Submit Resume
          </button>

          <a
            href="/resume-preview"
            className="block text-center text-sm text-blue-600 mt-3 hover:underline"
          >
            Preview Resume →
          </a>
        </form>
      </main>

      <Footer />
    </>
  );
}
