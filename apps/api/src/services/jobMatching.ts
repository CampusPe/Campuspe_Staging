import { Job } from '../models/Job';
import { Student } from '../models/Student';
import mongoose from 'mongoose';

interface JobMatchResult {
  jobId: string;
  jobTitle: string;
  company: string;
  matchPercentage: number;
  matchedSkills: string[];
  location?: string;
  salary?: string;
}

export class JobMatchingService {
  static async findMatchingJobs(userId: string, studentSkills: string[], category: string): Promise<JobMatchResult[]> {
    try {
      console.log(`🔍 Finding jobs for skills: [${studentSkills.join(', ')}] in category: ${category}`);
      
      // Enhanced query to find more relevant jobs
      const jobs = await Job.find({ 
        status: 'active',
        $or: [
          // Direct skill matches in required skills
          { 'requiredSkills': { $in: studentSkills.map(s => new RegExp(JobMatchingService.escapeRegExp(s), 'i')) } },
          // Category/department matches
          { department: new RegExp(JobMatchingService.escapeRegExp(category), 'i') },
          // Title matches for any of the skills
          { title: { $in: studentSkills.map(s => new RegExp(JobMatchingService.escapeRegExp(s), 'i')) } },
          // Description matches for technical skills
          { description: { $in: studentSkills.slice(0, 5).map(s => new RegExp(JobMatchingService.escapeRegExp(s), 'i')) } },
          // Job type matches
          { jobType: { $in: ['full-time', 'internship', 'contract'] } }
        ]
      }).limit(50); // Increased limit for better matching

      console.log(`📋 Found ${jobs.length} potential jobs to analyze`);
      const matches: JobMatchResult[] = [];

      for (const job of jobs) {
        const matchResult = this.calculateJobMatch(job, studentSkills, category);
        console.log(`🎯 Job: ${job.title} at ${job.companyName} - Match: ${matchResult.matchPercentage}%`);
        
        // Lower threshold for better opportunities (was 50%, now 40%)
        if (matchResult.matchPercentage >= 40) {
          matches.push(matchResult);
        }
      }

      // Sort by match percentage (highest first)
      const sortedMatches = matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
      
      console.log(`✅ Final matches: ${sortedMatches.length} jobs with scores: ${sortedMatches.slice(0, 5).map(m => m.matchPercentage + '%').join(', ')}`);
      
      return sortedMatches;

    } catch (error) {
      console.error('Error finding matching jobs:', error);
      return [];
    }
  }

