"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchStudents = exports.getStudentsByCollege = exports.deleteStudent = exports.updateStudentByUserId = exports.updateStudent = exports.createStudent = exports.getStudentByUserId = exports.getStudentById = exports.getAllStudents = void 0;
const Student_1 = require("../models/Student");
const mongoose_1 = require("mongoose");
const getAllStudents = async (req, res) => {
    try {
        const students = await Student_1.Student.find({ isActive: true }).lean();
        res.status(200).json(students);
    }
    catch (error) {
        console.error('Error fetching all students:', error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};
exports.getAllStudents = getAllStudents;
const getStudentById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid student ID' });
        }
        const student = await Student_1.Student.findById(id)
            .populate('userId', 'email phone whatsappNumber')
            .populate('collegeId', 'name address establishedYear affiliation departments')
            .lean();
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        const transformedStudent = {
            ...student,
            profile: {
                skills: Array.isArray(student.skills) ? student.skills.map(skill => typeof skill === 'string' ? skill : skill.name) : [],
                experience: student.experience || [],
                education: student.education || [],
                projects: student.resumeAnalysis?.extractedDetails?.projects || [],
                achievements: [],
                bio: student.resumeAnalysis?.summary || '',
                linkedinUrl: student.linkedinUrl,
                githubUrl: student.githubUrl,
                portfolioUrl: student.portfolioUrl
            },
            resume: student.resumeFile ? {
                filename: student.resumeFile,
                uploadDate: student.resumeAnalysis?.uploadDate || student.createdAt
            } : undefined
        };
        res.status(200).json(transformedStudent);
    }
    catch (error) {
        console.error('Error fetching student by ID:', error);
        res.status(500).json({ message: 'Server error fetching student' });
    }
};
exports.getStudentById = getStudentById;
const getStudentByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const student = await Student_1.Student.findOne({ userId: userId })
            .populate('userId', 'email phone whatsappNumber')
            .populate('collegeId', 'name')
            .lean();
        console.log('Populated student with userId:', JSON.stringify(student, null, 2));
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json(student);
    }
    catch (error) {
        console.error('Error fetching student by userId:', error);
        res.status(500).json({ message: 'Server error fetching student' });
    }
};
exports.getStudentByUserId = getStudentByUserId;
const createStudent = async (req, res) => {
    try {
        const { email, password, role, phoneNumber, whatsappNumber, otpId, sessionId, profileData } = req.body;
        if (!email || !password || !role || role !== 'student' || !profileData) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const newStudent = new Student_1.Student({
            userId: profileData.userId,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            dateOfBirth: profileData.dateOfBirth,
            gender: profileData.gender,
            phoneNumber: phoneNumber,
            email: email,
            linkedinUrl: profileData.linkedinUrl,
            githubUrl: profileData.githubUrl,
            portfolioUrl: profileData.portfolioUrl,
            collegeId: profileData.collegeId,
            studentId: profileData.studentId,
            enrollmentYear: profileData.enrollmentYear,
            graduationYear: profileData.graduationYear,
            currentSemester: profileData.currentSemester,
            education: profileData.education || [],
            experience: profileData.experience || [],
            skills: profileData.skills || [],
            resumeFile: profileData.resumeFile,
            resumeText: profileData.resumeText,
            resumeScore: profileData.resumeScore,
            jobPreferences: profileData.jobPreferences,
            profileCompleteness: 0,
            isActive: true,
            isPlacementReady: false
        });
        await newStudent.save();
        res.status(201).json({ message: 'Student created successfully', student: newStudent });
    }
    catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ message: 'Server error creating student' });
    }
};
exports.createStudent = createStudent;
const updateStudent = async (req, res) => {
    try {
        const id = req.params.id;
        const updateData = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid student ID' });
        }
        const updatedStudent = await Student_1.Student.findByIdAndUpdate(id, updateData, { new: true }).lean();
        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json({ message: 'Student updated successfully', student: updatedStudent });
    }
    catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ message: 'Server error updating student' });
    }
};
exports.updateStudent = updateStudent;
const updateStudentByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const updateData = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const updatedStudent = await Student_1.Student.findOneAndUpdate({ userId: userId }, updateData, { new: true }).lean();
        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json({ message: 'Student updated successfully', student: updatedStudent });
    }
    catch (error) {
        console.error('Error updating student by userId:', error);
        res.status(500).json({ message: 'Server error updating student' });
    }
};
exports.updateStudentByUserId = updateStudentByUserId;
const deleteStudent = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid student ID' });
        }
        const deletedStudent = await Student_1.Student.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
        if (!deletedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json({ message: 'Student deleted (deactivated) successfully', student: deletedStudent });
    }
    catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Server error deleting student' });
    }
};
exports.deleteStudent = deleteStudent;
const getStudentsByCollege = async (req, res) => {
    try {
        const collegeId = req.params.collegeId;
        if (!mongoose_1.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }
        const students = await Student_1.Student.find({ collegeId: collegeId, isActive: true }).lean();
        res.status(200).json(students);
    }
    catch (error) {
        console.error('Error fetching students by college:', error);
        res.status(500).json({ message: 'Server error fetching students by college' });
    }
};
exports.getStudentsByCollege = getStudentsByCollege;
const searchStudents = async (req, res) => {
    try {
        const { name, skills, collegeId, isPlacementReady } = req.query;
        const filter = { isActive: true };
        if (name) {
            filter.$or = [
                { firstName: { $regex: name, $options: 'i' } },
                { lastName: { $regex: name, $options: 'i' } }
            ];
        }
        if (skills) {
            const skillsArray = Array.isArray(skills) ? skills : [skills];
            filter['skills.name'] = { $in: skillsArray };
        }
        if (collegeId && mongoose_1.Types.ObjectId.isValid(collegeId)) {
            filter.collegeId = collegeId;
        }
        if (isPlacementReady !== undefined) {
            filter.isPlacementReady = isPlacementReady === 'true';
        }
        const students = await Student_1.Student.find(filter).lean();
        res.status(200).json(students);
    }
    catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({ message: 'Server error searching students' });
    }
};
exports.searchStudents = searchStudents;
