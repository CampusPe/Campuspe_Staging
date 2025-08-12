import express from 'express';
import {
  createJobInvitations,
  getJobInvitations,
  getCollegeInvitations,
  acceptInvitation,
  declineInvitation,
  proposeCounterDates,
  respondToCounterProposal,
  getInvitationById,
  updateInvitation,
  getInvitationHistory
} from '../controllers/invitations';
import authMiddleware from '../middleware/auth';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// Create invitations for a job (Recruiters only)
router.post(
  '/jobs/:jobId/invitations',
  authMiddleware,
  roleMiddleware(['recruiter']),
  createJobInvitations
);

// Get all invitations for a job (Recruiters only)
router.get(
  '/jobs/:jobId/invitations',
  authMiddleware,
  roleMiddleware(['recruiter']),
  getJobInvitations
);

// Get invitations for a college (TPO/College admins only)
router.get(
  '/colleges/:collegeId/invitations',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin']),
  getCollegeInvitations
);

// Get specific invitation details
router.get(
  '/invitations/:invitationId',
  authMiddleware,
  getInvitationById
);

// Accept invitation (TPO/College admins only)
router.post(
  '/invitations/:invitationId/accept',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin']),
  acceptInvitation
);

// Decline invitation (TPO/College admins only)
router.post(
  '/invitations/:invitationId/decline',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin']),
  declineInvitation
);

// Propose counter dates (TPO/College admins only)
router.post(
  '/invitations/:invitationId/counter',
  authMiddleware,
  roleMiddleware(['tpo', 'college_admin']),
  proposeCounterDates
);

// Respond to counter proposal (Recruiters only)
router.post(
  '/invitations/:invitationId/counter-response',
  authMiddleware,
  roleMiddleware(['recruiter']),
  respondToCounterProposal
);

// Update invitation (Admin access for override scenarios)
router.put(
  '/invitations/:invitationId',
  authMiddleware,
  roleMiddleware(['admin']),
  updateInvitation
);

// Get invitation history/timeline
router.get(
  '/invitations/:invitationId/history',
  authMiddleware,
  getInvitationHistory
);

export default router;
