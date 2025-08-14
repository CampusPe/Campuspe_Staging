import express from 'express';
import authMiddleware from '../middleware/auth';
import Connection from '../models/Connection';
import { User } from '../models/User';

const router = express.Router();

// Create a connection request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { targetId, targetType, message } = req.body;
    const userId = req.user._id;

    console.log('Connection request:', { userId, targetId, targetType, message });

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: userId, target: targetId },
        { requester: targetId, target: userId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection already exists or is pending' });
    }

    // Create new connection request
    const connection = new Connection({
      requester: userId,
      target: targetId,
      targetType,
      message,
      status: 'pending'
    });

    console.log('Creating connection with data:', connection.toObject());
    await connection.save();

    res.status(201).json({ 
      message: 'Connection request sent successfully',
      connection 
    });
  } catch (error) {
    console.error('Error creating connection request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's connections
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const connections = await Connection.find({
      $or: [
        { requester: userId },
        { target: userId }
      ]
    }).populate('requester target', 'email role');

    res.json(connections);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept a connection request
router.post('/:connectionId/accept', authMiddleware, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const connection = await Connection.findById(connectionId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Only the target can accept the connection
    if (connection.target.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    connection.status = 'accepted';
    connection.acceptedAt = new Date();
    await connection.save();

    res.json({ message: 'Connection accepted', connection });
  } catch (error) {
    console.error('Error accepting connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Decline a connection request
router.post('/:connectionId/decline', authMiddleware, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const connection = await Connection.findById(connectionId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Only the target can decline the connection
    if (connection.target.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    connection.status = 'declined';
    await connection.save();

    res.json({ message: 'Connection declined', connection });
  } catch (error) {
    console.error('Error declining connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
