"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const student_career_1 = require("../controllers/student-career");
const router = express_1.default.Router();
router.put('/:id/profile', student_career_1.updateStudentProfile);
router.get('/:id/job-matches', student_career_1.getStudentJobMatches);
router.post('/:id/trigger-alerts', student_career_1.triggerStudentJobAlerts);
router.get('/:id/analyze', student_career_1.analyzeStudentProfile);
exports.default = router;
