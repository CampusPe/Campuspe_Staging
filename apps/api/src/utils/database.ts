import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    try {
        // MongoDB URI from environment (supports both Atlas and local)
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campuspe';
        
        await mongoose.connect(mongoURI);
        
        const isAtlas = mongoURI.includes('mongodb+srv');
        const dbName = mongoose.connection.db?.databaseName || 'campuspe';
        
        console.log(`✅ MongoDB connected successfully`);
        console.log(`📊 Database: ${dbName} (${isAtlas ? 'Atlas Cloud' : 'Local'})`);
        
    } catch (error) {
        console.error('❌ MongoDB initial connection failed:', error);
        console.log('💡 Tip: Make sure to replace <db_password> in your connection string');
        throw error;
    }
};

export default connectDB;
