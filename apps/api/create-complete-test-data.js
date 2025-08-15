const mongoose = require('mongoose');
require('dotenv').config();

// Define minimal schemas for our test
const jobSchema = new mongoose.Schema({
  title: String,
  companyName: String,
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' },
  createdAt: { type: Date, default: Date.now }
});

const invitationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: String,
  sentAt: { type: Date, default: Date.now },
  expiresAt: Date,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  negotiationHistory: [{
    timestamp: { type: Date, default: Date.now },
    actor: String,
    action: String,
    details: String
  }]
});

const Job = mongoose.model('Job', jobSchema);
const Invitation = mongoose.model('Invitation', invitationSchema);

async function createCompleteTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test job
    const testJob = new Job({
      title: 'Software Engineer',
      companyName: 'Test Company Ltd.',
      recruiterId: new mongoose.Types.ObjectId('689f0d4618a8b3b09b098d3a') // Our recruiter profile ID
    });

    await testJob.save();
    console.log('✅ Test job created:', testJob._id);

    // Update the existing invitation with proper fields
    const invitation = await Invitation.findById('689f0e1b7aec28aed6f8eb2a');
    if (invitation) {
      invitation.jobId = testJob._id;
      invitation.recruiterId = new mongoose.Types.ObjectId('689f0d4618a8b3b09b098d3a');
      invitation.status = 'declined'; // Make it resendable
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      invitation.updatedBy = new mongoose.Types.ObjectId('689f0d4618a8b3b09b098d38'); // User ID
      
      // Fix the negotiation history
      invitation.negotiationHistory = [{
        timestamp: new Date(),
        actor: 'recruiter',
        action: 'proposed',
        details: 'Initial invitation sent'
      }];

      await invitation.save();
      console.log('✅ Invitation updated with all required fields');
    }

    console.log('\n📊 Complete test data created:');
    console.log(`- Job ID: ${testJob._id}`);
    console.log(`- Invitation ID: 689f0e1b7aec28aed6f8eb2a`);
    console.log(`- Status: declined (ready for resend)`);

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

createCompleteTestData();
