const mongoose = require('mongoose');
require('dotenv').config();

// Simplified schemas for testing
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  firstName: String,
  lastName: String,
  status: String,
  isVerified: Boolean,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

const connectionSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetType: String,
  status: { type: String, default: 'pending' },
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Connection = mongoose.model('Connection', connectionSchema);

async function createDemoConnections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find our test recruiter
    const recruiter = await User.findOne({ email: 'test_recruiter@campuspe.com' });
    if (!recruiter) {
      console.log('❌ Test recruiter not found');
      return;
    }

    // Find college users
    const colleges = await User.find({ role: 'college' }).limit(3);
    console.log(`Found ${colleges.length} college users`);

    // Create demo connections with different statuses
    const demoConnections = [
      {
        requester: recruiter._id,
        target: colleges[0]?._id,
        targetType: 'college',
        status: 'pending',
        message: 'Hi! We are looking to partner with your college for campus placements. We have exciting opportunities for your students in tech roles.'
      },
      {
        requester: colleges[1]?._id,
        target: recruiter._id,
        targetType: 'company',
        status: 'accepted',
        message: 'We would like to explore placement opportunities with your company. Our students are interested in software development roles.'
      },
      {
        requester: recruiter._id,
        target: colleges[2]?._id,
        targetType: 'college',
        status: 'declined',
        message: 'Looking forward to establishing a recruitment partnership with your esteemed institution.'
      }
    ];

    // Clear existing test connections
    await Connection.deleteMany({
      $or: [
        { requester: recruiter._id },
        { target: recruiter._id }
      ]
    });

    // Create new connections
    for (const connData of demoConnections) {
      if (connData.target) {
        const connection = new Connection(connData);
        await connection.save();
        console.log(`✅ Created ${connData.status} connection`);
      }
    }

    console.log('\n🎉 Demo connections created successfully!');
    console.log('\nTo test:');
    console.log('1. Visit http://localhost:3000/dashboard/recruiter');
    console.log('2. Login with: test_recruiter@campuspe.com / pppppp');
    console.log('3. Click on "Connections" tab');
    console.log('4. You should see the demo connections');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

createDemoConnections();
