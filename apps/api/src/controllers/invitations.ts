import { Request, Response } from 'express';
import { Invitation } from '../models/Invitation';
import { Job } from '../models/Job';
import { College } from '../models/College';
import { Recruiter } from '../models/Recruiter';
import { Notification } from '../models/Notification';
import { Types } from 'mongoose';

/**
 * Create and send invitations to colleges for a job
 * POST /api/jobs/:jobId/invitations
 */
export const createJobInvitations = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const {
      targetColleges,
      proposedDates,
      invitationMessage,
      eligibilityCriteria,
      expiresInDays = 7
    } = req.body;
    
    const user = req.user as any;
    const recruiterId = user.recruiterId || user._id;
    
    // Validate job exists and belongs to recruiter
    const job = await Job.findById(jobId).populate('recruiterId');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (job.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to invite colleges for this job'
      });
    }
    
    // Validate colleges exist
    const colleges = await College.find({
      _id: { $in: targetColleges },
      isActive: true,
      approvalStatus: 'approved'
    });
    
    if (colleges.length !== targetColleges.length) {
      return res.status(400).json({
        success: false,
        message: 'Some colleges not found or not approved'
      });
    }
    
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiresInDays);
    
    const invitations = [];
    const notifications = [];
    
    for (const collegeId of targetColleges) {
      // Check if invitation already exists
      const existingInvitation = await Invitation.findOne({
        jobId: new Types.ObjectId(jobId),
        collegeId: new Types.ObjectId(collegeId)
      });
      
      if (existingInvitation) {
        continue; // Skip duplicate invitation
      }
      
      // Create invitation
      const invitation = new Invitation({
        jobId: new Types.ObjectId(jobId),
        collegeId: new Types.ObjectId(collegeId),
        recruiterId: new Types.ObjectId(recruiterId),
        status: 'pending',
        invitationMessage,
        proposedDates,
        eligibilityCriteria,
        expiresAt: expirationDate,
        negotiationHistory: [{
          timestamp: new Date(),
          actor: 'recruiter',
          action: 'proposed',
          details: invitationMessage || 'Initial invitation sent'
        }],
        isActive: true,
        lastUpdated: new Date(),
        updatedBy: new Types.ObjectId(user._id)
      });
      
      const savedInvitation = await invitation.save();
      invitations.push(savedInvitation);
      
      // Find college TPO for notification
      const college = await College.findById(collegeId).populate('userId');
      if (college && college.userId) {
        const notification = new Notification({
          recipientId: college.userId._id,
          senderId: user._id,
          title: `New Job Invitation: ${job.title}`,
          message: `${job.companyName} has invited your college for campus recruitment. Please review and respond to the invitation.`,
          notificationType: 'job_invitation',
          relatedJobId: new Types.ObjectId(jobId),
          relatedEntityId: savedInvitation._id,
          priority: 'high',
          channels: ['email', 'whatsapp'],
          metadata: {
            jobTitle: job.title,
            companyName: job.companyName,
            expiresAt: expirationDate,
            proposedDates
          }
        });
        
        notifications.push(await notification.save());
      }
    }
    
    // Update job status to indicate invitations sent
    await Job.findByIdAndUpdate(jobId, {
      $set: {
        'metadata.invitationsSent': true,
        'metadata.invitationsSentAt': new Date(),
        'metadata.totalInvitationsSent': invitations.length
      }
    });
    
    res.status(201).json({
      success: true,
      message: `${invitations.length} invitations sent successfully`,
      data: {
        invitations: invitations.map(inv => ({
          id: inv._id,
          collegeId: inv.collegeId,
          status: inv.status,
          sentAt: inv.sentAt,
          expiresAt: inv.expiresAt
        })),
        notificationsSent: notifications.length
      }
    });
    
  } catch (error) {
    console.error('Error creating job invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job invitations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all invitations for a job (Recruiter view)
 * GET /api/jobs/:jobId/invitations
 */
export const getJobInvitations = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { status } = req.query;
    
    const filter: any = { jobId: new Types.ObjectId(jobId), isActive: true };
    if (status) {
      filter.status = status;
    }
    
    const invitations = await Invitation.find(filter)
      .populate('collegeId', 'name shortName address.city address.state placementContact')
      .populate('recruiterId', 'companyInfo.name recruiterProfile.firstName recruiterProfile.lastName')
      .sort({ sentAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        total: invitations.length,
        invitations: invitations.map(inv => ({
          id: inv._id,
          college: {
            id: inv.collegeId._id,
            name: (inv.collegeId as any).name,
            shortName: (inv.collegeId as any).shortName,
            location: `${(inv.collegeId as any).address.city}, ${(inv.collegeId as any).address.state}`,
            placementContact: (inv.collegeId as any).placementContact
          },
          status: inv.status,
          sentAt: inv.sentAt,
          respondedAt: inv.respondedAt,
          expiresAt: inv.expiresAt,
          proposedDates: inv.proposedDates,
          campusVisitWindow: inv.campusVisitWindow,
          tpoResponse: inv.tpoResponse,
          negotiationHistory: inv.negotiationHistory,
          eligibilityCriteria: inv.eligibilityCriteria
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching job invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job invitations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all invitations for a college (TPO view)
 * GET /api/colleges/invitations
 */
export const getCollegeInvitations = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { status, limit = 20, page = 1 } = req.query;
    
    // Find college by user ID
    const college = await College.findOne({ userId: user._id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College profile not found'
      });
    }
    
    const filter: any = { collegeId: college._id, isActive: true };
    if (status) {
      filter.status = status;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const invitations = await Invitation.find(filter)
      .populate('jobId', 'title companyName description salary applicationDeadline locations')
      .populate('recruiterId', 'companyInfo recruiterProfile')
      .sort({ sentAt: -1 })
      .limit(Number(limit))
      .skip(skip);
    
    const total = await Invitation.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
        invitations: invitations.map(inv => ({
          id: inv._id,
          job: {
            id: inv.jobId._id,
            title: (inv.jobId as any).title,
            companyName: (inv.jobId as any).companyName,
            description: (inv.jobId as any).description,
            salary: (inv.jobId as any).salary,
            applicationDeadline: (inv.jobId as any).applicationDeadline,
            locations: (inv.jobId as any).locations
          },
          recruiter: {
            id: inv.recruiterId._id,
            companyInfo: (inv.recruiterId as any).companyInfo,
            profile: (inv.recruiterId as any).recruiterProfile
          },
          status: inv.status,
          sentAt: inv.sentAt,
          respondedAt: inv.respondedAt,
          expiresAt: inv.expiresAt,
          proposedDates: inv.proposedDates,
          campusVisitWindow: inv.campusVisitWindow,
          tpoResponse: inv.tpoResponse,
          invitationMessage: inv.invitationMessage,
          eligibilityCriteria: inv.eligibilityCriteria,
          negotiationHistory: inv.negotiationHistory
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching college invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch college invitations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Accept an invitation (TPO action)
 * POST /api/invitations/:invitationId/accept
 */
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const {
      campusVisitWindow,
      tpoMessage,
      additionalRequirements
    } = req.body;
    
    const user = req.user as any;
    
    // Find and validate invitation
    const invitation = await Invitation.findById(invitationId)
      .populate('collegeId')
      .populate('jobId');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    // Verify user is authorized (is TPO of the college)
    const college = invitation.collegeId as any;
    if (college.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to respond to this invitation'
      });
    }
    
    if (invitation.status !== 'pending' && invitation.status !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'Invitation cannot be accepted in current status'
      });
    }
    
    // Accept the invitation
    // Manual accept logic
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    invitation.campusVisitWindow = campusVisitWindow;
    
    invitation.negotiationHistory.push({
      timestamp: new Date(),
      actor: 'tpo',
      action: 'accepted',
      details: tpoMessage || 'Invitation accepted'
    });
    
    await invitation.save(); // acceptInvitation(campusVisitWindow, tpoMessage);
    
    // Update job status to active if this is the first acceptance
    const job = invitation.jobId as any;
    if (job.status === 'draft') {
      await Job.findByIdAndUpdate(job._id, {
        status: 'active',
        'metadata.firstAcceptanceAt': new Date()
      });
    }
    
    // Notify recruiter
    const notification = new Notification({
      recipientId: invitation.recruiterId,
      senderId: user._id,
      title: `Invitation Accepted: ${job.title}`,
      message: `${college.name} has accepted your job invitation and confirmed campus visit dates.`,
      notificationType: 'invitation_accepted',
      relatedJobId: job._id,
      relatedEntityId: invitation._id,
      priority: 'high',
      channels: ['email', 'whatsapp'],
      metadata: {
        collegeName: college.name,
        campusVisitWindow,
        tpoMessage
      }
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        invitation: {
          id: invitation._id,
          status: invitation.status,
          campusVisitWindow: invitation.campusVisitWindow,
          respondedAt: invitation.respondedAt
        }
      }
    });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Decline an invitation (TPO action)
 * POST /api/invitations/:invitationId/decline
 */
export const declineInvitation = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { reason } = req.body;
    
    const user = req.user as any;
    
    const invitation = await Invitation.findById(invitationId)
      .populate('collegeId')
      .populate('jobId');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    const college = invitation.collegeId as any;
    if (college.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to respond to this invitation'
      });
    }
    
    if (invitation.status !== 'pending' && invitation.status !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'Invitation cannot be declined in current status'
      });
    }
    
    // Manual decline logic
    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    invitation.tpoResponse = {
      responseDate: new Date(),
      responseMessage: reason
    };
    
    invitation.negotiationHistory.push({
      timestamp: new Date(),
      actor: 'tpo',
      action: 'declined',
      details: reason || 'Invitation declined'
    });
    
    await invitation.save();
    
    // Notify recruiter
    const job = invitation.jobId as any;
    const notification = new Notification({
      recipientId: invitation.recruiterId,
      senderId: user._id,
      title: `Invitation Declined: ${job.title}`,
      message: `${college.name} has declined your job invitation.`,
      notificationType: 'invitation_declined',
      relatedJobId: job._id,
      relatedEntityId: invitation._id,
      priority: 'medium',
      channels: ['email'],
      metadata: {
        collegeName: college.name,
        reason
      }
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Invitation declined successfully',
      data: {
        invitation: {
          id: invitation._id,
          status: invitation.status,
          respondedAt: invitation.respondedAt
        }
      }
    });
    
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Propose counter dates (TPO action)
 * POST /api/invitations/:invitationId/counter-propose
 */
export const proposeCounterDates = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { alternativeDates, message } = req.body;
    
    const user = req.user as any;
    
    const invitation = await Invitation.findById(invitationId)
      .populate('collegeId')
      .populate('jobId');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    const college = invitation.collegeId as any;
    if (college.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to respond to this invitation'
      });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot propose counter dates for this invitation'
      });
    }
    
    // Manual counter proposal logic
    invitation.status = 'negotiating';
    invitation.respondedAt = new Date();
    invitation.tpoResponse = {
      responseDate: new Date(),
      responseMessage: message,
      counterProposal: {
        alternativeDates,
        additionalRequirements: message
      }
    };
    
    invitation.negotiationHistory.push({
      timestamp: new Date(),
      actor: 'tpo',
      action: 'counter_proposed',
      details: message || 'Counter proposal submitted',
      proposedDates: alternativeDates
    });
    
    await invitation.save();
    
    // Notify recruiter
    const job = invitation.jobId as any;
    const notification = new Notification({
      recipientId: invitation.recruiterId,
      senderId: user._id,
      title: `Counter Proposal: ${job.title}`,
      message: `${college.name} has proposed alternative dates for campus visit.`,
      notificationType: 'invitation_counter_proposal',
      relatedJobId: job._id,
      relatedEntityId: invitation._id,
      priority: 'high',
      channels: ['email', 'whatsapp'],
      metadata: {
        collegeName: college.name,
        alternativeDates,
        message
      }
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Counter proposal submitted successfully',
      data: {
        invitation: {
          id: invitation._id,
          status: invitation.status,
          tpoResponse: invitation.tpoResponse,
          respondedAt: invitation.respondedAt
        }
      }
    });
    
  } catch (error) {
    console.error('Error proposing counter dates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to propose counter dates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get invitation statistics for admin/recruiter dashboard
 * GET /api/invitations/stats
 */
export const getInvitationStats = async (req: Request, res: Response) => {
  try {
    const { jobId, recruiterId, timeRange = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(timeRange));
    
    const filter: any = {
      sentAt: { $gte: startDate },
      isActive: true
    };
    
    if (jobId) filter.jobId = new Types.ObjectId(jobId as string);
    if (recruiterId) filter.recruiterId = new Types.ObjectId(recruiterId as string);
    
    const stats = await Invitation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $ne: ['$respondedAt', null] },
                { $subtract: ['$respondedAt', '$sentAt'] },
                null
              ]
            }
          }
        }
      }
    ]);
    
    const totalInvitations = await Invitation.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        totalInvitations,
        statusBreakdown: stats,
        responseRate: stats
          .filter(s => ['accepted', 'declined'].includes(s._id))
          .reduce((sum, s) => sum + s.count, 0) / totalInvitations * 100
      }
    });
    
  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get invitation by ID
 * GET /api/invitations/:invitationId
 */