  private static calculateJobMatch(job: any, studentSkills: string[], category: string): JobMatchResult {
    let matchScore = 0;
    const matchedSkills: string[] = [];
    console.log(`🔍 Calculating match for "${job.title}" with skills: [${studentSkills.join(', ')}]`);

    // 1. Enhanced Skills matching (50% weight) - Most important factor
    const jobSkills = job.requiredSkills || [];
    const jobSkillsLower = jobSkills.map((s: string) => s.toLowerCase());
    const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
    
    // Direct skill matches
    const directMatches = studentSkillsLower.filter(skill => 
      jobSkillsLower.some((jobSkill: string) => 
        jobSkill.includes(skill) || skill.includes(jobSkill) || this.areSkillsSimilar(skill, jobSkill)
      )
    );
    
    // Find matched skills for display
    directMatches.forEach(skill => {
      const originalSkill = studentSkills.find(s => s.toLowerCase() === skill);
      if (originalSkill && !matchedSkills.includes(originalSkill)) {
        matchedSkills.push(originalSkill);
      }
    });
    
    // Calculate skill match score
    let skillMatchScore = 0;
    if (jobSkills.length > 0) {
      skillMatchScore = (directMatches.length / Math.max(jobSkills.length, studentSkills.length)) * 50;
    } else {
      // If no specific skills listed, give partial credit for category match
      skillMatchScore = 25;
    }
    matchScore += skillMatchScore;
    
    console.log(`  📊 Skill match: ${directMatches.length}/${jobSkills.length} skills = ${skillMatchScore.toFixed(1)}%`);

    // 2. Category/Department matching (20% weight)
    const jobCategory = job.department || '';
    const jobTitle = job.title || '';
    let categoryScore = 0;
    
    if (jobCategory.toLowerCase().includes(category.toLowerCase()) || 
        category.toLowerCase().includes(jobCategory.toLowerCase()) ||
        jobTitle.toLowerCase().includes(category.toLowerCase().split(' ')[0])) {
      categoryScore = 20;
    }
    matchScore += categoryScore;
    console.log(`  🏢 Category match: ${categoryScore}%`);

    // 3. Title and Description relevance (20% weight)
    const jobTitleLower = job.title.toLowerCase();
    const jobDescription = (job.description || '').toLowerCase();
    let titleRelevanceScore = 0;
    
    // Check if student skills appear in job title or description
    const skillsInTitle = studentSkillsLower.filter(skill => 
      jobTitleLower.includes(skill) || skill.split(' ').some(word => jobTitleLower.includes(word))
    ).length;
    
    const skillsInDescription = studentSkillsLower.filter(skill => 
      jobDescription.includes(skill)
    ).length;
    
    titleRelevanceScore = Math.min(20, (skillsInTitle * 10) + (skillsInDescription * 2));
    matchScore += titleRelevanceScore;
    console.log(`  📝 Title/Desc relevance: ${titleRelevanceScore}%`);

    // 4. Experience level matching (10% weight)
    const jobExperienceLevel = (job.experienceLevel || 'entry').toLowerCase();
    let experienceScore = 0;
    
    if (jobExperienceLevel.includes('entry') || 
        jobExperienceLevel.includes('junior') || 
        jobExperienceLevel.includes('fresher') ||
        jobExperienceLevel.includes('intern')) {
      experienceScore = 10; // Good match for students
    } else if (jobExperienceLevel.includes('mid') || jobExperienceLevel.includes('senior')) {
      experienceScore = 5; // Partial match
    }
    matchScore += experienceScore;
    console.log(`  👨‍💼 Experience match: ${experienceScore}%`);

    // Ensure we have some meaningful matches to display
    if (matchedSkills.length === 0 && skillsInTitle > 0) {
      // Add skills found in title as matched skills
      studentSkills.forEach(skill => {
        if (jobTitleLower.includes(skill.toLowerCase()) && !matchedSkills.includes(skill)) {
          matchedSkills.push(skill);
        }
      });
    }

    const finalScore = Math.round(Math.min(matchScore, 100));
    console.log(`  🎯 Final match score: ${finalScore}%`);

    return {
      jobId: job._id.toString(),
      jobTitle: job.title,
      company: job.companyName || 'Company',
      matchPercentage: finalScore,
      matchedSkills,
      location: job.locations?.[0] ? `${job.locations[0].city}, ${job.locations[0].state}` : 'Multiple locations',
      salary: job.salary ? `${job.salary.min}-${job.salary.max} ${job.salary.currency}` : 'Competitive'
    };
  }

  // Helper method to check if skills are similar (e.g., "React" and "React.js")
  private static areSkillsSimilar(skill1: string, skill2: string): boolean {
    const normalize = (skill: string) => skill.toLowerCase().replace(/[.\-_]/g, '');
    const norm1 = normalize(skill1);
    const norm2 = normalize(skill2);
    
    return norm1.includes(norm2) || norm2.includes(norm1) || 
           Math.abs(norm1.length - norm2.length) <= 2 && 
           (norm1.substring(0, 3) === norm2.substring(0, 3));
  }

  static async saveJobMatches(userId: string, matches: JobMatchResult[]) {
    try {
      await Student.findOneAndUpdate(
        { userId: userId },
        { 
          $set: { 
            jobMatches: matches,
            lastJobMatchUpdate: new Date()
          } 
        }
      );
    } catch (error) {
      console.error('Error saving job matches:', error);
    }
  }

