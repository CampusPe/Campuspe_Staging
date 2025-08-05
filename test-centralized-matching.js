const { MongoClient } = require('mongodb');

async function testCentralizedMatching() {
    console.log('Testing centralized matching service...');
    
    // Test if we can connect to MongoDB and find students/jobs
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb+srv://kanzalxyz:9CeTEJXzl9V0Z52C@campus-pe.s5gkd.mongodb.net/campuspe?retryWrites=true&w=majority&appName=Campus-Pe');
    
    try {
        await client.connect();
        const db = client.db('campuspe');
        
        const students = await db.collection('students').find({}).limit(2).toArray();
        console.log('Found students:', students.length);
        
        const jobs = await db.collection('jobs').find({ status: 'active' }).toArray();
        console.log('Found active jobs:', jobs.length);
        
        if (students.length > 0 && jobs.length > 0) {
            console.log('Student ID:', students[0]._id);
            console.log('Job ID:', jobs[0]._id);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
    }
}

testCentralizedMatching();
