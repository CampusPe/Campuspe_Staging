"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campuspe';
        await mongoose_1.default.connect(mongoURI);
        const isAtlas = mongoURI.includes('mongodb+srv');
        const dbName = mongoose_1.default.connection.db?.databaseName || 'campuspe';
        console.log(`✅ MongoDB connected successfully`);
        console.log(`📊 Database: ${dbName} (${isAtlas ? 'Atlas Cloud' : 'Local'})`);
    }
    catch (error) {
        console.error('❌ MongoDB initial connection failed:', error);
        console.log('💡 Tip: Make sure to replace <db_password> in your connection string');
        throw error;
    }
};
exports.connectDB = connectDB;
exports.default = exports.connectDB;