  static async triggerJobAlerts(userId: string, matches: JobMatchResult[]) {
    try {
      // Filter high-quality matches (60%+ instead of 70% for more opportunities)
      const highQualityMatches = matches.filter(match => match.matchPercentage >= 60);
      
      if (highQualityMatches.length === 0) {
        console.log('❌ No high-quality matches found for alerts (threshold: 60%)');
        return;
      }

      console.log(`📱 Triggering alerts for ${highQualityMatches.length} high-quality matches`);

      // Get student info for WhatsApp with enhanced contact lookup
      const student = await Student.findOne({ userId })
        .populate('userId', 'name phone email whatsappNumber')
        .lean();
      
      if (!student) {
        console.log('❌ Student not found for alerts');
        return;
      }

      // Enhanced contact info retrieval with multiple fallbacks
      let phoneNumber = null;
      let studentName = student.firstName || 'Student';
      
      // Try multiple sources for phone number
      if (student.userId) {
        phoneNumber = (student.userId as any).whatsappNumber || 
                     (student.userId as any).phone;
      }
      
      // Fallback to student record phone fields
      if (!phoneNumber) {
        phoneNumber = (student as any).whatsappNumber || 
                     (student as any).phoneNumber || 
                     (student as any).phone;
      }
      
      if (!phoneNumber) {
        console.log('❌ No phone number found for WhatsApp alerts');
        console.log('Student contact data:', {
          userId: student.userId,
          studentPhone: (student as any).phoneNumber,
          studentWhatsapp: (student as any).whatsappNumber
        });
        return;
      }

      console.log(`📞 Found contact info for ${studentName}: ${phoneNumber}`);

      // Send WhatsApp notification using the service
      const topMatch = highQualityMatches[0];
      
      try {
        const { sendJobMatchNotification } = require('./whatsapp');
        
        const messageData = {
          jobTitle: topMatch.jobTitle,
          company: topMatch.company,
          location: topMatch.location || 'Remote',
          salary: topMatch.salary || 'Competitive',
          matchScore: topMatch.matchPercentage.toString(),
          matchedSkills: topMatch.matchedSkills.slice(0, 3).join(', '),
          totalMatches: highQualityMatches.length.toString(),
          personalizedMessage: `Great opportunity for ${studentName}!`,
          jobLink: `https://campuspe.com/jobs/${topMatch.jobId}`
        };

        const result = await sendJobMatchNotification(phoneNumber, messageData);
        
        if (result.success) {
          console.log(`✅ WhatsApp alert sent successfully to ${studentName} (${phoneNumber})`);
          console.log(`🎯 Top match: ${topMatch.matchPercentage}% with ${topMatch.jobTitle} at ${topMatch.company}`);
        } else {
          console.log(`❌ Failed to send WhatsApp alert: ${result.message}`);
        }
      } catch (whatsappError) {
        console.error('❌ WhatsApp service error:', whatsappError);
      }
      
    } catch (error) {
      console.error('❌ Error triggering job alerts:', error);
    }
  }

  private static formatJobAlertMessage(student: any, topMatch: JobMatchResult, totalMatches: number): string {
    return `🎯 *Job Alert for ${student.firstName}!*

🏢 *${topMatch.jobTitle}* at *${topMatch.company}*
📊 Match: *${topMatch.matchPercentage}%*
🎯 Skills: ${topMatch.matchedSkills.slice(0, 3).join(', ')}
${topMatch.location ? `📍 Location: ${topMatch.location}` : ''}
${topMatch.salary ? `💰 Salary: ${topMatch.salary}` : ''}

${totalMatches > 1 ? `🔔 ${totalMatches - 1} more matches available!` : ''}

🚀 Login to CampusPe to apply now!
dashboard.campuspe.com`;
  }

  // Helper method to escape special regex characters
  public static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
