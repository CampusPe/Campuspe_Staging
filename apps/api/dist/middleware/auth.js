"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const authMiddleware = async (req, res, next) => {
    try {
        const maskedSecret = process.env.JWT_SECRET ? process.env.JWT_SECRET.replace(/.(?=.{4})/g, '*') : 'undefined';
        console.log('Auth middleware: Using JWT_SECRET:', maskedSecret);
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            console.log('Auth middleware: No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }
        console.log('Auth middleware: Token received:', token.substring(0, 20) + '...');
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('Auth middleware: Decoded token:', decoded);
        if (decoded.userId === 'admin' && decoded.role === 'admin') {
            req.user = {
                _id: 'admin',
                userId: 'admin',
                email: decoded.email,
                role: 'admin',
                name: decoded.name
            };
            return next();
        }
        console.log('Auth middleware: Looking up user with ID:', decoded.userId);
        const user = await User_1.User.findById(decoded.userId);
        if (!user) {
            console.log('Auth middleware: User not found for ID:', decoded.userId);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('Auth middleware: User found:', { id: user._id, email: user.email, role: user.role });
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Authentication failed' });
    }
};
exports.default = authMiddleware;
