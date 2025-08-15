const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas
const invitationSchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: String,
  message: String,
  sentAt: Date,
  negotiationHistory: Array
});

const Invitation = mongoose.model('Invitation', invitationSchema);

async function fixTestInvitation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find our test invitation
    const invitation = await Invitation.findById('689f0e1b7aec28aed6f8eb2a');
    console.log('Current invitation:', invitation);
    
    if (invitation) {
      // Update with correct recruiter profile ID
      invitation.recruiterId = new mongoose.Types.ObjectId('689f0d4618a8b3b09b098d3a');
      invitation.status = 'declined'; // Set to declined so it can be resent
      await invitation.save();
      console.log('✅ Invitation updated with correct recruiter profile ID and status');
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixTestInvitation();
