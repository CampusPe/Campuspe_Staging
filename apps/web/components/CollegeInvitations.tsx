import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

interface College {
  _id: string;
  name: string;
  shortName: string;
  location: {
    city: string;
    state: string;
  };
  placementStats: {
    averagePackage: number;
    totalStudents: number;
  };
}

interface CollegeInvitationsProps {
  jobId: string;
  onInvitationsSent: () => void;
}

export default function CollegeInvitations({ jobId, onInvitationsSent }: CollegeInvitationsProps) {
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitationData, setInvitationData] = useState({
    campusVisitWindow: {
      startDate: '',
      endDate: '',
      isFlexible: true,
      preferredTimeSlots: ['morning', 'afternoon']
    },
    invitationMessage: '',
    eligibilityCriteria: {
      courses: [''],
      minCGPA: 7.0,
      graduationYear: new Date().getFullYear() + 1,
      maxBacklogs: 2
    },
    studentLimits: {
      minStudents: 5,
      maxStudents: 50
    }
  });

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/colleges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setColleges(response.data.data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.location.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCollegeSelect = (collegeId: string) => {
    setSelectedColleges(prev =>
      prev.includes(collegeId)
        ? prev.filter(id => id !== collegeId)
        : [...prev, collegeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedColleges.length === filteredColleges.length) {
      setSelectedColleges([]);
    } else {
      setSelectedColleges(filteredColleges.map(college => college._id));
    }
  };

  const handleInputChange = (field: string, value: any) => {
    const keys = field.split('.');
    if (keys.length === 1) {
      setInvitationData(prev => ({ ...prev, [field]: value }));
    } else if (keys.length === 2) {
      setInvitationData(prev => ({
        ...prev,
        [keys[0]]: { ...(prev[keys[0] as keyof typeof prev] as any), [keys[1]]: value }
      }));
    }
  };

  const sendInvitations = async () => {
    if (selectedColleges.length === 0) {
      alert('Please select at least one college');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/jobs/${jobId}/invitations`,
        {
          targetColleges: selectedColleges,
          ...invitationData
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Invitations sent successfully!');
      onInvitationsSent();
    } catch (error: any) {
      console.error('Error sending invitations:', error);
      alert(error.response?.data?.message || 'Failed to send invitations');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading colleges...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Send College Invitations</h2>
      
      {/* Campus Visit Configuration */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Campus Visit Window</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={invitationData.campusVisitWindow.startDate}
              onChange={(e) => handleInputChange('campusVisitWindow.startDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={invitationData.campusVisitWindow.endDate}
              onChange={(e) => handleInputChange('campusVisitWindow.endDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={invitationData.campusVisitWindow.isFlexible}
              onChange={(e) => handleInputChange('campusVisitWindow.isFlexible', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Allow flexible dates for negotiation</span>
          </label>
        </div>
      </div>

      {/* College Selection */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Select Target Colleges</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedColleges.length} of {filteredColleges.length} selected
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              {selectedColleges.length === filteredColleges.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search colleges by name, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredColleges.map(college => (
            <div
              key={college._id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedColleges.includes(college._id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleCollegeSelect(college._id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-800">{college.name}</h4>
                  <p className="text-xs text-gray-600">{college.shortName}</p>
                  <p className="text-xs text-gray-500">
                    {college.location.city}, {college.location.state}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedColleges.includes(college._id)}
                  onChange={() => {}}
                  className="mt-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={sendInvitations}
          disabled={submitting || selectedColleges.length === 0}
          className={`px-8 py-3 rounded-md font-semibold text-white ${
            submitting || selectedColleges.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {submitting ? 'Sending Invitations...' : `Send Invitations to ${selectedColleges.length} Colleges`}
        </button>
      </div>
    </div>
  );
}
