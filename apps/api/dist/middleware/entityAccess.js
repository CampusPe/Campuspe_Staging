"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEntityAccess = exports.checkRecruiterAccess = exports.checkCollegeAccess = void 0;
const College_1 = require("../models/College");
const Recruiter_1 = require("../models/Recruiter");
const checkCollegeAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (req.user.role !== 'college') {
            return next();
        }
        const college = await College_1.College.findOne({ userId: req.user._id });
        if (!college) {
            return res.status(404).json({ message: 'College profile not found' });
        }
        if (college.approvalStatus !== 'approved') {
            return res.status(403).json({
                message: 'College approval pending',
                status: college.approvalStatus,
                canResubmit: college.approvalStatus === 'rejected'
            });
        }
        if (!college.isActive) {
            return res.status(403).json({
                message: 'College account is deactivated. Please contact admin.',
                status: 'deactivated'
            });
        }
        req.college = college;
        next();
    }
    catch (error) {
        console.error('College access check error:', error);
        res.status(500).json({ message: 'Server error checking college access' });
    }
};
exports.checkCollegeAccess = checkCollegeAccess;
const checkRecruiterAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (req.user.role !== 'recruiter') {
            return next();
        }
        const recruiter = await Recruiter_1.Recruiter.findOne({ userId: req.user._id });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        if (!recruiter.isActive) {
            return res.status(403).json({
                message: 'Recruiter account is deactivated. Please contact admin.',
                status: 'deactivated'
            });
        }
        req.recruiter = recruiter;
        next();
    }
    catch (error) {
        console.error('Recruiter access check error:', error);
        res.status(500).json({ message: 'Server error checking recruiter access' });
    }
};
exports.checkRecruiterAccess = checkRecruiterAccess;
const checkEntityAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (req.user.role === 'college') {
            return (0, exports.checkCollegeAccess)(req, res, next);
        }
        else if (req.user.role === 'recruiter') {
            return (0, exports.checkRecruiterAccess)(req, res, next);
        }
        else {
            return next();
        }
    }
    catch (error) {
        console.error('Entity access check error:', error);
        res.status(500).json({ message: 'Server error checking entity access' });
    }
};
exports.checkEntityAccess = checkEntityAccess;
