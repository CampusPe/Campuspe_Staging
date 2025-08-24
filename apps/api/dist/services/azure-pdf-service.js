"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class AzurePDFService {
    constructor() {
        this.baseUrl = '';
        this.timeout = 60000;
        this.isServiceAvailable = true;
        this.lastHealthCheck = 0;
        this.healthCheckInterval = 60000;
        const configuredUrl = process.env.AZURE_PDF_SERVICE_URL || process.env.PDF_SERVICE_URL;
        if (!configuredUrl) {
            console.warn('⚠️ No Azure PDF Service URL configured, service will be unavailable');
            this.baseUrl = '';
            this.isServiceAvailable = false;
            return;
        }
        this.baseUrl = configuredUrl;
        this.timeout = 60000;
        if (!this.baseUrl.startsWith('http')) {
            console.warn('⚠️ Invalid Azure PDF Service URL format, marking service as unavailable');
            this.isServiceAvailable = false;
            this.baseUrl = '';
            return;
        }
        console.log('🔧 Azure PDF Service configured with URL:', this.baseUrl);
    }
    async generatePDF(htmlContent, options = {}) {
        try {
            console.log('📄 Generating PDF via Azure PDF Service...');
            console.log('🔗 Service URL:', this.baseUrl);
            if (!await this.healthCheck()) {
                throw new Error('Azure PDF Service is not available');
            }
            const response = await axios_1.default.post(`${this.baseUrl}/generate-pdf`, {
                html: htmlContent,
                options: {
                    format: 'A4',
                    printBackground: true,
                    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
                    displayHeaderFooter: false,
                    timeout: 30000,
                    ...options
                }
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
            this.isServiceAvailable = false;
            this.lastHealthCheck = Date.now();
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
                throw new Error('PDF service temporarily unavailable. Please try again later.');
            }
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }
    async healthCheck() {
        try {
            const now = Date.now();
            if (now - this.lastHealthCheck < this.healthCheckInterval) {
                return this.isServiceAvailable;
            }
            console.log('🏥 Checking Azure PDF Service health...');
            const response = await axios_1.default.get(`${this.baseUrl}/health`, {
                timeout: 5000
            });
            const isHealthy = response.data.status === 'OK' || response.status === 200;
            this.isServiceAvailable = isHealthy;
            this.lastHealthCheck = now;
            console.log(`${isHealthy ? '✅' : '❌'} Azure PDF Service health check:`, isHealthy ? 'HEALTHY' : 'UNHEALTHY');
            return isHealthy;
        }
        catch (error) {
            console.warn('⚠️ Azure PDF Service health check failed:', error.message);
            this.isServiceAvailable = false;
            this.lastHealthCheck = Date.now();
            return false;
        }
    }
    getServiceInfo() {
        return {
            baseUrl: this.baseUrl,
            isAvailable: this.isServiceAvailable,
            lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
            timeout: this.timeout
        };
    }
}
exports.default = new AzurePDFService();
