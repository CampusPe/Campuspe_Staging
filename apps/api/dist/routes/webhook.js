"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webhook_1 = require("../controllers/webhook");
const router = express_1.default.Router();
router.get('/webhook', webhook_1.verifyWebhook);
router.post('/webhook', webhook_1.handleWebhook);
router.post('/wabb-webhook', webhook_1.handleWABBWebhook);
exports.default = router;