export const getInvitationById = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await Invitation.findById(invitationId)
      .populate('jobId', 'title companyName description requirements')
      .populate('collegeId', 'name shortName location')
      .populate('recruiterId', 'companyInfo.companyName');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { invitation }
    });
    
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Respond to counter proposal (Recruiters only)
 * POST /api/invitations/:invitationId/counter-response
 */
export const respondToCounterProposal = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { accept, finalDates, message } = req.body;
    
    const user = req.user as any;
    const recruiterId = user.recruiterId || user._id;
    
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    if (invitation.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to respond to this invitation'
      });
    }
    
    if (invitation.status !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'No counter proposal to respond to'
      });
    }
    
    if (accept) {
      // Accept the counter proposal
      invitation.status = 'accepted';
      invitation.campusVisitWindow = {
        confirmedStartDate: finalDates.startDate,
        confirmedEndDate: finalDates.endDate,
        visitMode: 'physical',
        maxStudents: 100,
      };
      
      invitation.negotiationHistory.push({
        timestamp: new Date(),
        actor: 'recruiter',
        action: 'accepted',
        details: message || 'Counter proposal accepted'
      });
      
    } else {
      // Decline the counter proposal
      invitation.status = 'declined';
      invitation.negotiationHistory.push({
        timestamp: new Date(),
        actor: 'recruiter',
        action: 'declined',
        details: message || 'Counter proposal declined'
      });
    }
    
    await invitation.save();
    
    // Send notification to TPO
    const notification = new Notification({
      recipientId: invitation.collegeId,
      senderId: new Types.ObjectId(recruiterId),
      title: `Counter Proposal ${accept ? 'Accepted' : 'Declined'}`,
      message: accept ? 
        'Your counter proposal has been accepted. Campus visit scheduled.' :
        'Your counter proposal has been declined.',
      notificationType: accept ? 'invitation_accepted' : 'invitation_declined',
      relatedJobId: invitation.jobId,
      relatedEntityId: invitation._id,
      priority: 'high',
      channels: ['email', 'whatsapp'],
      metadata: {
        invitationId: invitation._id,
        finalStatus: invitation.status,
        message
      }
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: `Counter proposal ${accept ? 'accepted' : 'declined'} successfully`,
      data: {
        invitation: {
          id: invitation._id,
          status: invitation.status,
          campusVisitWindow: invitation.campusVisitWindow,
          negotiationHistory: invitation.negotiationHistory
        }
      }
    });
    
  } catch (error) {
    console.error('Error responding to counter proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to counter proposal',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update invitation (Admin only)
 * PUT /api/invitations/:invitationId
 */
export const updateInvitation = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const updates = req.body;
    
    const invitation = await Invitation.findByIdAndUpdate(
      invitationId,
      { 
        ...updates,
        lastModifiedBy: new Types.ObjectId(req.user._id),
        lastModifiedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Invitation updated successfully',
      data: { invitation }
    });
    
  } catch (error) {
    console.error('Error updating invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invitation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get invitation history/timeline
 * GET /api/invitations/:invitationId/history
 */
export const getInvitationHistory = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await Invitation.findById(invitationId)
      .select('negotiationHistory status createdAt sentAt respondedAt')
      .populate('jobId', 'title companyName')
      .populate('collegeId', 'name');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    const timeline = [
      {
        timestamp: invitation.sentAt,
        actor: 'recruiter',
        action: 'created',
        details: 'Invitation created and sent to college'
      },
      ...invitation.negotiationHistory.map(entry => ({
        timestamp: entry.timestamp,
        actor: entry.actor,
        action: entry.action,
        details: entry.details,
        proposedDates: entry.proposedDates
      }))
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    res.status(200).json({
      success: true,
      data: {
        invitation: {
          id: invitation._id,
          currentStatus: invitation.status,
          timeline
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching invitation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
