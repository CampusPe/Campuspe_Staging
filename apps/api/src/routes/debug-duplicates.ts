import express from 'express';
import { Student } from '../models/Student';

const router = express.Router();

// Debug endpoint to check for duplicate students
router.get('/check-duplicate-students', async (req, res) => {
    try {
        console.log('🔍 Checking for duplicate students...');

        // Get all active students with their user data
        const students: any[] = await Student.find({
            isActive: true
        }).populate('userId', 'phone whatsappNumber email').lean();

        console.log(`Found ${students.length} total active students`);

        // Group students by phone number to find duplicates
        const phoneGroups: { [key: string]: any[] } = {};
        const emailGroups: { [key: string]: any[] } = {};
        const userIdGroups: { [key: string]: any[] } = {};

        for (const student of students) {
            if (student.userId) {
                // Group by phone
                const phone = student.userId.whatsappNumber || student.userId.phone;
                if (phone) {
                    if (!phoneGroups[phone]) phoneGroups[phone] = [];
                    phoneGroups[phone].push(student);
                }

                // Group by email
                const email = student.userId.email;
                if (email) {
                    if (!emailGroups[email]) emailGroups[email] = [];
                    emailGroups[email].push(student);
                }

                // Group by userId to see if one user has multiple student records
                const userId = student.userId._id.toString();
                if (!userIdGroups[userId]) userIdGroups[userId] = [];
                userIdGroups[userId].push(student);
            }
        }

        // Find duplicates
        const duplicatePhones = Object.entries(phoneGroups)
            .filter(([phone, students]) => students.length > 1)
            .map(([phone, students]) => ({
                phone,
                count: students.length,
                students: students.map(s => ({
                    studentId: s._id,
                    name: `${s.firstName} ${s.lastName}`,
                    email: s.userId?.email
                }))
            }));

        const duplicateEmails = Object.entries(emailGroups)
            .filter(([email, students]) => students.length > 1)
            .map(([email, students]) => ({
                email,
                count: students.length,
                students: students.map(s => ({
                    studentId: s._id,
                    name: `${s.firstName} ${s.lastName}`,
                    phone: s.userId?.whatsappNumber || s.userId?.phone
                }))
            }));

        const duplicateUserIds = Object.entries(userIdGroups)
            .filter(([userId, students]) => students.length > 1)
            .map(([userId, students]) => ({
                userId,
                count: students.length,
                students: students.map(s => ({
                    studentId: s._id,
                    name: `${s.firstName} ${s.lastName}`
                }))
            }));

        // Sample of recent student processing to see patterns
        const recentStudents = students.slice(0, 10).map(s => ({
            studentId: s._id,
            name: `${s.firstName} ${s.lastName}`,
            phone: s.userId?.whatsappNumber || s.userId?.phone,
            email: s.userId?.email,
            userId: s.userId?._id
        }));

        res.json({
            summary: {
                totalActiveStudents: students.length,
                duplicatePhoneNumbers: duplicatePhones.length,
                duplicateEmails: duplicateEmails.length,
                duplicateUserIds: duplicateUserIds.length
            },
            duplicates: {
                byPhone: duplicatePhones,
                byEmail: duplicateEmails,
                byUserId: duplicateUserIds
            },
            sampleStudents: recentStudents
        });

    } catch (error: any) {
        console.error('Error checking duplicates:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Debug endpoint to simulate career alert processing for a specific student
router.post('/test-student-processing', async (req, res) => {
    try {
        const { studentId, jobDescription } = req.body;

        if (!studentId || !jobDescription) {
            return res.status(400).json({
                error: 'studentId and jobDescription are required'
            });
        }

        const student: any = await Student.findById(studentId)
            .populate('userId', 'phone whatsappNumber email')
            .lean();

        if (!student) {
            return res.status(404).json({
                error: 'Student not found'
            });
        }

        // Get student resume content (same logic as career alerts)
        let resumeContent = student.resumeText || 
            (student.resumeAnalysis?.summary ? 
                `${student.resumeAnalysis.summary}\nSkills: ${student.resumeAnalysis.skills?.join(', ')}` : 
                null);
        
        if (!resumeContent) {
            resumeContent = `Profile for ${student.firstName} ${student.lastName}. Skills: ${student.skills?.map((s: any) => s.name || s).join(', ') || 'Not specified'}. Education: ${student.education?.map((e: any) => `${e.degree} in ${e.field}`).join(', ') || 'Not specified'}. Experience: ${student.experience?.map((e: any) => `${e.position} at ${e.company}`).join(', ') || 'Fresher'}`;
        }

        // Test AI matching multiple times to check for consistency
        const AIResumeMatchingService = require('../services/ai-resume-matching').default;
        const results: any[] = [];

        for (let i = 0; i < 3; i++) {
            const matchResult = await AIResumeMatchingService.analyzeResumeMatch(
                resumeContent,
                jobDescription
            );
            results.push({
                attempt: i + 1,
                matchScore: matchResult.matchScore,
                explanation: matchResult.explanation,
                skillsMatched: matchResult.skillsMatched
            });
        }

        res.json({
            student: {
                id: student._id,
                name: `${student.firstName} ${student.lastName}`,
                phone: student.userId?.whatsappNumber || student.userId?.phone,
                email: student.userId?.email
            },
            resumeContent: resumeContent.substring(0, 200) + '...',
            matchingResults: results,
            consistencyCheck: {
                allScoresEqual: results.every(r => r.matchScore === results[0].matchScore),
                scoreRange: {
                    min: Math.min(...results.map(r => r.matchScore)),
                    max: Math.max(...results.map(r => r.matchScore))
                }
            }
        });

    } catch (error: any) {
        console.error('Error testing student processing:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

export default router;
