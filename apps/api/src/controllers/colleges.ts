import { Request, Response } from 'express';
import { College } from '../models/College';
import { Student } from '../models/Student';
import { Job } from '../models/Job';
import { User } from '../models/User';
import Connection from '../models/Connection';
import { Recruiter } from '../models/Recruiter';
import { Types } from 'mongoose';

export const getAllColleges = async (req: Request, res: Response) => {
    try {
        const colleges = await College.find({ isActive: true })
            .select('_id name shortName domainCode address placementContact')
            .lean();
        res.status(200).json(colleges);
    } catch (error) {
        console.error('Error fetching colleges:', error);
        res.status(500).json({ message: 'Server error fetching colleges' });
    }
};

// Endpoint to get students by collegeId

export const getStudentsByCollege = async (req: Request, res: Response) => {
    const { collegeId } = req.query;

    if (!collegeId || !Types.ObjectId.isValid(collegeId as string)) {
        return res.status(400).json({ message: 'Invalid or missing collegeId' });
    }

    try {
        const students = await Student.find({
            collegeId: new Types.ObjectId(collegeId as string),
            isActive: true
        }).lean();

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students by collegeId:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

// Alias for route compatibility
export const getColleges = getAllColleges;

export const getCollegeById = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'College detail endpoint coming soon' });
};

// Alias for route compatibility
export const getCollegeByUserId = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const college = await College.findOne({ userId: userId }).lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        
        // Include approval status in response
        res.status(200).json({
            ...college,
            canAccessDashboard: college.approvalStatus === 'approved'
        });
    } catch (error) {
        console.error('Error fetching college by userId:', error);
        res.status(500).json({ message: 'Server error fetching college' });
    }
};

export const createCollege = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'College creation endpoint coming soon' });
};

export const updateCollege = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }

        const updateData = req.body;

        const updatedCollege = await College.findOneAndUpdate(
            { userId: userId },
            updateData,
            { new: true }
        ).lean();

        if (!updatedCollege) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.status(200).json({ college: updatedCollege });
    } catch (error) {
        console.error('Error updating college:', error);
        res.status(500).json({ message: 'Server error updating college' });
    }
};

// Update college profile (authenticated route)
export const updateCollegeProfile = async (req: Request, res: Response) => {
    try {
        const user = req.user as any;
        const userId = user._id || user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const updateData = req.body;

        const updatedCollege = await College.findOneAndUpdate(
            { userId: userId },
            { $set: updateData },
            { new: true }
        ).lean();

        if (!updatedCollege) {
            return res.status(404).json({ message: 'College profile not found' });
        }

        res.status(200).json(updatedCollege);
    } catch (error) {
        console.error('Error updating college profile:', error);
        res.status(500).json({ message: 'Server error updating college profile' });
    }
};

// Alias for route compatibility
export const updateCollegeByUserId = updateCollege;

export const deleteCollege = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'College deletion endpoint coming soon' });
};

export const manageRecruiterApproval = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recruiter approval endpoint coming soon' });
};

export const getCollegeStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find college by user ID
        const college = await College.findOne({ userId }).lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Get students count
        const totalStudents = await Student.countDocuments({ collegeId: college._id, isActive: true });
        const activeStudents = await Student.countDocuments({ 
            collegeId: college._id, 
            isActive: true,
            lastLoginDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
        });

        // Get jobs count
        const activeJobs = await Job.countDocuments({ 
            targetColleges: college._id,
            status: 'active'
        });

        // Mock data for now - you can implement real placement tracking later
        const stats = {
            totalStudents,
            activeStudents,
            totalPlacements: Math.floor(totalStudents * 0.7), // Mock 70% placement rate
            averagePackage: 6.5, // Mock average package
            topPackage: 25, // Mock top package
            placementPercentage: 70, // Mock placement percentage
            activeJobs,
            upcomingEvents: 0 // Will implement events later
        };

        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching college stats:', error);
        res.status(500).json({ message: 'Server error fetching college stats' });
    }
};

// Get college profile
export const getCollegeProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const college = await College.findOne({ userId }).lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.status(200).json(college);
    } catch (error) {
        console.error('Error fetching college profile:', error);
        res.status(500).json({ message: 'Server error fetching college profile' });
    }
};

// Get students for the college
export const getCollegeStudents = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find college by user ID
        const college = await College.findOne({ userId }).lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Get students for this college
        const students = await Student.find({ 
            collegeId: college._id,
            isActive: true 
        }).select('firstName lastName email department year enrollmentNumber skills cgpa resumeUrl isActive lastLoginDate createdAt').lean();

        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching college students:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

