'use client';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function StudentDashboard() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-6 pt-28 pb-12 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-8">Welcome, Student 👋</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Resume Builder Status */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Resume Status</h2>
            <p className="text-sm text-gray-500 mb-4">You haven’t completed your resume yet.</p>
            <a
              href="/resume-builder"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Complete Resume →
            </a>
          </div>

          {/* Suggested Jobs */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Job Recommendations</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Frontend Intern at Infosys</li>
              <li>• AI/ML Analyst at TCS</li>
              <li>• Backend Dev at Microsoft</li>
            </ul>
            <a
              href="/jobs"
              className="text-blue-600 hover:underline text-sm font-medium block mt-3"
            >
              View All Jobs →
            </a>
          </div>

          {/* Application Updates */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Applications</h2>
            <p className="text-sm text-gray-500">2 pending, 1 shortlisted 🎉</p>
            <a
              href="/applications"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Check Status →
            </a>
          </div>

          {/* Skill Gap / AI Suggestions */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Skill Suggestions</h2>
            <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
              <li>Learn TypeScript for frontend jobs</li>
              <li>Practice DSA problems (LeetCode)</li>
            </ul>
            <a
              href="/learning"
              className="text-blue-600 hover:underline text-sm font-medium block mt-3"
            >
              Improve Skills →
            </a>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Upcoming Interviews</h2>
            <p className="text-sm text-gray-500">No interviews scheduled yet.</p>
            <a
              href="/interviews"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              View Schedule →
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
