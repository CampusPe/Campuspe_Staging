import express from 'express';
import {
  createInterviewSlots,
  publishInterviewSlot,
  getJobInterviewSlots,
  confirmAttendance,
  markAttendance,
  getUpcomingInterviewSlots
} from '../controllers/interview-slots';
import authMiddleware from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// Create interview slots for a job (Recruiters only)
router.post(
  '/jobs/:jobId/interview-slots',
  authMiddleware,
  roleMiddleware(['recruiter']),
  createInterviewSlots
);

// Publish interview slot and trigger auto-assignment (Recruiters only)
router.post(
  '/interview-slots/:slotId/publish',
  authMiddleware,
  roleMiddleware(['recruiter']),
  publishInterviewSlot
);

// Get all interview slots for a job
router.get(
  '/jobs/:jobId/interview-slots',
  authMiddleware,
  getJobInterviewSlots
);

// Confirm attendance for interview slot (Students)
router.post(
  '/interview-slots/:slotId/confirm/:studentId',
  authMiddleware,
  roleMiddleware(['student']),
  confirmAttendance
);

// Mark candidate attendance (Recruiters/HR)
router.post(
  '/interview-slots/:slotId/attendance/:studentId',
  authMiddleware,
  roleMiddleware(['recruiter', 'admin']),
  markAttendance
);

// Get upcoming interview slots for reminders
router.get(
  '/interview-slots/upcoming',
  authMiddleware,
  getUpcomingInterviewSlots
);

// Get interview assignments for a student
router.get(
  '/student/assignments',
  authMiddleware,
  roleMiddleware(['student']),
  async (req: any, res: any) => {
    try {
      const studentId = req.user?.studentId || req.user?.id;
      if (!studentId) {
        return res.status(401).json({ message: 'Student not found' });
      }
      
      // For now, return empty array as this feature is being developed
      res.status(200).json([]);
    } catch (error) {
      console.error('Error fetching student interview assignments:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
