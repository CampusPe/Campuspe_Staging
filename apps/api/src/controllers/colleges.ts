import { Request, Response } from 'express';
import { College } from '../models/College';
import { Student } from '../models/Student';
import { Types } from 'mongoose';

export const getAllColleges = async (req: Request, res: Response) => {
    try {
        const colleges = await College.find({ isActive: true }).select('_id name domainCode').lean();
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

// Alias for route compatibility
export const updateCollegeByUserId = updateCollege;

export const deleteCollege = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'College deletion endpoint coming soon' });
};

export const manageRecruiterApproval = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recruiter approval endpoint coming soon' });
};

export const getCollegeStats = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'College stats endpoint coming soon' });
};

export const searchColleges = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Search colleges endpoint coming soon' });
};

// Resubmit college application
export const resubmitCollege = async (req: Request, res: Response) => {
    try {
        const { resubmissionNotes } = req.body;
        const userId = req.user?.userId;

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
