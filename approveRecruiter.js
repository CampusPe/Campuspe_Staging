const mongoose = require('mongoose');
const { Recruiter } = require('./apps/api/src/models/Recruiter');
const { User } = require('./apps/api/src/models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campuspe';

async function approveRecruiter() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get command line argument for email
        const email = process.argv[2];
        if (!email) {
            console.log('Usage: node approveRecruiter.js <recruiter-email>');
            process.exit(1);
        }

        // Find user by email
        const user = await User.findOne({ email, role: 'recruiter' });
        if (!user) {
            console.log(`No recruiter user found with email: ${email}`);
            process.exit(1);
        }

        // Find recruiter profile
        const recruiter = await Recruiter.findOne({ userId: user._id });
        if (!recruiter) {
            console.log(`No recruiter profile found for user: ${email}`);
            process.exit(1);
        }

        // Update approval status
        recruiter.approvalStatus = 'approved';
        recruiter.isVerified = true;
        recruiter.verificationStatus = 'verified';
        recruiter.approvedAt = new Date();
        
        await recruiter.save();

        console.log(`✅ Recruiter approved successfully!`);
        console.log(`Email: ${email}`);
        console.log(`Company: ${recruiter.companyInfo.name}`);
        console.log(`Approval Status: ${recruiter.approvalStatus}`);
        console.log(`Verification Status: ${recruiter.verificationStatus}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

approveRecruiter();
