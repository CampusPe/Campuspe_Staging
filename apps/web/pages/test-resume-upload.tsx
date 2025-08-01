import React, { useState, useEffect } from 'react';
import { useResumeUpload } from '../components/ResumeUpload';

const TestResumeUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasToken, setHasToken] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    setHasToken(!!token);
    setMessage(token ? 'Authentication token found' : 'No authentication token found. Please login first.');
  }, []);
  
  const resumeUpload = useResumeUpload({
    onUploadSuccess: (analysis) => {
      setMessage(`Success: Resume analyzed with ${analysis.skills?.length || 0} skills detected`);
    },
    onUploadError: (error) => {
      setMessage(`Error: ${error}`);
    },
    isUploading: uploading,
    setIsUploading: setUploading
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Test page: File selected:', file.name);
      resumeUpload.handleFileSelect(file);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resume Upload Test</h1>
      
      <div className="space-y-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={uploading || !hasToken}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        
        {!hasToken && (
          <div className="text-yellow-600">
            Authentication required. Please <a href="/login" className="underline">login</a> first.
          </div>
        )}
        
        {uploading && (
          <div className="text-blue-600">Uploading...</div>
        )}
        
        {message && (
          <div className={`p-3 rounded ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="font-semibold mb-2">Test Steps:</h2>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Click "Choose File" above</li>
            <li>Select a PDF file</li>
            <li>Check console for debug messages</li>
            <li>Wait for response</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestResumeUpload;
