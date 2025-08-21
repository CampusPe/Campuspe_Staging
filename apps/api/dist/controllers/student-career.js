"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeStudentProfile = exports.triggerStudentJobAlerts = exports.getStudentJobMatches = exports.updateStudentProfile = void 0;
const Student_1 = require("../models/Student");
const mongoose_1 = require("mongoose");
const career_alerts_1 = __importDefault(require("../services/career-alerts"));
const centralized_matching_1 = __importDefault(require("../services/centralized-matching"));
const ai_matching_1 = __importDefault(require("../services/ai-matching"));
const updateStudentProfile = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        const updatedStudent = await Student_1.Student.findByIdAndUpdate(id, {
            $set: {
                ...updateData,
                lastModified: new Date()
            }
        }, { new: true });
        if (!updatedStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        if (updateData.isPlacementReady || updatedStudent.isPlacementReady) {
            setImmediate(async () => {
                try {
                    await career_alerts_1.default.processStudentProfileUpdate(new mongoose_1.Types.ObjectId(id));
                }
                catch (error) {
                    console.error(`Background matching failed for student ${id}:`, error);
                }
            });
        }
        res.status(200).json({
            success: true,
            message: 'Student profile updated successfully',
            data: updatedStudent
        });
    }
    catch (error) {
        console.error('Error updating student profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateStudentProfile = updateStudentProfile;
const getStudentJobMatches = async (req, res) => {
    const { id } = req.params;
    const { threshold = 20, limit = 20 } = req.query;
    try {
        const student = await Student_1.Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        const result = await centralized_matching_1.default.getStudentJobMatches(id, {
            threshold: Number(threshold) / 100,
            limit: Number(limit)
        });
        const stableMatches = result.matches.map(match => ({
            ...match,
            matchScore: Math.round(match.matchScore),
            calculatedAt: new Date().toISOString()
        }));
        res.status(200).json({
            success: true,
            data: {
                studentId: id,
                totalMatches: result.matchCount,
                returnedMatches: stableMatches.length,
                threshold: Number(threshold),
                matches: stableMatches
            }
        });
    }
    catch (error) {
        console.error('Error getting student job matches:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get job matches',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getStudentJobMatches = getStudentJobMatches;
const triggerStudentJobAlerts = async (req, res) => {
    const { id } = req.params;
    try {
        const student = await Student_1.Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        await career_alerts_1.default.processStudentProfileUpdate(new mongoose_1.Types.ObjectId(id));
        res.status(200).json({
            success: true,
            message: 'Job alerts triggered successfully for student'
        });
    }
    catch (error) {
        console.error('Error triggering student job alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger job alerts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.triggerStudentJobAlerts = triggerStudentJobAlerts;
const analyzeStudentProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const student = await Student_1.Student.findById(id).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        const studentEmbedding = await ai_matching_1.default.createStudentEmbedding(new mongoose_1.Types.ObjectId(id), student);
        res.status(200).json({
            success: true,
            data: {
                studentId: id,
                aiAnalysis: studentEmbedding.metadata,
                recommendations: {
                    profileCompleteness: calculateProfileCompleteness(student),
                    suggestedImprovements: getSuggestedImprovements(student, studentEmbedding.metadata),
                    careerPaths: getCareerPathSuggestions(studentEmbedding.metadata)
                }
            }
        });
    }
    catch (error) {
        console.error('Error analyzing student profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze student profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.analyzeStudentProfile = analyzeStudentProfile;
function calculateProfileCompleteness(student) {
    let completeness = 0;
    let totalFields = 0;
    totalFields += 4;
    if (student.firstName)
        completeness++;
    if (student.lastName)
        completeness++;
    if (student.collegeId)
        completeness++;
    if (student.studentId)
        completeness++;
    totalFields += 1;
    if (student.skills && student.skills.length > 0)
        completeness++;
    totalFields += 1;
    if (student.education && student.education.length > 0)
        completeness++;
    totalFields += 1;
    if (student.experience && student.experience.length > 0)
        completeness++;
    totalFields += 1;
    if (student.jobPreferences && student.jobPreferences.jobTypes?.length > 0)
        completeness++;
    return Math.round((completeness / totalFields) * 100);
}
function getSuggestedImprovements(student, aiAnalysis) {
    const suggestions = [];
    if (!student.skills || student.skills.length < 5) {
        suggestions.push('Add more skills to your profile (aim for at least 5 relevant skills)');
    }
    if (!student.experience || student.experience.length === 0) {
        suggestions.push('Add your work experience, internships, or project experience');
    }
    if (!student.resumeFile) {
        suggestions.push('Upload your resume for better job matching');
    }
    if (!student.jobPreferences?.preferredLocations?.length) {
        suggestions.push('Specify your preferred work locations');
    }
    if (aiAnalysis.skills.length < 3) {
        suggestions.push('Include more technical skills relevant to your field');
    }
    return suggestions;
}
function getCareerPathSuggestions(aiAnalysis) {
    const category = aiAnalysis.category_preference;
    const skills = aiAnalysis.skills;
    const careerPaths = [];
    if (category === 'Tech') {
        if (skills.some((skill) => ['javascript', 'react', 'node'].includes(skill))) {
            careerPaths.push('Full Stack Developer');
            careerPaths.push('Frontend Developer');
            careerPaths.push('Backend Developer');
        }
        if (skills.some((skill) => ['python', 'machine learning', 'data'].includes(skill))) {
            careerPaths.push('Data Scientist');
            careerPaths.push('Machine Learning Engineer');
        }
        if (skills.some((skill) => ['java', 'spring', 'microservices'].includes(skill))) {
            careerPaths.push('Java Developer');
            careerPaths.push('Backend Engineer');
        }
    }
    else if (category === 'Non-Tech') {
        careerPaths.push('Business Analyst');
        careerPaths.push('Project Manager');
        careerPaths.push('Marketing Specialist');
    }
    return careerPaths.slice(0, 5);
}
