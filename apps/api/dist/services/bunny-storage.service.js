"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
class BunnyStorageService {
    constructor() {
        this.config = {
            storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || '',
            accessKey: process.env.BUNNY_STORAGE_ACCESS_KEY || '',
            hostname: process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com',
            cdnUrl: process.env.BUNNY_CDN_URL || ''
        };
        if (!this.config.storageZoneName || !this.config.accessKey || !this.config.cdnUrl) {
            console.warn('⚠️ Bunny.net configuration missing. Please set environment variables:');
            console.warn('   BUNNY_STORAGE_ZONE_NAME');
            console.warn('   BUNNY_STORAGE_ACCESS_KEY');
            console.warn('   BUNNY_CDN_URL');
        }
    }
    async uploadPDFWithRetry(pdfBuffer, fileName, resumeId, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            console.log(`📤 Bunny.net upload attempt ${attempt}/${retries} for: ${resumeId}`);
            const result = await this.uploadPDF(pdfBuffer, fileName, resumeId);
            if (result.success) {
                console.log(`✅ Bunny.net upload successful on attempt ${attempt}`);
                return result;
            }
            if (attempt < retries) {
                console.log(`⚠️ Attempt ${attempt} failed, retrying... Error: ${result.error}`);
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
            else {
                console.log(`❌ All ${retries} attempts failed for Bunny.net upload`);
            }
        }
        return {
            success: false,
            error: `Failed after ${retries} attempts`
        };
    }
    async uploadPDF(pdfBuffer, fileName, resumeId) {
        try {
            if (!this.isConfigured()) {
                return {
                    success: false,
                    error: 'Bunny.net storage not configured'
                };
            }
            const fileExtension = fileName.endsWith('.pdf') ? '.pdf' : '.pdf';
            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueFileName = `resumes/${resumeId}/${sanitizedFileName}`;
            const uploadUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${uniqueFileName}`;
            console.log(`📤 Uploading to Bunny.net: ${uniqueFileName}`);
            console.log(`🔗 Upload URL: ${uploadUrl}`);
            console.log(`🔑 Access Key Length: ${this.config.accessKey.length}`);
            console.log(`📦 Buffer Size: ${pdfBuffer.length} bytes`);
            const response = await axios_1.default.put(uploadUrl, pdfBuffer, {
                headers: {
                    'AccessKey': this.config.accessKey,
                    'Content-Type': 'application/pdf'
                },
                timeout: 30000
            });
            if (response.status === 200 || response.status === 201) {
                const cdnUrl = `${this.config.cdnUrl}/${uniqueFileName}`;
                console.log(`✅ PDF uploaded successfully to Bunny.net`);
                console.log(`🔗 CDN URL: ${cdnUrl}`);
                return {
                    success: true,
                    url: cdnUrl,
                    fileName: uniqueFileName
                };
            }
            else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        }
        catch (error) {
            console.error('❌ Bunny.net upload failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error'
            };
        }
    }
    async uploadPDFFromFile(filePath, resumeId) {
        try {
            if (!fs_1.default.existsSync(filePath)) {
                return {
                    success: false,
                    error: 'File not found'
                };
            }
            const pdfBuffer = fs_1.default.readFileSync(filePath);
            const fileName = filePath.split('/').pop() || `resume_${resumeId}.pdf`;
            return await this.uploadPDF(pdfBuffer, fileName, resumeId);
        }
        catch (error) {
            console.error('❌ Error reading file for upload:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'File read error'
            };
        }
    }
    async deletePDF(fileName) {
        try {
            if (!this.isConfigured()) {
                console.warn('Bunny.net not configured, skipping delete');
                return false;
            }
            const deleteUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${fileName}`;
            console.log(`🗑️ Deleting from Bunny.net: ${fileName}`);
            const response = await axios_1.default.delete(deleteUrl, {
                headers: {
                    'AccessKey': this.config.accessKey
                },
                timeout: 10000
            });
            if (response.status === 200 || response.status === 404) {
                console.log(`✅ File deleted from Bunny.net: ${fileName}`);
                return true;
            }
            else {
                console.error(`❌ Delete failed with status: ${response.status}`);
                return false;
            }
        }
        catch (error) {
            console.error('❌ Bunny.net delete error:', error);
            return false;
        }
    }
    getDirectDownloadUrl(fileName) {
        if (!this.isConfigured()) {
            return '';
        }
        return `${this.config.cdnUrl}/${fileName}`;
    }
    getSecureDownloadUrl(fileName, expiresIn = 3600) {
        return this.getDirectDownloadUrl(fileName);
    }
    isConfigured() {
        return !!(this.config.storageZoneName &&
            this.config.accessKey &&
            this.config.cdnUrl);
    }
    async getStorageStats() {
        try {
            if (!this.isConfigured()) {
                return { configured: false };
            }
            return {
                configured: true,
                storageZone: this.config.storageZoneName,
                cdnUrl: this.config.cdnUrl
            };
        }
        catch (error) {
            console.error('Error getting storage stats:', error);
            return { configured: true, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async testConnection() {
        try {
            if (!this.isConfigured()) {
                return {
                    success: false,
                    message: 'Bunny.net storage not configured'
                };
            }
            const testBuffer = Buffer.from('Test file for Bunny.net connection');
            const testFileName = `test/connection_test_${Date.now()}.txt`;
            const uploadUrl = `https://${this.config.hostname}/${this.config.storageZoneName}/${testFileName}`;
            const response = await axios_1.default.put(uploadUrl, testBuffer, {
                headers: {
                    'AccessKey': this.config.accessKey,
                    'Content-Type': 'text/plain'
                },
                timeout: 10000
            });
            if (response.status === 200 || response.status === 201) {
                await this.deletePDF(testFileName);
                return {
                    success: true,
                    message: 'Bunny.net connection successful'
                };
            }
            else {
                return {
                    success: false,
                    message: `Connection test failed with status: ${response.status}`
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Connection test failed'
            };
        }
    }
}
exports.default = new BunnyStorageService();
