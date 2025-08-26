import React, { useState, useEffect } from 'react';

interface CollegeSearchDropdownProps {
  onSelect: (college: any) => void;
  placeholder?: string;
  value?: string;
}

const CollegeSearchDropdown: React.FC<CollegeSearchDropdownProps> = ({
  onSelect,
  placeholder = "Select your college",
  value = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [colleges, setColleges] = useState([
    // Sample colleges - replace with API call
    { id: '1', name: 'Private College' },
    { id: '2', name: 'Allied College' },
    { id: '3', name: 'Autonomous College' },
    { id: '4', name: 'Deemed University' },
    { id: '5', name: 'State University' },
    { id: '6', name: 'Central University' },
    { id: '7', name: 'Other' },
  ]);
  const [filteredColleges, setFilteredColleges] = useState(colleges);

  useEffect(() => {
    const filtered = colleges.filter(college =>
      college.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredColleges(filtered);
  }, [searchTerm, colleges]);

  const handleSelect = (college: any) => {
    setSearchTerm(college.name);
    setIsOpen(false);
    onSelect(college);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg 
            className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredColleges.length > 0 ? (
            filteredColleges.map((college) => (
              <div
                key={college.id}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleSelect(college)}
              >
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-800">{college.name}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">No colleges found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollegeSearchDropdown;
