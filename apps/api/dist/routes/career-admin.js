"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const career_admin_1 = require("../controllers/career-admin");
const router = express_1.default.Router();
router.get('/stats', career_admin_1.getSystemStats);
router.get('/config', career_admin_1.getSystemConfig);
router.get('/analytics', career_admin_1.getMatchingAnalytics);
router.get('/notifications/:recruiterId', career_admin_1.getNotificationHistory);
router.get('/candidates/:recruiterId', career_admin_1.getCandidateManagement);
router.post('/process-jobs', career_admin_1.processAllActiveJobs);
router.post('/trigger-alerts', career_admin_1.triggerDailyAlerts);
router.post('/test-ai', career_admin_1.testAIAnalysis);
exports.default = router;
