import { Student, Job, College } from '../models';
import { calculateMatchScore } from '../utils/helpers';

// Function to match students with jobs based on skills and interests
export const matchStudentsWithJobs = async (studentId: string) => {
    const student = await Student.findById(studentId);
    if (!student) return [];
    
    const jobs = await Job.find();

    const matches = jobs.map(job => {
        const score = calculateMatchScore(student.skills, job.requiredSkills || []);
        return { job, score };
    });

    // Sort matches by score in descending order
    matches.sort((a, b) => b.score - a.score);
    return matches;
};

// Function to match students with colleges based on preferences and scores
export const matchStudentsWithColleges = async (studentId: string) => {
    const student = await Student.findById(studentId);
    if (!student) return [];
    
    const colleges = await College.find();

    const matches = colleges.map(college => {
        const score = calculateMatchScore(student.jobPreferences?.jobTypes || [], college.offeredPrograms || []);
        return { college, score };
    });

    // Sort matches by score in descending order
    matches.sort((a, b) => b.score - a.score);
    return matches;
};