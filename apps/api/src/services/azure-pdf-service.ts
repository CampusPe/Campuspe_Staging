import axios from 'axios';

/**
 * Azure PDF Service Client
 * Connects to Azure Container Instance for PDF generation
 */
class AzurePDFService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Use environment variable or default to localhost for development
    this.baseUrl = process.env.AZURE_PDF_SERVICE_URL || 'http://localhost:3000';
    this.timeout = 60000; // 60 seconds timeout
  }

  /**
   * Generate PDF from HTML using Azure Container Instance
   */
  async generatePDF(htmlContent: string, options: any = {}): Promise<Buffer> {
    try {
      console.log('📄 Generating PDF via Azure PDF Service...');
      
      const response = await axios.post(
        `${this.baseUrl}/generate-pdf`,
        {
          html: htmlContent,
          options
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
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
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
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      
      return response.data.status === 'OK';
    } catch (error) {
      console.warn('⚠️ Azure PDF Service health check failed:', error);
      return false;
    }
  }
}

export default new AzurePDFService();
