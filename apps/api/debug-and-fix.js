const mongoose = require('mongoose');
require('dotenv').config();

async function debugAndFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find all college users
    const User = mongoose.model('User', new mongoose.Schema({}));
    const collegeUsers = await User.find({ role: 'college' });
    console.log('College users found:', collegeUsers.length);
    collegeUsers.forEach(u => console.log(`- ${u.email} (${u._id})`));
    
    // Find all college profiles
    const College = mongoose.model('College', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }));
    const collegeProfiles = await College.find({});
    console.log('\nCollege profiles found:', collegeProfiles.length);
    collegeProfiles.forEach(c => console.log(`- Profile ID: ${c._id}, User ID: ${c.userId}`));
    
    if (collegeUsers.length > 0) {
      const firstCollege = collegeUsers[0];
      console.log(`\n✅ Using college: ${firstCollege.email} (${firstCollege._id})`);
      
      // Update our invitation to use this college
      const Invitation = mongoose.model('Invitation', new mongoose.Schema({}));
      const invitation = await Invitation.findById('689f0e1b7aec28aed6f8eb2a');
      if (invitation) {
        invitation.collegeId = firstCollege._id;
        await invitation.save();
        console.log('✅ Invitation updated with valid college ID');
      }
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugAndFix();
