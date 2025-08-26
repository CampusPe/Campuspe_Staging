"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const students_1 = require("../controllers/students");
const student_career_1 = require("../controllers/student-career");
const job_applications_1 = require("../controllers/job-applications");
const student_applications_enhanced_1 = require("../controllers/student-applications-enhanced");
const auth_1 = __importDefault(require("../middleware/auth"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
        }
    },
});
const router = express_1.default.Router();
router.get('/search', students_1.searchStudents);
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No resume file provided'
            });
        }
        const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        setTimeout(() => {
            console.log(`Resume analysis completed for ${req.file.originalname} with ID: ${analysisId}`);
        }, 1000);
        res.json({
            success: true,
            message: 'Resume uploaded and analysis started',
            analysisId,
            filename: req.file.originalname,
            size: req.file.size
        });
    }
    catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload resume'
        });
    }
});
router.get('/college/:collegeId', students_1.getStudentsByCollege);
router.get('/applications', auth_1.default, job_applications_1.getStudentApplications);
router.get('/applications/enhanced', auth_1.default, student_applications_enhanced_1.getEnhancedStudentApplications);
router.patch('/applications/:applicationId/status', auth_1.default, student_applications_enhanced_1.updateApplicationStatus);
router.get('/', students_1.getAllStudents);
router.get('/user/:userId', students_1.getStudentByUserId);
router.get('/profile', auth_1.default, async (req, res) => {
    try {
        const user = req.user;
        const { Student } = require('../models/Student');
        const student = await Student.findOne({ userId: user._id })
            .populate('collegeId', 'name address')
            .populate('userId', 'email')
            .select('-password');
        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }
        res.json(student);
    }
    catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/:id', students_1.getStudentById);
router.get('/:id/profile', auth_1.default, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const { Student } = require('../models/Student');
        const student = await Student.findById(id)
            .populate('collegeId', 'name address')
            .populate('userId', 'email')
            .select('-password');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    }
    catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/:id/matches', student_career_1.getStudentJobMatches);
router.get('/:id/analyze', student_career_1.analyzeStudentProfile);
router.get('/:id/resume-analyses', auth_1.default, job_applications_1.getResumeAnalysis);
router.post('/', students_1.createStudent);
router.post('/:id/alerts', student_career_1.triggerStudentJobAlerts);
router.put('/:id/profile', student_career_1.updateStudentProfile);
router.put('/user/:userId', students_1.updateStudentByUserId);
router.put('/:id', students_1.updateStudent);
router.delete('/:id', students_1.deleteStudent);
exports.default = router;
