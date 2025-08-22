"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const ai_resume_matching_1 = __importDefault(require("../services/ai-resume-matching"));
const router = express_1.default.Router();
router.post('/normalize-skills', auth_1.default, async (req, res) => {
    try {
        const { skills } = req.body;
        if (!Array.isArray(skills)) {
            return res.status(400).json({
                success: false,
                message: 'Skills array is required'
            });
        }
        function normalizeSkillLevel(level) {
            if (!level || typeof level !== 'string') {
                return 'intermediate';
            }
            const normalizedLevel = level.toLowerCase().trim();
            if (normalizedLevel.includes('expert') ||
                normalizedLevel.includes('native') ||
                normalizedLevel.includes('fluent') ||
                normalizedLevel.includes('mastery') ||
                normalizedLevel.includes('senior') ||
                normalizedLevel.includes('lead')) {
                return 'expert';
            }
            if (normalizedLevel.includes('advanced') ||
                normalizedLevel.includes('professional') ||
                normalizedLevel.includes('proficient') ||
                normalizedLevel.includes('experienced') ||
                normalizedLevel.includes('strong')) {
                return 'advanced';
            }
            if (normalizedLevel.includes('beginner') ||
                normalizedLevel.includes('basic') ||
                normalizedLevel.includes('novice') ||
                normalizedLevel.includes('learning') ||
                normalizedLevel.includes('familiar') ||
                normalizedLevel.includes('entry')) {
                return 'beginner';
            }
            return 'intermediate';
        }
        function normalizeSkillCategory(category) {
            if (!category || typeof category !== 'string') {
                return 'technical';
            }
            const normalizedCategory = category.toLowerCase().trim();
            if (normalizedCategory.includes('language') ||
                normalizedCategory.includes('linguistic')) {
                return 'language';
            }
            if (normalizedCategory.includes('soft') ||
                normalizedCategory.includes('interpersonal') ||
                normalizedCategory.includes('communication') ||
                normalizedCategory.includes('leadership') ||
                normalizedCategory.includes('management') ||
                normalizedCategory.includes('personal')) {
                return 'soft';
            }
            return 'technical';
        }
        const normalizedSkills = skills.map((skill) => {
            const original = {
                name: skill.name,
                level: skill.level,
                category: skill.category
            };
            const normalized = {
                name: String(skill.name || '').trim(),
                level: normalizeSkillLevel(skill.level),
                category: normalizeSkillCategory(skill.category)
            };
            return {
                original,
                normalized,
                changed: original.level !== normalized.level || original.category !== normalized.category
            };
        });
        const changedSkills = normalizedSkills.filter(skill => skill.changed);
        res.json({
            success: true,
            message: 'Skills normalized successfully',
            data: {
                totalSkills: skills.length,
                changedSkills: changedSkills.length,
                normalizedSkills,
                summary: {
                    changedSkills: changedSkills.map(skill => ({
                        name: skill.original.name,
                        levelChange: `${skill.original.level} → ${skill.normalized.level}`,
                        categoryChange: `${skill.original.category} → ${skill.normalized.category}`
                    }))
                }
            }
        });
    }
    catch (error) {
        console.error('Error in skill normalization debug:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to normalize skills',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.post('/validate-student-data', auth_1.default, async (req, res) => {
    try {
        const { studentData } = req.body;
        const validations = {
            skills: {
                valid: true,
                errors: [],
                validLevels: ['beginner', 'intermediate', 'advanced', 'expert'],
                validCategories: ['technical', 'soft', 'language']
            }
        };
        if (studentData.skills && Array.isArray(studentData.skills)) {
            studentData.skills.forEach((skill, index) => {
                if (!validations.skills.validLevels.includes(skill.level)) {
                    validations.skills.valid = false;
                    validations.skills.errors.push(`Skill ${index + 1} (${skill.name}): Invalid level "${skill.level}"`);
                }
                if (!validations.skills.validCategories.includes(skill.category)) {
                    validations.skills.valid = false;
                    validations.skills.errors.push(`Skill ${index + 1} (${skill.name}): Invalid category "${skill.category}"`);
                }
            });
        }
        res.json({
            success: true,
            message: 'Student data validation completed',
            data: {
                isValid: validations.skills.valid,
                validations,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error in student data validation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate student data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/claude-test', async (req, res) => {
    console.log('\n=== CLAUDE API DEBUG ENDPOINT CALLED ===');
    try {
        console.log('\n--- ENVIRONMENT CHECK ---');
        const claudeApiKey = process.env.CLAUDE_API_KEY;
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        const envCheck = {
            claudeKeyExists: !!claudeApiKey,
            anthropicKeyExists: !!anthropicApiKey,
            claudeKeyLength: claudeApiKey ? claudeApiKey.length : 0,
            anthropicKeyLength: anthropicApiKey ? anthropicApiKey.length : 0,
            nodeEnv: process.env.NODE_ENV,
            apiKey: (claudeApiKey || anthropicApiKey) ? `${(claudeApiKey || anthropicApiKey)?.substring(0, 10)}...` : 'NONE'
        };
        console.log('Environment Check:', envCheck);
        const apiKey = claudeApiKey || anthropicApiKey;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: 'NO API KEY FOUND - This explains the Claude failure!',
                envCheck,
                timestamp: new Date().toISOString()
            });
        }
        console.log('\n--- CLAUDE API TEST ---');
        const testPrompt = `Hello Claude! Please respond with exactly this JSON: {"test": "success", "message": "Claude API is working on Azure"}`;
        try {
            console.log('Making test API call to Claude...');
            const startTime = Date.now();
            const response = await ai_resume_matching_1.default.callClaudeAPI(testPrompt, 100);
            const duration = Date.now() - startTime;
            console.log('✅ Claude API call successful!');
            console.log('Response:', response);
            const testResult = {
                success: true,
                duration: `${duration}ms`,
                hasContent: !!response?.content,
                contentLength: response?.content?.length || 0,
                content: response?.content || 'No content'
            };
            try {
                if (response?.content) {
                    const parsed = JSON.parse(response.content);
                    testResult.jsonParseSuccess = true;
                    testResult.parsedContent = parsed;
                }
            }
            catch (parseError) {
                testResult.jsonParseSuccess = false;
                testResult.parseError = parseError.message;
            }
            return res.json({
                success: true,
                message: 'Claude API test completed successfully',
                envCheck,
                claudeTest: testResult,
                timestamp: new Date().toISOString()
            });
        }
        catch (claudeError) {
            console.log('❌ Claude API call failed:', claudeError.message);
            const errorDetails = {
                message: claudeError.message,
                code: claudeError.code,
                status: claudeError.response?.status,
                responseData: claudeError.response?.data,
                requestUrl: claudeError.config?.url,
                requestHeaders: claudeError.config?.headers
            };
            return res.status(500).json({
                success: false,
                message: 'Claude API call failed',
                envCheck,
                claudeError: errorDetails,
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug endpoint failed',
            error: error?.message || 'Unknown error',
            stack: error?.stack || 'No stack trace',
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