// Get jobs targeting this college
export const getCollegeJobs = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find college by user ID
        const college = await College.findOne({ userId }).lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Get jobs targeting this college
        const jobs = await Job.find({ 
            targetColleges: college._id,
            status: { $in: ['active', 'draft'] }
        }).populate('recruiterId', 'companyInfo.name').lean();

        // Transform the response to include company name
        const transformedJobs = jobs.map((job: any) => ({
            _id: job._id,
            title: job.title,
            company: job.recruiterId?.companyInfo?.name || job.companyName || 'Unknown Company',
            location: job.locations?.[0]?.city || 'Remote',
            type: job.jobType,
            description: job.description,
            requirements: job.requirements || job.requiredSkills || [],
            salary: job.salaryRange?.max || job.salary || 'Not specified',
            isActive: job.status === 'active',
            applicationDeadline: job.applicationDeadline,
            createdAt: job.createdAt
        }));

        res.status(200).json(transformedJobs);
    } catch (error) {
        console.error('Error fetching college jobs:', error);
        res.status(500).json({ message: 'Server error fetching jobs' });
    }
};

// Get college placements (mock data for now)
export const getCollegePlacements = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Mock placement data - you can implement real placement tracking later
        const placements = [
            {
                _id: new Types.ObjectId(),
                studentId: new Types.ObjectId(),
                studentName: 'John Doe',
                company: 'TechCorp',
                position: 'Software Engineer',
                package: 12,
                placementDate: new Date(),
                placementType: 'campus',
                status: 'placed'
            },
            {
                _id: new Types.ObjectId(),
                studentId: new Types.ObjectId(),
                studentName: 'Jane Smith',
                company: 'DataSoft',
                position: 'Data Analyst',
                package: 8,
                placementDate: new Date(),
                placementType: 'campus',
                status: 'placed'
            }
        ];

        res.status(200).json(placements);
    } catch (error) {
        console.error('Error fetching college placements:', error);
        res.status(500).json({ message: 'Server error fetching placements' });
    }
};

// Get college events (mock data for now)
export const getCollegeEvents = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Mock events data - you can implement real events later
        const events = [
            {
                _id: new Types.ObjectId(),
                title: 'Campus Placement Drive 2024',
                description: 'Annual placement drive with top companies',
                eventType: 'placement',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                time: '10:00 AM',
                venue: 'Main Auditorium',
                organizer: 'Placement Office',
                maxParticipants: 500,
                registeredCount: 156,
                isActive: true
            }
        ];

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching college events:', error);
        res.status(500).json({ message: 'Server error fetching events' });
    }
};

export const searchColleges = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Search colleges endpoint coming soon' });
};

// Resubmit college application
export const resubmitCollege = async (req: Request, res: Response) => {
    try {
        const { resubmissionNotes } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const college = await College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Reset approval status to pending and add resubmission notes
        college.approvalStatus = 'pending';
        college.resubmissionNotes = resubmissionNotes;
        college.rejectionReason = undefined; // Clear previous rejection reason
        await college.save();

        res.status(200).json({ 
            message: 'Application resubmitted successfully',
            college: college 
        });
    } catch (error) {
        console.error('Error resubmitting college application:', error);
        res.status(500).json({ message: 'Server error resubmitting application' });
    }
};

// Get college connections and partnerships
export const getCollegeConnections = async (req: Request, res: Response) => {
    try {
        const { collegeId } = req.params;
        
        if (!Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid college ID' 
            });
        }

        // Find all accepted connections where this college is involved
        const connections = await Connection.find({
            $or: [
                { requester: new Types.ObjectId(collegeId) },
                { target: new Types.ObjectId(collegeId) }
            ],
            status: 'accepted'
        }).lean();

        // Transform the data to include company information
        const formattedConnections = await Promise.all(
            connections.map(async (connection) => {
                try {
                    let companyInfo = null;
                    
                    // Determine which ID is the recruiter/company
                    const otherPartyId = connection.requester.toString() === collegeId 
                        ? connection.target 
                        : connection.requester;

                    // Try to find recruiter by user ID or model ID
                    let recruiter = await Recruiter.findOne({
                        $or: [
                            { _id: otherPartyId },
                            { userId: otherPartyId }
                        ]
                    }).populate('userId', 'email').lean();
                    
                    if (recruiter) {
                        companyInfo = {
                            companyName: (recruiter as any).companyName || 'Unknown Company',
                            industry: (recruiter as any).industry || 'Industry not specified',
                            website: (recruiter as any).website,
                            email: (recruiter.userId as any)?.email
                        };
                    }

                    // Count active jobs from this company if we have company info
                    const activeJobs = companyInfo ? await Job.countDocuments({
                        'company.name': companyInfo.companyName,
                        status: 'active'
                    }) : 0;

                    return {
                        connectionId: connection._id,
                        companyName: companyInfo?.companyName || 'Unknown Company',
                        industry: companyInfo?.industry || 'Industry not specified',
                        website: companyInfo?.website,
                        establishedDate: connection.acceptedAt || connection.createdAt,
                        activeJobs,
                        connectionType: 'partnership'
                    };
                } catch (error) {
                    console.error('Error processing connection:', error);
                    return null;
                }
            })
        );

        // Filter out null values and limit results
        const validConnections = formattedConnections
            .filter(conn => conn !== null)
            .slice(0, 20); // Limit to 20 connections

        res.status(200).json({
            success: true,
            data: validConnections,
            totalConnections: validConnections.length
        });

    } catch (error) {
        console.error('Error fetching college connections:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching college connections'
        });
    }
};
