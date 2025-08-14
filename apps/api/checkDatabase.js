const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campuspe';

async function checkDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📚 Available Collections:');
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });

        // Check user count by role
        const userStats = await mongoose.connection.db.collection('users').aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]).toArray();

        console.log('\n👥 Users by Role:');
        userStats.forEach(stat => {
            console.log(`- ${stat._id || 'undefined'}: ${stat.count}`);
        });

        // Check recruiter count
        const recruiterCount = await mongoose.connection.db.collection('recruiters').countDocuments();
        console.log(`\n🏢 Total Recruiters: ${recruiterCount}`);

        // Check college count  
        const collegeCount = await mongoose.connection.db.collection('colleges').countDocuments();
        console.log(`🎓 Total Colleges: ${collegeCount}`);

        // Check job count
        const jobCount = await mongoose.connection.db.collection('jobs').countDocuments();
        console.log(`💼 Total Jobs: ${jobCount}`);

        // If there are recruiters, show their approval status
        if (recruiterCount > 0) {
            const recruiterStats = await mongoose.connection.db.collection('recruiters').aggregate([
                { $group: { _id: '$approvalStatus', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]).toArray();

            console.log('\n📊 Recruiter Approval Status:');
            recruiterStats.forEach(stat => {
                console.log(`- ${stat._id || 'undefined'}: ${stat.count}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

checkDatabase();
