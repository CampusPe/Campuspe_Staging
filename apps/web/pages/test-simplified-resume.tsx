import React from 'react';

const TestSimplifiedResume: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Test Simplified Resume
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            This is a development/testing page for simplified resume functionality.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-yellow-800">
              <strong>Note:</strong> This page is for development purposes only. 
              For resume upload functionality, please use the main resume upload page.
            </p>
          </div>
          <div className="mt-4">
            <a 
              href="/test-resume-upload" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Resume Upload Test
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSimplifiedResume;