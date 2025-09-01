import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RegistrationSuccess() {
  const router = useRouter();
  
  useEffect(() => {
    // Auto redirect to approval-pending after 5 seconds
    const timer = setTimeout(() => {
      router.push('/approval-pending');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [router]);

  const handleCheckStatus = () => {
    router.push('/approval-pending');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-12 text-center">
            {/* Thank You Illustration */}
            <div className="mx-auto mb-8 w-80 h-64">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Background decorative elements */}
                <div className="absolute top-4 left-8 w-2 h-2 bg-blue-300 rounded-full"></div>
                <div className="absolute top-12 right-12 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                <div className="absolute bottom-8 left-16 w-1 h-1 bg-green-300 rounded-full"></div>
                <div className="absolute bottom-16 right-8 w-2 h-2 bg-purple-300 rounded-full"></div>
                <div className="absolute top-20 left-20 w-1.5 h-1.5 bg-orange-300 rounded-full"></div>
                
                {/* Main envelope/message illustration */}
                <div className="relative">
                  {/* Large envelope */}
                  <div className="relative w-32 h-20 mx-auto">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg"></div>
                    <div className="absolute inset-2 bg-white rounded-sm"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                    
                    {/* Envelope flap */}
                    <div className="absolute -top-2 left-0 w-full h-6 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-t-lg transform -rotate-12 origin-bottom"></div>
                  </div>
                  
                  {/* People around envelope */}
                  {/* Person on left */}
                  <div className="absolute -left-16 top-4">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full mb-1"></div>
                    <div className="w-8 h-10 bg-blue-500 rounded-lg"></div>
                    <div className="w-4 h-6 bg-blue-600 rounded-sm mx-auto"></div>
                    {/* Laptop */}
                    <div className="w-6 h-4 bg-gray-600 rounded-sm mx-auto mt-1"></div>
                  </div>
                  
                  {/* Person on top right */}
                  <div className="absolute -top-8 right-0">
                    <div className="w-6 h-6 bg-blue-400 rounded-full mb-1"></div>
                    <div className="w-8 h-10 bg-green-500 rounded-lg"></div>
                    <div className="w-4 h-6 bg-green-600 rounded-sm mx-auto"></div>
                    {/* Paper/document */}
                    <div className="w-3 h-4 bg-white border border-gray-300 rounded-sm mx-auto mt-1"></div>
                  </div>
                  
                  {/* Person on bottom right */}
                  <div className="absolute -bottom-4 -right-12">
                    <div className="w-6 h-6 bg-purple-400 rounded-full mb-1"></div>
                    <div className="w-8 h-10 bg-orange-500 rounded-lg"></div>
                    <div className="w-4 h-6 bg-orange-600 rounded-sm mx-auto"></div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -left-4 w-4 h-4 bg-blue-400 rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  
                  <div className="absolute -bottom-2 left-4 w-5 h-4 bg-yellow-500 rounded-sm"></div>
                  
                  {/* Flying papers */}
                  <div className="absolute top-2 right-8 w-2 h-3 bg-white border border-gray-300 rounded-sm transform rotate-12"></div>
                  <div className="absolute top-6 right-12 w-2 h-3 bg-white border border-gray-300 rounded-sm transform -rotate-6"></div>
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification in Progress</h1>
            <p className="text-gray-600 text-lg mb-8">We're reviewing your details.</p>
            
            <h2 className="text-2xl font-semibold text-blue-600 mb-4">Thank you for providing us the information</h2>
            <p className="text-gray-700 mb-2">Your account is under verification.</p>
            <p className="text-gray-600 text-sm mb-8">Our team will reach out shortly to confirm the information.</p>
            
            <button
              onClick={handleCheckStatus}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Check Status
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
