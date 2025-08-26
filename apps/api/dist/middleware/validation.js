"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = exports.validateLogin = exports.validateRequest = exports.validateRecruiterRegistration = exports.validateCollegeRegistration = exports.validateJobApplication = exports.validateStudentRegistration = void 0;
const express_validator_1 = require("express-validator");
const validateStudentRegistration = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('skills').isArray().withMessage('Skills must be an array'),
];
exports.validateStudentRegistration = validateStudentRegistration;
const validateJobApplication = [
    (0, express_validator_1.body)('jobId').notEmpty().withMessage('Job ID is required'),
    (0, express_validator_1.body)('studentId').notEmpty().withMessage('Student ID is required'),
];
exports.validateJobApplication = validateJobApplication;
const validateCollegeRegistration = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('College name is required'),
    (0, express_validator_1.body)('location').notEmpty().withMessage('Location is required'),
];
exports.validateCollegeRegistration = validateCollegeRegistration;
const validateRecruiterRegistration = [
    (0, express_validator_1.body)('companyName').notEmpty().withMessage('Company name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
];
exports.validateRecruiterRegistration = validateRecruiterRegistration;
const validateLogin = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
exports.validateLogin = validateLogin;
const validateRegister = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('role').isIn(['student', 'recruiter', 'college']).withMessage('Valid role is required'),
];
exports.validateRegister = validateRegister;
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
exports.validateRequest = validateRequest;
