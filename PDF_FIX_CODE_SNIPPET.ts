// 🔧 Critical Fix for PDF Generation Quality Issue
// Add this method to your ResumeBuilderService class

/**
 * Enhanced PDF generation method that works on both localhost and Azure
 * This replaces the existing generatePDF method
 */
async generatePDF(htmlContent: string): Promise<Buffer> {
  console.log('📄 Starting enhanced PDF generation (localhost + Azure compatible)...');
  
  // Strategy 1: Try Puppeteer with Azure compatibility
  try {
    return await this.generatePuppeteerPDF(htmlContent);
  } catch (puppeteerError) {
    console.warn('⚠️ Puppeteer failed:', puppeteerError.message);
    
    // Strategy 2: Enhanced PDFKit fallback with proper styling
    try {
      console.log('🔄 Using enhanced PDFKit fallback...');
      return await this.generateEnhancedStructuredPDF(htmlContent);
    } catch (fallbackError) {
      console.error('❌ All PDF generation methods failed');
      throw new Error('PDF generation is temporarily unavailable. Please try again.');
    }
  }
}

/**
 * Puppeteer PDF generation with Azure compatibility
 */
private async generatePuppeteerPDF(htmlContent: string): Promise<Buffer> {
  let browser = null;
  let page = null;
  
  try {
    // Initialize browser with Azure-compatible configuration
    browser = await this.initBrowserForAzure();
    page = await browser.newPage();
    
    // Set viewport and content
    await page.setViewport({ width: 1200, height: 1600 });
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for styling to load
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', () => resolve());
        }
      });
    });
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      timeout: 30000,
      preferCSSPageSize: false,
      displayHeaderFooter: false
    });
    
    console.log('✅ Puppeteer PDF generated successfully');
    return Buffer.from(pdf);
    
  } finally {
    if (page) await page.close();
  }
}

/**
 * Initialize browser with Azure compatibility
 */
private async initBrowserForAzure() {
  const isAzure = process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production';
  
  let puppeteerConfig: any = {
    headless: true,
    timeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote'
    ]
  };

  if (isAzure) {
    try {
      // Try chrome-aws-lambda for Azure
      const chromium = require('chrome-aws-lambda');
      puppeteerConfig = {
        ...puppeteerConfig,
        args: [...chromium.args, ...puppeteerConfig.args],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      };
      console.log('✅ Using chrome-aws-lambda for Azure');
    } catch (error) {
      console.warn('⚠️ chrome-aws-lambda not available, trying system paths...');
      
      // Fallback to system Chrome paths
      const chromePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser'
      ];
      
      for (const path of chromePaths) {
        try {
          const fs = require('fs');
          if (fs.existsSync(path)) {
            puppeteerConfig.executablePath = path;
            console.log(`✅ Found Chrome at: ${path}`);
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!puppeteerConfig.executablePath) {
        throw new Error('No Chrome executable found on Azure');
      }
    }
  }

  return await puppeteer.launch(puppeteerConfig);
}

/**
 * Enhanced structured PDF generation that preserves styling
 */
private async generateEnhancedStructuredPDF(htmlContent: string): Promise<Buffer> {
  console.log('📄 Generating enhanced structured PDF...');
  
  // Parse HTML with improved extraction
  const resumeData = this.parseHTMLContentEnhanced(htmlContent);
  
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 }
  });
  
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      console.log('✅ Enhanced structured PDF generated successfully');
      resolve(pdfBuffer);
    });
    
    doc.on('error', reject);
    
    // Generate professional PDF content
    this.renderProfessionalPDF(doc, resumeData);
    doc.end();
  });
}

/**
 * Enhanced HTML parsing with better pattern matching
 */
