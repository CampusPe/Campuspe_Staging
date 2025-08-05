import express from 'express';
import aiResumeMatchingService from '../services/ai-resume-matching';

const router = express.Router();

// Test endpoint to verify Claude JSON parsing improvements
router.post('/test-claude-parsing', async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;
        
        if (!resumeText || !jobDescription) {
            return res.status(400).json({
                error: 'resumeText and jobDescription are required'
            });
        }

        const result = await aiResumeMatchingService.analyzeResumeMatch(resumeText, jobDescription);
        
        res.json({
            success: true,
            result,
            parsing_status: 'success'
        });
    } catch (error: any) {
        console.error('Claude test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            parsing_status: 'failed'
        });
    }
});

export default router;
