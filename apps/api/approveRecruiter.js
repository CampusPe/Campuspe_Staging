const mongoose = require('mongoose');

// MongoDB connection (using the same connection string as the app)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campuspe';
mongoose.connect(mongoURI);

// Define a simple Recruiter schema for this script
const RecruiterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  companyInfo: {
    name: String,
    email: String,
  },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Recruiter = mongoose.model('Recruiter', RecruiterSchema);

// Also define User schema to populate email
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function approveRecruiter() {
  try {
    console.log('Connecting to database...');
    
    // Find all recruiters
    const recruiters = await Recruiter.find({}).populate('userId', 'email name');
    
    console.log('Found recruiters:');
    recruiters.forEach((recruiter, index) => {
      console.log(`${index + 1}. ${recruiter.userId?.email || 'No email'} - Status: ${recruiter.approvalStatus} - Company: ${recruiter.companyInfo?.name || 'No company'}`);
    });
    
    if (recruiters.length === 0) {
      console.log('No recruiters found in database');
      return;
    }
    
    // Approve ALL recruiters
    console.log(`\nApproving all recruiters...`);
    
    const result = await Recruiter.updateMany(
      { approvalStatus: { $ne: 'approved' } },
      {
        $set: {
          approvalStatus: 'approved',
          verificationStatus: 'verified',
          approvedAt: new Date(),
        }
      }
    );
    
    console.log('All recruiters approved successfully!');
    console.log('Modified count:', result.modifiedCount);
    
  } catch (error) {
    console.error('Error approving recruiter:', error);
  } finally {
    mongoose.connection.close();
  }
}

approveRecruiter();
