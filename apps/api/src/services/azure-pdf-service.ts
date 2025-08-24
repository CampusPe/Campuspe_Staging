import axios from 'axios';

/**
 * Azure PDF Service Client
 * Connects to Azure Container Instance for PDF generation
 */
class AzurePDFService {
  private baseUrl: string = '';
  private timeout: number = 60000;
  private isServiceAvailable: boolean = true;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 60000; // 1 minute

  constructor() {
    // Use environment variable or default to localhost for development
    const configuredUrl = process.env.AZURE_PDF_SERVICE_URL || process.env.PDF_SERVICE_URL;
    
    // If no URL is configured, mark service as unavailable
    if (!configuredUrl) {
      console.warn('⚠️ No Azure PDF Service URL configured, service will be unavailable');
      this.baseUrl = '';
      this.isServiceAvailable = false;
      return;
    }
    
    this.baseUrl = configuredUrl;
    this.timeout = 60000; // 60 seconds timeout
    
    // Validate URL format
    if (!this.baseUrl.startsWith('http')) {
      console.warn('⚠️ Invalid Azure PDF Service URL format, marking service as unavailable');
      this.isServiceAvailable = false;
      this.baseUrl = '';
      return;
    }
    
    console.log('🔧 Azure PDF Service configured with URL:', this.baseUrl);
  }

  /**
   * Generate PDF from HTML using Azure Container Instance
   */
  async generatePDF(htmlContent: string, options: any = {}): Promise<Buffer> {
    try {
      console.log('📄 Generating PDF via Azure PDF Service...');
      console.log('🔗 Service URL:', this.baseUrl);
      
      // Check if service is available before attempting
      if (!await this.healthCheck()) {
        throw new Error('Azure PDF Service is not available');
      }
      
      const response = await axios.post(
        `${this.baseUrl}/generate-pdf`,
        {
          html: htmlContent,
          options: {
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
            displayHeaderFooter: false,
            timeout: 30000,
            ...options
          }
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'PDF generation failed');
      }

      // Convert base64 back to buffer
      const pdfBuffer = Buffer.from(response.data.pdf, 'base64');
      
      console.log('✅ PDF generated via Azure service, size:', pdfBuffer.length, 'bytes');
      
      return pdfBuffer;

    } catch (error: any) {
      console.error('❌ Azure PDF Service error:', error.message);
      
      // Mark service as unavailable for a while
      this.isServiceAvailable = false;
      this.lastHealthCheck = Date.now();
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        throw new Error('PDF service temporarily unavailable. Please try again later.');
      }
      
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Check if PDF service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use cached result if checked recently
      const now = Date.now();
      if (now - this.lastHealthCheck < this.healthCheckInterval) {
        return this.isServiceAvailable;
      }
      
      console.log('🏥 Checking Azure PDF Service health...');
      
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      
      const isHealthy = response.data.status === 'OK' || response.status === 200;
      this.isServiceAvailable = isHealthy;
      this.lastHealthCheck = now;
      
      console.log(`${isHealthy ? '✅' : '❌'} Azure PDF Service health check:`, isHealthy ? 'HEALTHY' : 'UNHEALTHY');
      
      return isHealthy;
    } catch (error: any) {
      console.warn('⚠️ Azure PDF Service health check failed:', error.message);
      this.isServiceAvailable = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }

  /**
   * Get service status information
   */
  getServiceInfo() {
    return {
      baseUrl: this.baseUrl,
      isAvailable: this.isServiceAvailable,
      lastHealthCheck: new Date(this.lastHealthCheck).toISOString(),
      timeout: this.timeout
    };
  }
}

export default new AzurePDFService();
