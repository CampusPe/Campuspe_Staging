import { Request, Response } from 'express';
import { Recruiter } from '../models/Recruiter';
import { Types } from 'mongoose';

export const getAllRecruiters = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recruiter endpoints coming soon' });
};

export const getRecruiterById = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recruiter detail endpoint coming soon' });
};

// Alias for route compatibility
export const getRecruiterByUserId = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const recruiter = await Recruiter.findOne({ userId: userId }).lean();
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        
        // Include approval status in response
        res.status(200).json({
            ...recruiter,
            canAccessDashboard: recruiter.approvalStatus === 'approved'
        });
    } catch (error) {
        console.error('Error fetching recruiter by userId:', error);
        res.status(500).json({ message: 'Server error fetching recruiter' });
    }
};

export const createRecruiter = async (req: Request, res: Response) => {
    res.status(200).json({ 
        message: 'Recruiter registration should use /api/auth/register endpoint',
        redirect: '/api/auth/register'
    });
};

export const updateRecruiterByUserId = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }

        const updateData = req.body;

        // Map flat updateData keys to nested fields in the document
        const mappedUpdateData: any = {};

        if (updateData.firstName !== undefined) mappedUpdateData['recruiterProfile.firstName'] = updateData.firstName;
        if (updateData.lastName !== undefined) mappedUpdateData['recruiterProfile.lastName'] = updateData.lastName;
        if (updateData.designation !== undefined) mappedUpdateData['recruiterProfile.designation'] = updateData.designation;
        if (updateData.department !== undefined) mappedUpdateData['recruiterProfile.department'] = updateData.department;
        if (updateData.linkedinUrl !== undefined) mappedUpdateData['recruiterProfile.linkedinUrl'] = updateData.linkedinUrl;
        if (updateData.preferredContactMethod !== undefined) mappedUpdateData['preferredContactMethod'] = updateData.preferredContactMethod;
        if (updateData.whatsappNumber !== undefined) mappedUpdateData['whatsappNumber'] = updateData.whatsappNumber;
        if (updateData.companyName !== undefined) mappedUpdateData['companyInfo.name'] = updateData.companyName;
        if (updateData.industry !== undefined) mappedUpdateData['companyInfo.industry'] = updateData.industry;
        if (updateData.website !== undefined) mappedUpdateData['companyInfo.website'] = updateData.website;
        if (updateData.description !== undefined) mappedUpdateData['companyInfo.description'] = updateData.description;
        if (updateData.size !== undefined) mappedUpdateData['companyInfo.size'] = updateData.size;
        if (updateData.foundedYear !== undefined) mappedUpdateData['companyInfo.foundedYear'] = updateData.foundedYear;
        if (updateData.headquartersCity !== undefined) mappedUpdateData['companyInfo.headquarters.city'] = updateData.headquartersCity;
        if (updateData.headquartersState !== undefined) mappedUpdateData['companyInfo.headquarters.state'] = updateData.headquartersState;
        if (updateData.headquartersCountry !== undefined) mappedUpdateData['companyInfo.headquarters.country'] = updateData.headquartersCountry;

        const updatedRecruiter = await Recruiter.findOneAndUpdate(
            { userId: userId },
            { $set: mappedUpdateData },
            { new: true }
        ).lean();

        if (!updatedRecruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        res.status(200).json({ message: 'Recruiter updated successfully', recruiter: updatedRecruiter });
    } catch (error) {
        console.error('Error updating recruiter:', error);
        res.status(500).json({ message: 'Server error updating recruiter' });
    }
};

export const updateRecruiter = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recruiter update endpoint coming soon' });
};

export const deleteRecruiter = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recruiter deletion endpoint coming soon' });
};

export const getRecruitersByIndustry = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recruiters by industry endpoint coming soon' });
};

export const searchRecruiters = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Search recruiters endpoint coming soon' });
};

export const verifyRecruiter = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Verify recruiter endpoint coming soon' });
};

export const requestCollegeApproval = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Request college approval endpoint coming soon' });
};

export const notifyStudents = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Notify students endpoint coming soon' });
};

// Resubmit recruiter application
export const resubmitRecruiter = async (req: Request, res: Response) => {
    try {
        const { resubmissionNotes } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        // Reset approval status to pending and add resubmission notes
        recruiter.approvalStatus = 'pending';
        recruiter.resubmissionNotes = resubmissionNotes;
        recruiter.rejectionReason = undefined; // Clear previous rejection reason
        await recruiter.save();

        res.status(200).json({ 
            message: 'Application resubmitted successfully',
            recruiter: recruiter 
        });
    } catch (error) {
        console.error('Error resubmitting recruiter application:', error);
        res.status(500).json({ message: 'Server error resubmitting application' });
    }
};
