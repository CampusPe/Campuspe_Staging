const mongoose = require('mongoose');
require('dotenv').config();

async function analyzeConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const connectionId = '689f1af36289a31973956ce6';
    const connection = await mongoose.connection.db.collection('connections').findOne({
      _id: new mongoose.Types.ObjectId(connectionId)
    });
    
    console.log('Connection Analysis:');
    console.log('ID:', connection._id);
    console.log('Requester:', connection.requester.toString());
    console.log('Target:', connection.target.toString());
    console.log('Status:', connection.status);
    
    // The college user trying to accept
    const collegeUserId = '689ef03bc4bb994e673e9f71';
    const collegeModelId = '689ef03bc4bb994e673e9f73';
    
    console.log('\nCollege User ID:', collegeUserId);
    console.log('College Model ID:', collegeModelId);
    
    console.log('\nAnalysis:');
    console.log('College is requester?', 
      connection.requester.toString() === collegeUserId || 
      connection.requester.toString() === collegeModelId
    );
    console.log('College is target?', 
      connection.target.toString() === collegeUserId || 
      connection.target.toString() === collegeModelId
    );
    
    if (connection.requester.toString() === collegeUserId || connection.requester.toString() === collegeModelId) {
      console.log('\n❌ ERROR: College is trying to accept a connection it SENT');
      console.log('This should be shown in "Sent Requests" section, not "Incoming Requests"');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

analyzeConnection();
