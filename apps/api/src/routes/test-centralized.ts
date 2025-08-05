import express from 'express';
import CentralizedMatchingService from '../services/centralized-matching';

const router = express.Router();

interface TestResult {
    attempt: number;
    matchScore: number;
    explanation: string;
    skillsMatched: string[];
    cached: boolean;
    analyzedAt: Date;
}

// Test endpoint to verify centralized matching consistency
router.post('/test-centralized-matching', async (req, res) => {
    try {
        const { studentId, jobId } = req.body;

        if (!studentId || !jobId) {
            return res.status(400).json({
                error: 'studentId and jobId are required'
            });
        }

        // Test centralized matching multiple times to check for consistency
        const results: TestResult[] = [];

        for (let i = 0; i < 3; i++) {
            const matchResult = await CentralizedMatchingService.getOrCalculateMatch(
                studentId,
                jobId
            );
            
            if (!matchResult) {
                throw new Error(`No match result returned for attempt ${i + 1}`);
            }
            
            results.push({
                attempt: i + 1,
                matchScore: matchResult.matchScore,
                explanation: matchResult.explanation,
                skillsMatched: matchResult.skillsMatched,
                cached: matchResult.cached,
                analyzedAt: matchResult.analyzedAt
            });
        }

        res.json({
            studentId,
            jobId,
            matchingResults: results,
            consistencyCheck: {
                allScoresEqual: results.every(r => r.matchScore === results[0].matchScore),
                allCached: results.every(r => r.cached === true),
                scoreRange: {
                    min: Math.min(...results.map(r => r.matchScore)),
                    max: Math.max(...results.map(r => r.matchScore))
                }
            }
        });

    } catch (error: any) {
        console.error('Error testing centralized matching:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Test endpoint to verify career alert processing with centralized matching
router.post('/test-career-alert-processing', async (req, res) => {
    try {
        const { jobId } = req.body;

        if (!jobId) {
            return res.status(400).json({
                error: 'jobId is required'
            });
        }

        const CareerAlertService = require('../services/career-alerts').default;
        
        // Simulate processing but don't actually send notifications
        console.log(`🧪 Testing career alert processing for job ${jobId}...`);
        
        // This will now use centralized matching and should be consistent
        await CareerAlertService.processNewJobPosting(jobId);

        res.json({
            success: true,
            message: `Career alert processing completed for job ${jobId}. Check server logs for details.`
        });

    } catch (error: any) {
        console.error('Error testing career alert processing:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

export default router;
