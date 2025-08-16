import React, { useState } from 'react';
import { API_BASE_URL } from '../utils/api';

const ApiConfigDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
          title="Show API Debug Info"
        >
          🔧 API
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-gray-700">API Configuration</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="text-xs space-y-1">
        <div>
          <span className="font-semibold">Environment:</span> {process.env.NODE_ENV || 'undefined'}
        </div>
        <div>
          <span className="font-semibold">NEXT_PUBLIC_API_URL:</span>{' '}
          <span className={process.env.NEXT_PUBLIC_API_URL ? 'text-green-600' : 'text-red-600'}>
            {process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}
          </span>
        </div>
        <div>
          <span className="font-semibold">Final API_BASE_URL:</span>{' '}
          <span className="text-blue-600 break-all">{API_BASE_URL}</span>
        </div>
        <div className="mt-2 pt-2 border-t">
          <span className="font-semibold">Status:</span>{' '}
          {API_BASE_URL.includes('localhost') ? (
            <span className="text-orange-600">Using localhost (dev mode)</span>
          ) : (
            <span className="text-green-600">Using Azure endpoint</span>
          )}
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t">
        <button
          onClick={() => {
            console.log('🔧 API Configuration Debug:');
            console.log('NODE_ENV:', process.env.NODE_ENV);
            console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
            console.log('API_BASE_URL:', API_BASE_URL);
            console.log('Window location:', window.location.href);
          }}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
        >
          Log to Console
        </button>
      </div>
    </div>
  );
};

export default ApiConfigDebugger;
