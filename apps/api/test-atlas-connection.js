const mongoose = require('mongoose');
require('dotenv').config();

async function testAtlasConnection() {
    try {
        console.log('🔄 Testing MongoDB Atlas connection...');
        console.log('📍 Environment:', process.env.NODE_ENV || 'development');
        
        // Hide password in logs for security
        const safeUri = process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
        console.log('🔗 Connection string:', safeUri);
        
        console.log('⏳ Connecting...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            maxPoolSize: 10, // Maintain up to 10 socket connections
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log('🏢 Database name:', mongoose.connection.db.databaseName);
        console.log('🌐 Connected to host:', mongoose.connection.host);
        
        // Test database operations
        console.log('📊 Listing collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📋 Found ${collections.length} collections:`, collections.map(c => c.name));
        
        // Test a simple write operation
        console.log('✏️ Testing write operation...');
        const testCollection = mongoose.connection.db.collection('connection_test');
        await testCollection.insertOne({ 
            test: true, 
            timestamp: new Date(),
            message: 'Atlas connection test successful'
        });
        console.log('✅ Write test successful');
        
        // Clean up test document
        await testCollection.deleteOne({ test: true });
        console.log('🧹 Cleaned up test document');
        
        await mongoose.disconnect();
        console.log('🔐 Connection closed successfully');
        console.log('');
        console.log('🎉 MongoDB Atlas is ready for CampusPe!');
        
    } catch (error) {
        console.error('❌ Atlas connection failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting steps:');
        
        if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
            console.log('🔑 1. CHECK PASSWORD: Replace <db_password> with your actual password');
            console.log('👤 2. CHECK USERNAME: Verify "CampusPeAdmin" is correct');
            console.log('🔗 3. CHECK CONNECTION STRING: Ensure no typos in the MongoDB URI');
        }
        
        if (error.message.includes('ENOTFOUND') || error.message.includes('connection')) {
            console.log('🌐 1. CHECK INTERNET: Ensure you have internet connectivity');
            console.log('🏢 2. CHECK CLUSTER: Verify your cluster is running in Atlas');
            console.log('📍 3. CHECK NETWORK: Verify IP address is whitelisted in Atlas');
        }
        
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            console.log('⏰ 1. NETWORK TIMEOUT: Try again with better internet connection');
            console.log('🛡️ 2. CHECK FIREWALL: Corporate firewall might block MongoDB ports');
            console.log('📍 3. CHECK IP WHITELIST: Add your current IP to Atlas Network Access');
        }
        
        console.log('');
        console.log('📝 Your current connection string format:');
        console.log('   mongodb+srv://CampusPeAdmin:<PASSWORD>@campuspestaging.adsljpw.mongodb.net/campuspe?...');
        console.log('');
        console.log('⚠️  Make sure to replace <db_password> with your actual password!');
        
        process.exit(1);
    }
}

// Show current environment info
console.log('🚀 CampusPe MongoDB Atlas Connection Test');
console.log('==========================================');
console.log('📅 Date:', new Date().toLocaleString());
console.log('📁 Working directory:', process.cwd());
console.log('🔧 Node.js version:', process.version);
console.log('');

testAtlasConnection();
