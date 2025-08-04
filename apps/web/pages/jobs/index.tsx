'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import JobCard from '../../components/JobCard';
import Link from 'next/link';

interface Location {
  city: string;
  state: string;
  country: string;
  workMode: string;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  postedAt: string;
  description: string;
  type?: string;
  salary: { min: number; max: number; currency: string };
  benefits: string[];
  experienceLevel: string;
  skills?: { skill: string; level: string; mandatory: boolean }[]; // Optional field
  applicationDeadline: string;
  isUrgent: boolean;
  locations: Location[]; // Ensuring locations is included
}

export default function JobListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/jobs');
        // Assuming the response is an array of jobs
        const jobsData: Job[] = response.data;
        
        // Validate the data structure of the jobs
        if (Array.isArray(jobsData)) {
          setJobs(jobsData);
        } else {
          setError('Invalid job data');
        }
      } catch (err: any) {
        setError('Failed to load jobs');
      }
    };

    fetchJobs();
  }, []);

  return (
    <>
      <Navbar />

      <main className="bg-white pt-24 px-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-semibold text-blue-700 mb-6 text-center">
          Latest Job Openings
        </h1>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.map((job) => (
            <Link key={job._id} href={`/jobs/${job._id}`}>
              <JobCard job={job} />
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
