require('dotenv').config();
const mongoose = require('mongoose');
const Connection = require('./dist/models/Connection').default;
const User = require('./dist/models/User').default;

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find connections with missing user references
    const connections = await Connection.find({})
      .populate('requester', 'email firstName lastName role')
      .populate('target', 'email firstName lastName role');
    
    console.log('Total connections found:', connections.length);
    
    const brokenConnections = [];
    const validConnections = [];
    
    connections.forEach(conn => {
      if (!conn.requester || !conn.target) {
        brokenConnections.push({
          _id: conn._id,
          requester: conn.requester ? 'exists' : 'MISSING',
          target: conn.target ? 'exists' : 'MISSING',
          status: conn.status
        });
      } else {
        validConnections.push(conn);
      }
    });
    
    console.log('Valid connections:', validConnections.length);
    console.log('Broken connections:', brokenConnections.length);
    
    if (brokenConnections.length > 0) {
      console.log('Broken connections details:', brokenConnections);
      
      // Remove broken connections
      const brokenIds = brokenConnections.map(c => c._id);
      await Connection.deleteMany({ _id: { $in: brokenIds } });
      console.log('✅ Cleaned up broken connections');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
