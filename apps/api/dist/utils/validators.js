"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = exports.validateJobApplication = exports.validateStudentRegistration = void 0;
const express_validator_1 = require("express-validator");
exports.validateStudentRegistration = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('skills').isArray().withMessage('Skills must be an array'),
    (0, express_validator_1.body)('collegeId').notEmpty().withMessage('College ID is required'),
];
exports.validateJobApplication = [
    (0, express_validator_1.body)('studentId').notEmpty().withMessage('Student ID is required'),
    (0, express_validator_1.body)('jobId').notEmpty().withMessage('Job ID is required'),
    (0, express_validator_1.body)('resume').notEmpty().withMessage('Resume is required'),
];
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
