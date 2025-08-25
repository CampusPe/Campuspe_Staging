/**
 * BunnyStorageService implementation for uploading PDFs to BunnyCDN
 * This is a fixed version that ensures proper handling of the access key
 * and proper URL construction.
 */

// Import necessary modules
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class BunnyStorageService {
  constructor() {
    // Get BunnyCDN configuration from environment variables
    this.storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
    this.accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
    this.hostname = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';
    this.cdnUrl = process.env.BUNNY_CDN_URL;
    
    // Validate configuration
    if (!this.storageZone) {
      console.error('BUNNY_STORAGE_ZONE_NAME is not defined in environment variables');
    }
    
    if (!this.accessKey) {
      console.error('BUNNY_STORAGE_ACCESS_KEY is not defined in environment variables');
    }
    
    if (!this.cdnUrl) {
      console.error('BUNNY_CDN_URL is not defined in environment variables');
    }
  }
  
  /**
   * Upload a PDF file to BunnyCDN storage
   * @param {string} filePath - The local path to the PDF file
   * @param {string} remoteFilename - The filename to use in BunnyCDN storage
   * @returns {Promise<string>} - The URL to the uploaded file
   */
  async uploadPDF(filePath, remoteFilename) {
    try {
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Create a remote path with the current date for organization
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Format: /resumes/YYYY/MM/DD/filename.pdf
      const remotePath = `/resumes/${year}/${month}/${day}/${remoteFilename}`;
      
      // Construct the upload URL
      const uploadUrl = `https://${this.hostname}/${this.storageZone}${remotePath}`;
      
      // Log the upload attempt
      console.log(`Uploading PDF to BunnyCDN: ${uploadUrl}`);
      
      // Read the file
      const fileContent = fs.readFileSync(filePath);
      
      // Upload the file to BunnyCDN
      const response = await axios({
        method: 'PUT',
        url: uploadUrl,
        data: fileContent,
        headers: {
          'AccessKey': this.accessKey,
          'Content-Type': 'application/pdf',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      // Check if upload was successful
      if (response.status === 201 || response.status === 200) {
        console.log('PDF uploaded successfully to BunnyCDN');
        
        // Get the direct download URL
        const downloadUrl = this.getDirectDownloadUrl(remotePath);
        return downloadUrl;
      } else {
        console.error(`Failed to upload PDF to BunnyCDN. Status: ${response.status}`);
        throw new Error(`BunnyCDN upload failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error uploading to BunnyCDN:', error.message);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }
  
  /**
   * Get the direct download URL for a file in BunnyCDN storage
   * @param {string} remotePath - The path to the file in BunnyCDN storage
   * @returns {string} - The direct download URL
   */
  getDirectDownloadUrl(remotePath) {
    // Ensure the remotePath starts with a slash and remove any leading slashes from the CDN URL
    const formattedPath = remotePath.startsWith('/') ? remotePath : `/${remotePath}`;
    const formattedCdnUrl = this.cdnUrl.endsWith('/') ? this.cdnUrl.slice(0, -1) : this.cdnUrl;
    
    // Combine the CDN URL with the remote path
    return `${formattedCdnUrl}${formattedPath}`;
  }
}

module.exports = BunnyStorageService;
