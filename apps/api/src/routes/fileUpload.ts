import express, { Request, Response } from 'express';
import multer from 'multer';
import { bunnyNetService } from '../services/bunnynet';
import { College } from '../models/College';
import { User } from '../models/User';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },

  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

// Upload college logo
router.post('/college/logo', authMiddleware, upload.single('logo'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Find the college by userId
    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Upload to BunnyNet
    const uploadResult = await bunnyNetService.uploadCollegeLogo(
      file.buffer,
      college._id.toString(),
      file.originalname
    );

    if (!uploadResult.success) {
      return res.status(500).json({ 
        message: 'Failed to upload logo',
        error: uploadResult.error 
      });
    }

    // Update college with logo URL
    college.logo = uploadResult.cdnUrl || '';
    await college.save();

    res.json({
      message: 'Logo uploaded successfully',
      logoUrl: uploadResult.cdnUrl,
      fileName: uploadResult.fileName
    });

  } catch (error: any) {
    console.error('Logo upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload logo',
      error: error.message 
    });
  }
});

// Upload verification document
router.post('/college/verification-document', authMiddleware, upload.single('document'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const file = req.file;
    const { documentType } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!documentType) {
      return res.status(400).json({ message: 'Document type is required' });
    }

    // Find the college by userId
    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Upload to BunnyNet
    const uploadResult = await bunnyNetService.uploadVerificationDocument(
      file.buffer,
      college._id.toString(),
      documentType,
      file.originalname
    );

    if (!uploadResult.success) {
      return res.status(500).json({ 
        message: 'Failed to upload document',
        error: uploadResult.error 
      });
    }

    // Add document URL to college verification documents
    if (!college.verificationDocuments.includes(uploadResult.cdnUrl || '')) {
      college.verificationDocuments.push(uploadResult.cdnUrl || '');
    }
    
    // Also add to submitted documents for admin approval
    if (!college.submittedDocuments) {
      college.submittedDocuments = [];
    }
    if (!college.submittedDocuments.includes(uploadResult.cdnUrl || '')) {
      college.submittedDocuments.push(uploadResult.cdnUrl || '');
    }

    await college.save();

    res.json({
      message: 'Document uploaded successfully',
      documentUrl: uploadResult.cdnUrl,
      fileName: uploadResult.fileName,
      documentType
    });

  } catch (error: any) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload document',
      error: error.message 
    });
  }
});

// Upload multiple documents for reverification
router.post('/college/reverification-documents', authMiddleware, upload.array('documents', 5), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const files = req.files as Express.Multer.File[];
    const { notes } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Find the college by userId
    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    const uploadResults = [];
    const uploadedUrls = [];

    // Upload each file
    for (const file of files) {
      const uploadResult = await bunnyNetService.uploadVerificationDocument(
        file.buffer,
        college._id.toString(),
        'reverification',
        file.originalname
      );

      uploadResults.push({
        originalName: file.originalname,
        success: uploadResult.success,
        url: uploadResult.cdnUrl,
        error: uploadResult.error
      });

      if (uploadResult.success && uploadResult.cdnUrl) {
        uploadedUrls.push(uploadResult.cdnUrl);
      }
    }

    // Update college with new documents
    if (uploadedUrls.length > 0) {
      // Add to submitted documents
      if (!college.submittedDocuments) {
        college.submittedDocuments = [];
      }
      college.submittedDocuments.push(...uploadedUrls);

      // Update approval status back to pending
      college.approvalStatus = 'pending';
      
      // Add resubmission notes if provided
      if (notes) {
        college.resubmissionNotes = notes;
      }

      await college.save();
    }

    res.json({
      message: `${uploadedUrls.length} document(s) uploaded successfully`,
      uploadResults,
      totalUploaded: uploadedUrls.length,
      totalFailed: files.length - uploadedUrls.length
    });

  } catch (error: any) {
    console.error('Reverification documents upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload documents',
      error: error.message 
    });
  }
});

