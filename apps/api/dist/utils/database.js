"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        console.log('🔗 Attempting to connect to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI, {});
        console.log('✅ MongoDB connected successfully');
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('❌ MongoDB disconnected');
        });
        mongoose_1.default.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('✅ MongoDB disconnected successfully');
    }
    catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error);
        throw error;
    }
};
exports.disconnectDB = disconnectDB;
exports.default = { connectDB: exports.connectDB, disconnectDB: exports.disconnectDB };
