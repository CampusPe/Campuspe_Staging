import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface SearchResult {
  id: string;
  name: string;
  type: 'college' | 'company';
  description?: string;
  location?: string;
  industry?: string;
  email?: string;
  logo?: string;
}

interface GlobalSearchProps {
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ className = '' }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showResults || results.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowResults(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (showResults) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showResults, results, selectedIndex]);

  // Search function with debouncing
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Search both colleges and companies
      const [collegesResponse, companiesResponse] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/colleges/search?query=${encodeURIComponent(searchQuery)}`, { headers }),
        axios.get(`${API_BASE_URL}/api/recruiters/search?query=${encodeURIComponent(searchQuery)}`, { headers })
      ]);

      const searchResults: SearchResult[] = [];

      // Process college results
      if (collegesResponse.status === 'fulfilled' && collegesResponse.value.data) {
        const collegeData = collegesResponse.value.data;
        const colleges = collegeData.success ? collegeData.data : (Array.isArray(collegeData) ? collegeData : []);
        colleges.forEach((college: any) => {
          searchResults.push({
            id: college.id || college._id,
            name: college.name || 'Unnamed College',
            type: 'college',
            description: college.description,
            location: college.location,
            email: college.email,
            logo: college.logo
          });
        });
      }

      // Process company results
      if (companiesResponse.status === 'fulfilled' && companiesResponse.value.data) {
        const companyData = companiesResponse.value.data;
        const companies = companyData.success ? companyData.data : (Array.isArray(companyData) ? companyData : []);
        companies.forEach((company: any) => {
          searchResults.push({
            id: company.id || company._id,
            name: company.name || 'Unnamed Company',
            type: 'company',
            description: company.description,
            industry: company.industry,
            location: company.location,
            email: company.email || (company.userId && company.userId.email),
            logo: company.logo
          });
        });
      }

      setResults(searchResults);
      setShowResults(searchResults.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const profilePath = result.type === 'college' 
      ? `/profile/college/${result.id}` 
      : `/profile/company/${result.id}`;
    
    router.push(profilePath);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
      ) : (
        part
      )
    );
  };

  const getResultIcon = (type: 'college' | 'company') => {
    return type === 'college' ? '🏫' : '🏢';
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder=""
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
        />
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {results.length > 0 ? (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-600 font-medium">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={`px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${
                    index === selectedIndex
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Logo or Icon */}
                    <div className="flex-shrink-0">
                      {result.logo ? (
                        <img
                          src={result.logo}
                          alt={`${result.name} logo`}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-lg">
                          {getResultIcon(result.type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {highlightMatch(result.name, query)}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          result.type === 'college'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {result.type === 'college' ? 'College' : 'Company'}
                        </span>
                      </div>
                      
                      {result.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                          {result.description.length > 100 
                            ? `${result.description.substring(0, 100)}...` 
                            : result.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {result.location && (
                          <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{result.location}</span>
                          </span>
                        )}
                        {result.industry && (
                          <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{result.industry}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try searching with different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