// Get college files
router.get('/college/files', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Find the college by userId
    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    res.json({
      logo: college.logo,
      verificationDocuments: college.verificationDocuments || [],
      submittedDocuments: college.submittedDocuments || [],
      approvalStatus: college.approvalStatus,
      rejectionReason: college.rejectionReason,
      resubmissionNotes: college.resubmissionNotes
    });

  } catch (error: any) {
    console.error('Get college files error:', error);
    res.status(500).json({ 
      message: 'Failed to get college files',
      error: error.message 
    });
  }
});

// Delete a document
router.delete('/college/document', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { documentUrl } = req.body;

    if (!documentUrl) {
      return res.status(400).json({ message: 'Document URL is required' });
    }

    // Find the college by userId
    const college = await College.findOne({ userId });
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Extract file path from CDN URL
    const cdnBaseUrl = process.env.BUNNY_CDN_URL || 'https://campuspe-resumes-cdn-v2.b-cdn.net';
    const filePath = documentUrl.replace(cdnBaseUrl + '/', '');

    // Delete from BunnyNet
    const deleted = await bunnyNetService.deleteFile(filePath);

    if (deleted) {
      // Remove from college documents arrays
      college.verificationDocuments = college.verificationDocuments.filter(url => url !== documentUrl);
      if (college.submittedDocuments) {
        college.submittedDocuments = college.submittedDocuments.filter(url => url !== documentUrl);
      }
      
      await college.save();

      res.json({ message: 'Document deleted successfully' });
    } else {
      res.status(500).json({ message: 'Failed to delete document from storage' });
    }

  } catch (error: any) {
    console.error('Delete document error:', error);
    res.status(500).json({ 
      message: 'Failed to delete document',
      error: error.message 
    });
  }
});

// Upload multiple documents for recruiter reverification
router.post('/recruiter/reverification-documents', authMiddleware, upload.array('documents', 5), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const files = req.files as Express.Multer.File[];
    const { notes } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Find the recruiter by userId
    const { Recruiter } = await import('../models/Recruiter');
    const recruiter = await Recruiter.findOne({ userId });
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const uploadResults = [];
    const uploadedUrls = [];

    // Upload each file
    for (const file of files) {
      const uploadResult = await bunnyNetService.uploadVerificationDocument(
        file.buffer,
        recruiter._id.toString(),
        'reverification',
        file.originalname
      );

      uploadResults.push({
        originalName: file.originalname,
        success: uploadResult.success,
        url: uploadResult.cdnUrl,
        error: uploadResult.error
      });

      if (uploadResult.success && uploadResult.cdnUrl) {
        uploadedUrls.push(uploadResult.cdnUrl);
      }
    }

    // Save uploaded document URLs to recruiter profile
    if (uploadedUrls.length > 0) {
      if (!recruiter.submittedDocuments) {
        recruiter.submittedDocuments = [];
      }
      recruiter.submittedDocuments.push(...uploadedUrls);

      if (notes) {
        recruiter.resubmissionNotes = notes;
      }

      await recruiter.save();
    }

    res.json({
      message: `${uploadedUrls.length} document(s) uploaded successfully`,
      uploadResults,
      totalUploaded: uploadedUrls.length,
      totalFailed: files.length - uploadedUrls.length
    });

  } catch (error: any) {
    console.error('Recruiter reverification documents upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload documents',
      error: error.message 
    });
  }
});

// Get recruiter files
router.get('/recruiter/files', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Find the recruiter by userId
    const { Recruiter } = await import('../models/Recruiter');
    const recruiter = await Recruiter.findOne({ userId });
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    res.json({
      logo: recruiter.companyInfo?.logo,
      verificationDocuments: recruiter.verificationDocuments || [],
      submittedDocuments: recruiter.submittedDocuments || [],
      approvalStatus: recruiter.approvalStatus,
      rejectionReason: recruiter.rejectionReason,
      resubmissionNotes: recruiter.resubmissionNotes
    });

  } catch (error: any) {
    console.error('Get recruiter files error:', error);
    res.status(500).json({ 
      message: 'Failed to get recruiter files',
      error: error.message 
    });
  }
});

export default router;
