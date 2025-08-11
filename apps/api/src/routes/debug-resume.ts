import express from 'express';
import ResumeBuilderService from '../services/resume-builder';
import { sendWhatsAppMessage } from '../services/whatsapp';
import BunnyStorageService from '../services/bunny-storage.service';
import GeneratedResumeService from '../services/generated-resume.service';

const router = express.Router();

/**
 * Debug endpoint to test complete resume generation flow
 * POST /api/debug/test-resume-flow
 */
router.post('/test-resume-flow', async (req, res) => {
  try {
    console.log('🧪 DEBUG: Testing complete resume generation flow');
    
    const { email = 'test@example.com', phone = '+919999999999', jobDescription = 'Software Developer position requiring JavaScript skills' } = req.body;
    
    const testResults = {
      steps: [],
      errors: [],
      success: false
    };

    // Step 1: Test PDF Generation
    try {
      console.log('📄 Step 1: Testing PDF generation...');
      const resumeBuilder = new ResumeBuilderService();
      
      const testResumeData = {
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: email,
          phone: phone,
          location: 'Test City'
        },
        summary: 'Test resume generated for debugging purposes',
        skills: [
          { name: 'JavaScript', level: 'advanced', category: 'technical' },
          { name: 'React', level: 'intermediate', category: 'technical' }
        ],
        experience: [
          {
            title: 'Software Developer',
            company: 'Test Company',
            location: 'Test City',
            startDate: new Date('2023-01-01'),
            endDate: new Date('2024-01-01'),
            description: 'Developed web applications using JavaScript and React',
            isCurrentJob: false
          }
        ],
        education: [
          {
            degree: 'Bachelor of Computer Science',
            field: 'Computer Science',
            institution: 'Test University',
            startDate: new Date('2019-01-01'),
            endDate: new Date('2023-01-01'),
            isCompleted: true
          }
        ],
        projects: []
      };

      const htmlContent = resumeBuilder.generateResumeHTML(testResumeData);
      const pdfBuffer = await resumeBuilder.generatePDF(htmlContent);
      
      testResults.steps.push({
        step: 'PDF Generation',
        status: 'success',
        details: `Generated PDF of ${pdfBuffer.length} bytes`
      });
      
      // Step 2: Test Bunny.net Upload
      try {
        console.log('☁️ Step 2: Testing Bunny.net upload...');
        const fileName = `test_resume_${Date.now()}.pdf`;
        const resumeId = `debug_${Date.now()}`;
        
        const uploadResult = await BunnyStorageService.uploadPDF(pdfBuffer, fileName, resumeId);
        
        if (uploadResult.success) {
          testResults.steps.push({
            step: 'Bunny.net Upload',
            status: 'success',
            details: `Uploaded to: ${uploadResult.url}`
          });
        } else {
          testResults.steps.push({
            step: 'Bunny.net Upload',
            status: 'failed',
            details: uploadResult.error
          });
          testResults.errors.push(`Bunny.net upload failed: ${uploadResult.error}`);
        }
      } catch (bunnyError) {
        testResults.steps.push({
          step: 'Bunny.net Upload',
          status: 'error',
          details: bunnyError instanceof Error ? bunnyError.message : 'Unknown error'
        });
        testResults.errors.push(`Bunny.net upload error: ${bunnyError}`);
      }

      // Step 3: Test WhatsApp Message
      try {
        console.log('📱 Step 3: Testing WhatsApp message...');
        const testMessage = `🧪 *DEBUG TEST*\n\nThis is a test message from CampusPe resume generation system.\n\nTime: ${new Date().toISOString()}`;
        
        const whatsappResult = await sendWhatsAppMessage(phone, testMessage, 'general');
        
        if (whatsappResult.success) {
          testResults.steps.push({
            step: 'WhatsApp Message',
            status: 'success',
            details: 'Message sent successfully'
          });
        } else {
          testResults.steps.push({
            step: 'WhatsApp Message',
            status: 'failed',
            details: whatsappResult.error
          });
          testResults.errors.push(`WhatsApp message failed: ${whatsappResult.error}`);
        }
      } catch (whatsappError) {
        testResults.steps.push({
          step: 'WhatsApp Message',
          status: 'error',
          details: whatsappError instanceof Error ? whatsappError.message : 'Unknown error'
        });
        testResults.errors.push(`WhatsApp message error: ${whatsappError}`);
      }

      // Step 4: Test Database Save
      try {
        console.log('💾 Step 4: Testing database save...');
        
        const generatedResume = await GeneratedResumeService.createGeneratedResume({
          studentId: '507f1f77bcf86cd799439011', // Test ObjectId
          jobTitle: 'Debug Test Position',
          jobDescription: jobDescription,
          resumeData: testResumeData,
          fileName: `debug_resume_${Date.now()}.pdf`,
          pdfBuffer: pdfBuffer,
          matchScore: 85,
          aiEnhancementUsed: true,
          generationType: 'ai'
        });

        testResults.steps.push({
          step: 'Database Save',
          status: 'success',
          details: `Saved with ID: ${generatedResume.resumeId}`
        });

      } catch (dbError) {
        testResults.steps.push({
          step: 'Database Save',
          status: 'error',
          details: dbError instanceof Error ? dbError.message : 'Unknown error'
        });
        testResults.errors.push(`Database save error: ${dbError}`);
      }

      testResults.success = testResults.errors.length === 0;

    } catch (pdfError) {
      testResults.steps.push({
        step: 'PDF Generation',
        status: 'error',
        details: pdfError instanceof Error ? pdfError.message : 'Unknown error'
      });
      testResults.errors.push(`PDF generation error: ${pdfError}`);
    }

    res.json({
      success: true,
      message: 'Debug test completed',
      testResults: testResults,
      environment: {
        node_env: process.env.NODE_ENV,
        bunny_configured: !!(process.env.BUNNY_STORAGE_ZONE_NAME && process.env.BUNNY_STORAGE_ACCESS_KEY),
        wabb_configured: !!process.env.WABB_WEBHOOK_URL,
        azure_env: !!process.env.WEBSITE_SITE_NAME
      }
    });

  } catch (error) {
    console.error('❌ Debug test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Debug test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Debug endpoint to test Bunny.net configuration
 * GET /api/debug/test-bunny
 */
router.get('/test-bunny', async (req, res) => {
  try {
    const config = {
      BUNNY_STORAGE_ZONE_NAME: process.env.BUNNY_STORAGE_ZONE_NAME,
      BUNNY_STORAGE_ACCESS_KEY: process.env.BUNNY_STORAGE_ACCESS_KEY ? '***CONFIGURED***' : 'NOT SET',
      BUNNY_STORAGE_HOSTNAME: process.env.BUNNY_STORAGE_HOSTNAME,
      BUNNY_CDN_URL: process.env.BUNNY_CDN_URL
    };

    const testBuffer = Buffer.from('Hello Bunny.net! This is a test file.', 'utf8');
    const testFileName = `test_${Date.now()}.txt`;
    const testResumeId = `debug_${Date.now()}`;

    const uploadResult = await BunnyStorageService.uploadPDF(testBuffer, testFileName, testResumeId);

    res.json({
      success: true,
      config: config,
      uploadTest: uploadResult
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
