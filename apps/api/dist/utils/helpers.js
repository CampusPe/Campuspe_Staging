"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePhoneNumber = exports.validateEmail = exports.generateUniqueId = exports.formatPhoneNumber = exports.calculateMatchScore = void 0;
const calculateMatchScore = (skills, requirements) => {
    if (!skills || !requirements || skills.length === 0 || requirements.length === 0) {
        return 0;
    }
    const skillNames = skills.map(skill => typeof skill === 'string' ? skill.toLowerCase() : skill?.name?.toLowerCase() || '');
    const reqNames = requirements.map(req => typeof req === 'string' ? req.toLowerCase() : req?.toLowerCase?.() || '');
    const matches = skillNames.filter(skill => reqNames.some(req => req.includes(skill) || skill.includes(req)));
    return (matches.length / requirements.length) * 100;
};
exports.calculateMatchScore = calculateMatchScore;
const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }
    else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+${cleaned}`;
    }
    else if (cleaned.length === 13 && cleaned.startsWith('+91')) {
        return cleaned;
    }
    return phone;
};
exports.formatPhoneNumber = formatPhoneNumber;
const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
exports.generateUniqueId = generateUniqueId;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};
exports.validatePhoneNumber = validatePhoneNumber;