private parseHTMLContentEnhanced(htmlContent: string): any {
  // Extract name with multiple patterns
  const namePatterns = [
    /<h1[^>]*class="name"[^>]*>([^<]+)<\/h1>/i,
    /<div[^>]*class="name"[^>]*>([^<]+)<\/div>/i,
    /<h1[^>]*>([^<]+)<\/h1>/i
  ];
  
  let name = 'Professional Resume';
  for (const pattern of namePatterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      name = match[1].trim();
      break;
    }
  }
  
  // Extract contact information
  const emailMatch = htmlContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = htmlContent.match(/(\+?[\d\s\-\(\)]{10,})/);
  
  const contactParts = [];
  if (emailMatch) contactParts.push(`📧 ${emailMatch[1].trim()}`);
  if (phoneMatch) contactParts.push(`📱 ${phoneMatch[1].trim()}`);
  
  // Extract summary
  const summaryMatch = htmlContent.match(/<div[^>]*class="summary"[^>]*>(.*?)<\/div>/s);
  const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]*>/g, '').trim() : '';
  
  // Extract skills with improved pattern matching
  const skills: string[] = [];
  const skillPatterns = [
    /<span[^>]*class="skill[^"]*"[^>]*>([^<]+)<\/span>/g,
    /(?:•|<li>)\s*([A-Za-z][^<\n•]{2,30})(?:<\/li>|$)/g
  ];
  
  skillPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(htmlContent)) !== null) {
      const skill = match[1].replace(/<[^>]*>/g, '').trim();
      if (skill && skill.length > 2 && skill.length < 50 && !skills.includes(skill)) {
        skills.push(skill);
      }
    }
  });
  
  return {
    name,
    contact: contactParts.join('  •  '),
    summary,
    skills,
    experience: this.extractExperienceData(htmlContent),
    education: this.extractEducationData(htmlContent),
    projects: this.extractProjectsData(htmlContent)
  };
}

/**
 * Render professional PDF with proper styling
 */
private renderProfessionalPDF(doc: any, resumeData: any): void {
  const pageWidth = 595.28;
  const leftMargin = 40;
  const rightMargin = 40;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  let yPos = 70;
  
  const colors = {
    primary: '#1e40af',
    secondary: '#666',
    text: '#333',
    accent: '#059669'
  };
  
  // Helper for page breaks
  const checkPageBreak = (height: number) => {
    if (yPos + height > 750) {
      doc.addPage();
      yPos = 40;
    }
  };
  
  // Header - Name with professional styling
  doc.fontSize(28)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(resumeData.name.toUpperCase(), leftMargin, yPos, {
       width: contentWidth,
       align: 'center',
       characterSpacing: 1
     });
  
  yPos += 40;
  
  // Contact Information
  if (resumeData.contact) {
    doc.fontSize(11)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text(resumeData.contact, leftMargin, yPos, {
         width: contentWidth,
         align: 'center'
       });
    yPos += 25;
  }
  
  // Professional separator line
  doc.moveTo(leftMargin, yPos)
     .lineTo(pageWidth - rightMargin, yPos)
     .strokeColor(colors.primary)
     .lineWidth(2)
     .stroke();
  
  yPos += 25;
  
  // Professional Summary Section
  if (resumeData.summary) {
    checkPageBreak(80);
    this.addProfessionalSection(doc, 'PROFESSIONAL SUMMARY', resumeData.summary, 
                               yPos, leftMargin, contentWidth, colors);
    yPos += this.calculateSectionHeight(doc, resumeData.summary, contentWidth) + 25;
  }
  
  // Skills Section with grid layout
  if (resumeData.skills.length > 0) {
    checkPageBreak(100);
    yPos = this.renderSkillsSection(doc, resumeData.skills, yPos, leftMargin, contentWidth, colors);
  }
  
  // Experience Section
  if (resumeData.experience.length > 0) {
    checkPageBreak(100);
    yPos = this.renderExperienceSection(doc, resumeData.experience, yPos, leftMargin, contentWidth, colors, checkPageBreak);
  }
  
  // Education Section
  if (resumeData.education.length > 0) {
    checkPageBreak(80);
    yPos = this.renderEducationSection(doc, resumeData.education, yPos, leftMargin, contentWidth, colors);
  }
  
  // Projects Section
  if (resumeData.projects.length > 0) {
    checkPageBreak(80);
    yPos = this.renderProjectsSection(doc, resumeData.projects, yPos, leftMargin, contentWidth, colors, checkPageBreak);
  }
}

// Helper methods for rendering different sections...
private addProfessionalSection(doc: any, title: string, content: string, yPos: number, 
                              leftMargin: number, contentWidth: number, colors: any): void {
  doc.fontSize(16)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(title, leftMargin, yPos);
  
  yPos += 20;
  
  // Section underline
  doc.moveTo(leftMargin, yPos - 5)
     .lineTo(leftMargin + title.length * 8, yPos - 5)
     .strokeColor('#e5e7eb')
     .lineWidth(1)
     .stroke();
  
  yPos += 5;
  
  doc.fontSize(12)
     .fillColor(colors.text)
     .font('Helvetica')
     .text(content, leftMargin, yPos, {
       width: contentWidth,
       align: 'justify',
       lineGap: 3
     });
}

private calculateSectionHeight(doc: any, text: string, width: number): number {
  return doc.heightOfString(text, { width, lineGap: 3 });
}

// Add other helper methods for skills, experience, education, and projects sections...
