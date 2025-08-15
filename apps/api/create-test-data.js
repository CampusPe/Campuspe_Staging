const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas
const connectionSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'pending' },
  type: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const invitationSchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'pending' },
  message: String,
  sentAt: { type: Date, default: Date.now },
  negotiationHistory: [{
    action: { type: String, enum: ['proposed', 'accepted', 'declined', 'counter_proposed', 'resent'] },
    timestamp: { type: Date, default: Date.now },
    message: String
  }]
});

const Connection = mongoose.model('Connection', connectionSchema);
const Invitation = mongoose.model('Invitation', invitationSchema);
const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));

async function createTestData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find our test recruiter
    const recruiter = await User.findOne({ email: 'test_recruiter@campuspe.com' });
    if (!recruiter) {
      console.log('❌ Test recruiter not found');
      return;
    }

    // Find a college user for testing
    const college = await User.findOne({ role: 'college' });
    if (!college) {
      console.log('❌ No college users found');
      return;
    }

    console.log(`✅ Found recruiter: ${recruiter.email}`);
    console.log(`✅ Found college: ${college.email}`);

    // Create a test connection
    const testConnection = new Connection({
      requester: recruiter._id,
      target: college._id,
      status: 'pending',
      type: 'job_invitation',
      message: 'Test connection for functionality testing'
    });

    await testConnection.save();
    console.log('✅ Test connection created');

    // Create a test invitation
    const testInvitation = new Invitation({
      recruiterId: recruiter._id,
      collegeId: college._id,
      status: 'pending',
      message: 'Test invitation for resend functionality testing',
      negotiationHistory: [{
        action: 'proposed',
        message: 'Initial invitation'
      }]
    });

    await testInvitation.save();
    console.log('✅ Test invitation created');

    console.log('\n📊 Test data summary:');
    console.log(`- Recruiter: ${recruiter.email} (${recruiter._id})`);
    console.log(`- College: ${college.email} (${college._id})`);
    console.log(`- Connection ID: ${testConnection._id}`);
    console.log(`- Invitation ID: ${testInvitation._id}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestData();
