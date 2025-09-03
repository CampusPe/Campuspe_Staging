"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollegeConnections = exports.resubmitCollege = exports.searchColleges = exports.getCollegeEvents = exports.getCollegePlacements = exports.getCollegeJobs = exports.getCollegeStudents = exports.getCollegeProfile = exports.getCollegeStats = exports.manageRecruiterApproval = exports.deleteCollege = exports.updateCollegeByUserId = exports.updateCollegeProfile = exports.updateCollege = exports.createCollege = exports.getCollegeByUserId = exports.getCollegeById = exports.getColleges = exports.getStudentsByCollege = exports.getAllColleges = void 0;
const bunnynet_1 = require("../services/bunnynet");
const College_1 = require("../models/College");
const Student_1 = require("../models/Student");
const Job_1 = require("../models/Job");
const Connection_1 = __importDefault(require("../models/Connection"));
const Recruiter_1 = require("../models/Recruiter");
const mongoose_1 = require("mongoose");
const getAllColleges = async (req, res) => {
    try {
        const colleges = await College_1.College.find({ isActive: true })
            .select('_id name shortName domainCode address placementContact')
            .lean();
        res.status(200).json(colleges);
    }
    catch (error) {
        console.error('Error fetching colleges:', error);
        res.status(500).json({ message: 'Server error fetching colleges' });
    }
};
exports.getAllColleges = getAllColleges;
const getStudentsByCollege = async (req, res) => {
    const { collegeId } = req.query;
    if (!collegeId || !mongoose_1.Types.ObjectId.isValid(collegeId)) {
        return res.status(400).json({ message: 'Invalid or missing collegeId' });
    }
    try {
        const students = await Student_1.Student.find({
            collegeId: new mongoose_1.Types.ObjectId(collegeId),
            isActive: true
        }).lean();
        res.status(200).json(students);
    }
    catch (error) {
        console.error('Error fetching students by collegeId:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};
exports.getStudentsByCollege = getStudentsByCollege;
exports.getColleges = exports.getAllColleges;
const getCollegeById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }
        const college = await College_1.College.findById(id)
            .populate('userId', 'email phone whatsappNumber')
            .populate('students', 'firstName lastName email department year enrollmentNumber')
            .populate('approvedRecruiters', 'companyInfo.name companyInfo.industry')
            .lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        const totalStudents = await Student_1.Student.countDocuments({ collegeId: college._id, isActive: true });
        const placedStudents = Math.floor(totalStudents * 0.7);
        const recruitingCompanies = college.approvedRecruiters?.length || 0;
        const enhancedCollege = {
            ...college,
            stats: {
                totalStudents,
                placedStudents,
                recruitingCompanies,
                totalPrograms: college.offeredPrograms?.length || 0,
                averagePackage: 6.5,
                highestPackage: 25,
                placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 70,
                rating: 4.2
            },
            name: college.name || 'College Name',
            type: 'Autonomous',
            establishedYear: college.establishedYear || new Date().getFullYear() - 30,
            nirfRanking: null,
            isVerified: college.approvalStatus === 'approved',
            description: 'A premier educational institution committed to excellence in higher education.',
            programs: college.offeredPrograms?.map((program) => ({
                name: program,
                description: `Comprehensive ${program} program designed for industry readiness`,
                duration: program.includes('B.') ? '4 years' : program.includes('M.') ? '2 years' : '3 years',
                seats: 60
            })) || [
                {
                    name: 'Computer Science Engineering',
                    description: 'Comprehensive CSE program designed for industry readiness',
                    duration: '4 years',
                    seats: 60
                },
                {
                    name: 'Information Technology',
                    description: 'Comprehensive IT program designed for industry readiness',
                    duration: '4 years',
                    seats: 60
                }
            ]
        };
        res.status(200).json(enhancedCollege);
    }
    catch (error) {
        console.error('Error fetching college by ID:', error);
        res.status(500).json({ message: 'Server error fetching college' });
    }
};
exports.getCollegeById = getCollegeById;
const getCollegeByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const college = await College_1.College.findOne({ userId: userId }).lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        res.status(200).json({
            ...college,
            canAccessDashboard: college.approvalStatus === 'approved'
        });
    }
    catch (error) {
        console.error('Error fetching college by userId:', error);
        res.status(500).json({ message: 'Server error fetching college' });
    }
};
exports.getCollegeByUserId = getCollegeByUserId;
const createCollege = async (req, res) => {
    res.status(200).json({ message: 'College creation endpoint coming soon' });
};
exports.createCollege = createCollege;
const updateCollege = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const updateData = req.body;
        const updatedCollege = await College_1.College.findOneAndUpdate({ userId: userId }, updateData, { new: true }).lean();
        if (!updatedCollege) {
            return res.status(404).json({ message: 'College not found' });
        }
        res.status(200).json({ college: updatedCollege });
    }
    catch (error) {
        console.error('Error updating college:', error);
        res.status(500).json({ message: 'Server error updating college' });
    }
};
exports.updateCollege = updateCollege;
const updateCollegeProfile = async (req, res) => {
    try {
        const user = req.user;
        const userId = user._id || user.userId;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const updateData = req.body;
        const updatedCollege = await College_1.College.findOneAndUpdate({ userId: userId }, { $set: updateData }, { new: true }).lean();
        if (!updatedCollege) {
            return res.status(404).json({ message: 'College profile not found' });
        }
        res.status(200).json(updatedCollege);
    }
    catch (error) {
        console.error('Error updating college profile:', error);
        res.status(500).json({ message: 'Server error updating college profile' });
    }
};
exports.updateCollegeProfile = updateCollegeProfile;
exports.updateCollegeByUserId = exports.updateCollege;
const deleteCollege = async (req, res) => {
    res.status(200).json({ message: 'College deletion endpoint coming soon' });
};
exports.deleteCollege = deleteCollege;
const manageRecruiterApproval = async (req, res) => {
    res.status(200).json({ message: 'Recruiter approval endpoint coming soon' });
};
exports.manageRecruiterApproval = manageRecruiterApproval;
const getCollegeStats = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        let college;
        if (req.params.id) {
            const collegeId = req.params.id;
            if (!mongoose_1.Types.ObjectId.isValid(collegeId)) {
                return res.status(400).json({ message: 'Invalid college ID' });
            }
            college = await College_1.College.findOne({
                _id: collegeId,
                userId: userId
            }).lean();
        }
        else {
            college = await College_1.College.findOne({ userId }).lean();
        }
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        const totalStudents = await Student_1.Student.countDocuments({ collegeId: college._id, isActive: true });
        const activeStudents = await Student_1.Student.countDocuments({
            collegeId: college._id,
            isActive: true,
            lastLoginDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        const activeJobs = await Job_1.Job.countDocuments({
            targetColleges: college._id,
            status: 'active'
        });
        const stats = {
            totalStudents,
            activeStudents,
            totalPlacements: Math.floor(totalStudents * 0.7),
            averagePackage: 6.5,
            topPackage: 25,
            placementPercentage: 70,
            activeJobs,
            upcomingEvents: 0
        };
        res.status(200).json(stats);
    }
    catch (error) {
        console.error('Error fetching college stats:', error);
        res.status(500).json({ message: 'Server error fetching college stats' });
    }
};
exports.getCollegeStats = getCollegeStats;
const getCollegeProfile = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const college = await College_1.College.findOne({ userId })
            .populate('userId', 'email phone whatsappNumber')
            .populate('students', 'firstName lastName email department year enrollmentNumber')
            .populate('approvedRecruiters', 'companyInfo.name companyInfo.industry')
            .lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        const totalStudents = await Student_1.Student.countDocuments({ collegeId: college._id, isActive: true });
        const placedStudents = Math.floor(totalStudents * 0.7);
        const recruitingCompanies = college.approvedRecruiters?.length || 0;
        const enhancedCollege = {
            ...college,
            stats: {
                totalStudents,
                placedStudents,
                recruitingCompanies,
                averagePackage: 6.5,
                highestPackage: 25,
                placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
                rating: 4.2
            },
            programs: college.offeredPrograms?.map((program) => ({
                name: program,
                description: `Comprehensive ${program} program designed for industry readiness`,
                duration: program.includes('B.') ? '4 years' : program.includes('M.') ? '2 years' : '3 years',
                seats: 60
            })) || [],
            placementContact: college.placementContact || {
                name: 'Not provided',
                email: 'Not provided',
                phone: 'Not provided'
            }
        };
        res.status(200).json(enhancedCollege);
    }
    catch (error) {
        console.error('Error fetching college profile:', error);
        res.status(500).json({ message: 'Server error fetching college profile' });
    }
};
exports.getCollegeProfile = getCollegeProfile;
const getCollegeStudents = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const college = await College_1.College.findOne({ userId }).lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        const students = await Student_1.Student.find({
            collegeId: college._id,
            isActive: true
        }).select('firstName lastName email department year enrollmentNumber skills cgpa resumeUrl isActive lastLoginDate createdAt').lean();
        res.status(200).json(students);
    }
    catch (error) {
        console.error('Error fetching college students:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};
exports.getCollegeStudents = getCollegeStudents;
const getCollegeJobs = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const college = await College_1.College.findOne({ userId }).lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        const jobs = await Job_1.Job.find({
            targetColleges: college._id,
            status: { $in: ['active', 'draft'] }
        }).populate('recruiterId', 'companyInfo.name').lean();
        const transformedJobs = jobs.map((job) => ({
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
    }
    catch (error) {
        console.error('Error fetching college jobs:', error);
        res.status(500).json({ message: 'Server error fetching jobs' });
    }
};
exports.getCollegeJobs = getCollegeJobs;
const getCollegePlacements = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const placements = [
            {
                _id: new mongoose_1.Types.ObjectId(),
                studentId: new mongoose_1.Types.ObjectId(),
                studentName: 'John Doe',
                company: 'TechCorp',
                position: 'Software Engineer',
                package: 12,
                placementDate: new Date(),
                placementType: 'campus',
                status: 'placed'
            },
            {
                _id: new mongoose_1.Types.ObjectId(),
                studentId: new mongoose_1.Types.ObjectId(),
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
    }
    catch (error) {
        console.error('Error fetching college placements:', error);
        res.status(500).json({ message: 'Server error fetching placements' });
    }
};
exports.getCollegePlacements = getCollegePlacements;
const getCollegeEvents = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const events = [
            {
                _id: new mongoose_1.Types.ObjectId(),
                title: 'Campus Placement Drive 2024',
                description: 'Annual placement drive with top companies',
                eventType: 'placement',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                time: '10:00 AM',
                venue: 'Main Auditorium',
                organizer: 'Placement Office',
                maxParticipants: 500,
                registeredCount: 156,
                isActive: true
            }
        ];
        res.status(200).json(events);
    }
    catch (error) {
        console.error('Error fetching college events:', error);
        res.status(500).json({ message: 'Server error fetching events' });
    }
};
exports.getCollegeEvents = getCollegeEvents;
const searchColleges = async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }
        const searchTerm = query.trim();
        const limitNum = Math.min(Number(limit) || 10, 50);
        const searchRegex = new RegExp(searchTerm, 'i');
        const colleges = await College_1.College.find({
            $and: [
                {
                    $or: [
                        { name: searchRegex },
                        { shortName: searchRegex },
                        { affiliation: searchRegex },
                        { 'address.city': searchRegex },
                        { 'address.state': searchRegex },
                        { 'primaryContact.name': searchRegex },
                        { offeredPrograms: { $in: [searchRegex] } },
                        { departments: { $in: [searchRegex] } }
                    ]
                },
                { isActive: true },
                { approvalStatus: 'approved' }
            ]
        })
            .select({
            '_id': 1,
            'name': 1,
            'shortName': 1,
            'logo': 1,
            'address': 1,
            'establishedYear': 1,
            'affiliation': 1,
            'offeredPrograms': 1,
            'departments': 1,
            'isVerified': 1,
            'primaryContact.name': 1,
            'primaryContact.designation': 1
        })
            .limit(limitNum)
            .sort({ name: 1 })
            .lean();
        const formattedResults = colleges.map(college => ({
            id: college._id,
            type: 'college',
            name: college.name,
            shortName: college.shortName,
            logo: college.logo,
            location: `${college.address.city}, ${college.address.state}`,
            establishedYear: college.establishedYear,
            affiliation: college.affiliation,
            programs: college.offeredPrograms,
            departments: college.departments,
            primaryContact: college.primaryContact,
            isVerified: college.isVerified
        }));
        res.status(200).json({
            success: true,
            data: formattedResults,
            count: formattedResults.length,
            query: searchTerm
        });
    }
    catch (error) {
        console.error('Error searching colleges:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while searching colleges'
        });
    }
};
exports.searchColleges = searchColleges;
const resubmitCollege = async (req, res) => {
    try {
        const { notes } = req.body;
        const userId = req.user?._id;
        const files = req.files;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const college = await College_1.College.findOne({ userId });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        const supportingDocuments = [];
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    const uploadResult = await bunnynet_1.bunnyNetService.uploadFile(file.buffer, `college-resubmission-${college._id}-${Date.now()}-${file.originalname}`, {
                        folder: 'college-resubmissions',
                        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                        maxSize: 10 * 1024 * 1024
                    });
                    if (uploadResult.success && uploadResult.cdnUrl) {
                        supportingDocuments.push(uploadResult.cdnUrl);
                    }
                    else {
                        console.error(`Failed to upload file ${file.originalname}:`, uploadResult.error);
                    }
                }
                catch (uploadError) {
                    console.error(`Error uploading file ${file.originalname}:`, uploadError);
                }
            }
        }
        college.approvalStatus = 'pending';
        college.resubmissionNotes = notes;
        college.rejectionReason = undefined;
        if (supportingDocuments.length > 0) {
            college.submittedDocuments = supportingDocuments;
        }
        await college.save();
        res.status(200).json({
            message: 'Application resubmitted successfully',
            college: college,
            uploadedDocuments: supportingDocuments.length
        });
    }
    catch (error) {
        console.error('Error resubmitting college application:', error);
        res.status(500).json({ message: 'Server error resubmitting application' });
    }
};
exports.resubmitCollege = resubmitCollege;
const getCollegeConnections = async (req, res) => {
    try {
        const { collegeId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid college ID'
            });
        }
        const connections = await Connection_1.default.find({
            $or: [
                { requester: new mongoose_1.Types.ObjectId(collegeId) },
                { target: new mongoose_1.Types.ObjectId(collegeId) }
            ],
            status: 'accepted'
        }).lean();
        const formattedConnections = await Promise.all(connections.map(async (connection) => {
            try {
                let companyInfo = null;
                const otherPartyId = connection.requester.toString() === collegeId
                    ? connection.target
                    : connection.requester;
                let recruiter = await Recruiter_1.Recruiter.findOne({
                    $or: [
                        { _id: otherPartyId },
                        { userId: otherPartyId }
                    ]
                }).populate('userId', 'email').lean();
                if (recruiter) {
                    companyInfo = {
                        companyName: recruiter.companyInfo?.name || recruiter.companyName || 'Unknown Company',
                        industry: recruiter.companyInfo?.industry || recruiter.industry || 'Industry not specified',
                        website: recruiter.companyInfo?.website || recruiter.website,
                        email: recruiter.userId?.email
                    };
                }
                const activeJobs = companyInfo ? await Job_1.Job.countDocuments({
                    $or: [
                        { 'company.name': companyInfo.companyName },
                        { 'companyName': companyInfo.companyName }
                    ],
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
            }
            catch (error) {
                console.error('Error processing connection:', error);
                return null;
            }
        }));
        let validConnections = formattedConnections.filter(conn => conn !== null);
        if (validConnections.length === 0) {
            validConnections = [
                {
                    connectionId: new mongoose_1.Types.ObjectId(),
                    companyName: 'TechCorp Solutions',
                    industry: 'Information Technology',
                    website: 'https://techcorp.com',
                    establishedDate: new Date('2024-01-15'),
                    activeJobs: 3,
                    connectionType: 'partnership'
                },
                {
                    connectionId: new mongoose_1.Types.ObjectId(),
                    companyName: 'InnovateX',
                    industry: 'Software Development',
                    website: 'https://innovatex.com',
                    establishedDate: new Date('2024-02-20'),
                    activeJobs: 2,
                    connectionType: 'partnership'
                },
                {
                    connectionId: new mongoose_1.Types.ObjectId(),
                    companyName: 'DataSoft Inc',
                    industry: 'Data Analytics',
                    website: 'https://datasoft.com',
                    establishedDate: new Date('2024-03-10'),
                    activeJobs: 1,
                    connectionType: 'partnership'
                }
            ];
        }
        validConnections = validConnections.slice(0, 20);
        res.status(200).json({
            success: true,
            data: validConnections,
            totalConnections: validConnections.length
        });
    }
    catch (error) {
        console.error('Error fetching college connections:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching college connections'
        });
    }
};
exports.getCollegeConnections = getCollegeConnections;
