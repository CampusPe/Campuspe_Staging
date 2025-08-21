"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class AzurePDFService {
    constructor() {
        this.baseUrl = process.env.AZURE_PDF_SERVICE_URL || 'http://localhost:3000';
        this.timeout = 60000;
    }
    async generatePDF(htmlContent, options = {}) {
        try {
            console.log('📄 Generating PDF via Azure PDF Service...');
            const response = await axios_1.default.post(`${this.baseUrl}/generate-pdf`, {
                html: htmlContent,
                options
            }, {
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.data.success) {
                throw new Error(response.data.message || 'PDF generation failed');
            }
            const pdfBuffer = Buffer.from(response.data.pdf, 'base64');
            console.log('✅ PDF generated via Azure service, size:', pdfBuffer.length, 'bytes');
            return pdfBuffer;
        }
        catch (error) {
            console.error('❌ Azure PDF Service error:', error.message);
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                throw new Error('PDF service temporarily unavailable. Please try again later.');
            }
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }
    async healthCheck() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/health`, {
                timeout: 5000
            });
            return response.data.status === 'OK';
        }
        catch (error) {
            console.warn('⚠️ Azure PDF Service health check failed:', error);
            return false;
        }
    }
}
exports.default = new AzurePDFService();
