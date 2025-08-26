"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const recruiters_1 = require("../controllers/recruiters");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
router.get('/search', recruiters_1.searchRecruiters);
router.get('/industry/:industry', recruiters_1.getRecruitersByIndustry);
router.get('/', recruiters_1.getAllRecruiters);
router.get('/user/:userId', recruiters_1.getRecruiterByUserId);
router.get('/:id', recruiters_1.getRecruiterById);
router.post('/', recruiters_1.createRecruiter);
router.patch('/:id/verify', recruiters_1.verifyRecruiter);
router.post('/:recruiterId/request-approval', recruiters_1.requestCollegeApproval);
router.post('/notify-students', recruiters_1.notifyStudents);
router.post('/resubmit', auth_1.default, recruiters_1.resubmitRecruiter);
router.put('/user/:userId', recruiters_1.updateRecruiterByUserId);
router.put('/:id', recruiters_1.updateRecruiter);
router.delete('/:id', recruiters_1.deleteRecruiter);
router.get('/:id/stats', async (req, res) => {
    try {
        const stats = {
            totalJobs: 0,
            activeJobs: 0,
            totalApplications: 0,
            newApplications: 0,
            totalInterviews: 0,
            upcomingInterviews: 0
        };
        res.status(200).json(stats);
    }
    catch (error) {
        console.error("Error fetching recruiter stats:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
