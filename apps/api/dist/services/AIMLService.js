"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIMLService = void 0;
class AIMLService {
    constructor() {
        this.vectorDimension = 384;
        console.log('AIMLService initialized - Install OpenAI package for full functionality');
    }
    async generateJobEmbedding(jobData) {
        try {
            return this.generatePlaceholderVector();
        }
        catch (error) {
            console.error('Error generating job embedding:', error);
            return this.generatePlaceholderVector();
        }
    }
    async generateCandidateEmbedding(candidateData) {
        try {
            return this.generatePlaceholderVector();
        }
        catch (error) {
            console.error('Error generating candidate embedding:', error);
            return this.generatePlaceholderVector();
        }
    }
    calculateCosineSimilarity(vectorA, vectorB) {
        if (vectorA.length !== vectorB.length) {
            throw new Error('Vectors must have the same dimension');
        }
        const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
        const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
        if (magnitudeA === 0 || magnitudeB === 0)
            return 0;
        return dotProduct / (magnitudeA * magnitudeB);
    }
    async calculateAdvancedMatchScore(jobData, candidateData) {
        const skillsMatch = this.calculateSkillsMatch(jobData.requiredSkills || [], candidateData.skills || []);
        const experienceMatch = this.calculateExperienceMatch(jobData.minExperience || 0, jobData.maxExperience || 100, candidateData.experience || 0);
        const educationMatch = this.calculateEducationMatch(jobData.educationRequirements || [], candidateData.education || {});
        const locationMatch = this.calculateLocationMatch(jobData.locations || [], candidateData.location || {}, jobData.workMode || 'onsite');
        const semanticMatch = await this.calculateSemanticMatch(jobData, candidateData);
        const weights = {
            skills: 0.30,
            experience: 0.25,
            education: 0.20,
            location: 0.15,
            semantic: 0.10
        };
        const overallScore = skillsMatch * weights.skills +
            experienceMatch * weights.experience +
            educationMatch * weights.education +
            locationMatch * weights.location +
            semanticMatch * weights.semantic;
        return {
            overallScore: Math.round(overallScore * 100) / 100,
            skillsMatch,
            experienceMatch,
            educationMatch,
            locationMatch,
            semanticMatch,
            breakdown: {
                skills: skillsMatch,
                experience: experienceMatch,
                education: educationMatch,
                location: locationMatch,
                semantic: semanticMatch
            }
        };
    }
    async analyzeResume(resumeText) {
        try {
            return this.getDefaultResumeAnalysis();
        }
        catch (error) {
            console.error('Error analyzing resume:', error);
            return this.getDefaultResumeAnalysis();
        }
    }
    async predictHiringProbability(candidateData, jobData, historicalData) {
        try {
            const matchScore = await this.calculateAdvancedMatchScore(jobData, candidateData);
            let probability = matchScore.overallScore;
            const marketFactors = this.analyzeMarketFactors(candidateData, jobData);
            probability = probability * (1 + marketFactors.adjustment);
            if (historicalData && historicalData.length > 0) {
                const historicalRate = this.calculateHistoricalSuccessRate(historicalData);
                probability = (probability + historicalRate) / 2;
            }
            probability = Math.max(0, Math.min(1, probability));
            return {
                probability: Math.round(probability * 100) / 100,
                confidence: this.calculateConfidenceScore(matchScore, marketFactors),
                factors: {
                    skillMatch: matchScore.skillsMatch,
                    experienceMatch: matchScore.experienceMatch,
                    marketDemand: marketFactors.demand,
                    salaryExpectation: marketFactors.salaryAlignment
                },
                reasoning: this.generateHiringReasons(matchScore, marketFactors)
            };
        }
        catch (error) {
            console.error('Error predicting hiring probability:', error);
            return {
                probability: 0.5,
                confidence: 0.3,
                factors: {},
                reasoning: ['Analysis incomplete due to technical error']
            };
        }
    }
    async generateJobRecommendations(candidateId, candidateProfile, availableJobs, limit = 10) {
        const recommendations = [];
        for (const job of availableJobs) {
            const matchScore = await this.calculateAdvancedMatchScore(job, candidateProfile);
            if (matchScore.overallScore > 0.3) {
                recommendations.push({
                    jobId: job._id,
                    matchScore: matchScore.overallScore,
                    reasoning: this.generateMatchingReasons(matchScore),
                    salaryFit: this.calculateSalaryFit(job.salary, candidateProfile.expectedSalary),
                    growthPotential: this.calculateGrowthPotential(job, candidateProfile)
                });
            }
        }
        return recommendations
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit);
    }
    createJobText(jobData) {
        return [
            `Job Title: ${jobData.title}`,
            `Department: ${jobData.department}`,
            `Experience Level: ${jobData.experienceLevel}`,
            `Required Skills: ${jobData.requiredSkills.join(', ')}`,
            `Description: ${jobData.description}`
        ].join('\n');
    }
    createCandidateText(candidateData) {
        return [
            `Skills: ${candidateData.skills.join(', ')}`,
            `Experience: ${candidateData.experience}`,
            `Education: ${candidateData.education}`,
            `Projects: ${candidateData.projects?.join(', ') || ''}`,
            `Certifications: ${candidateData.certifications?.join(', ') || ''}`
        ].join('\n');
    }
    calculateSkillsMatch(requiredSkills, candidateSkills) {
        if (requiredSkills.length === 0)
            return 1;
        const normalizedRequired = requiredSkills.map(s => s.toLowerCase());
        const normalizedCandidate = candidateSkills.map(s => s.toLowerCase());
        const matches = normalizedRequired.filter(skill => normalizedCandidate.some(candidateSkill => candidateSkill.includes(skill) || skill.includes(candidateSkill)));
        return matches.length / normalizedRequired.length;
    }
    calculateExperienceMatch(minExp, maxExp, candidateExp) {
        if (candidateExp < minExp) {
            return Math.max(0, 1 - (minExp - candidateExp) / minExp);
        }
        else if (candidateExp > maxExp) {
            return Math.max(0.7, 1 - (candidateExp - maxExp) / maxExp);
        }
        else {
            return 1;
        }
    }
    calculateEducationMatch(requirements, candidateEducation) {
        if (requirements.length === 0)
            return 1;
        return requirements.some(req => candidateEducation.degree?.toLowerCase().includes(req.degree?.toLowerCase())) ? 1 : 0.5;
    }
    calculateLocationMatch(jobLocations, candidateLocation, workMode) {
        if (workMode === 'remote')
            return 1;
        if (jobLocations.length === 0)
            return 1;
        return jobLocations.some(loc => loc.city?.toLowerCase() === candidateLocation.city?.toLowerCase()) ? 1 : 0.3;
    }
    async calculateSemanticMatch(jobData, candidateData) {
        try {
            const jobVector = await this.generateJobEmbedding(jobData);
            const candidateVector = await this.generateCandidateEmbedding(candidateData);
            return this.calculateCosineSimilarity(jobVector, candidateVector);
        }
        catch (error) {
            console.error('Error calculating semantic match:', error);
            return 0.5;
        }
    }
    generatePlaceholderVector() {
        return new Array(this.vectorDimension).fill(0).map(() => Math.random() - 0.5);
    }
    createResumeAnalysisPrompt(resumeText) {
        return `
Analyze this resume and extract the following information in JSON format:

${resumeText}

Please provide a JSON response with the following structure:
{
  "skills": ["skill1", "skill2", ...],
  "experience": {
    "totalYears": number,
    "companies": ["company1", ...],
    "roles": ["role1", ...],
    "domains": ["domain1", ...]
  },
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "grade": "string"
    }
  ],
  "certifications": ["cert1", ...],
  "projects": ["project1", ...],
  "keyStrengths": ["strength1", ...],
  "improvementAreas": ["area1", ...],
  "personalityTraits": ["trait1", ...],
  "salaryPrediction": {
    "min": number,
    "max": number,
    "confidence": number
  }
}
`;
    }
    validateResumeAnalysis(analysis) {
        return {
            skills: analysis.skills || [],
            experience: analysis.experience || {
                totalYears: 0,
                companies: [],
                roles: [],
                domains: []
            },
            education: analysis.education || [],
            certifications: analysis.certifications || [],
            projects: analysis.projects || [],
            keyStrengths: analysis.keyStrengths || [],
            improvementAreas: analysis.improvementAreas || [],
            personalityTraits: analysis.personalityTraits || [],
            salaryPrediction: analysis.salaryPrediction || {
                min: 300000,
                max: 500000,
                confidence: 0.5
            }
        };
    }
    getDefaultResumeAnalysis() {
        return {
            skills: [],
            experience: { totalYears: 0, companies: [], roles: [], domains: [] },
            education: [],
            certifications: [],
            projects: [],
            keyStrengths: [],
            improvementAreas: [],
            personalityTraits: [],
            salaryPrediction: { min: 300000, max: 500000, confidence: 0.3 }
        };
    }
    analyzeMarketFactors(candidateData, jobData) {
        return {
            demand: 0.7,
            salaryAlignment: 0.8,
            adjustment: 0.1
        };
    }
    calculateHistoricalSuccessRate(historicalData) {
        const successful = historicalData.filter(d => d.hired === true).length;
        return successful / historicalData.length;
    }
    calculateConfidenceScore(matchScore, marketFactors) {
        return Math.min(1, (matchScore.overallScore + marketFactors.demand) / 2);
    }
    generateHiringReasons(matchScore, marketFactors) {
        const reasons = [];
        if (matchScore.skillsMatch > 0.8) {
            reasons.push('Strong skill alignment with job requirements');
        }
        if (matchScore.experienceMatch > 0.7) {
            reasons.push('Experience level matches job expectations');
        }
        if (marketFactors.demand > 0.7) {
            reasons.push('High market demand for this role type');
        }
        return reasons;
    }
    generateMatchingReasons(matchScore) {
        const reasons = [];
        if (matchScore.skillsMatch > 0.7) {
            reasons.push(`${Math.round(matchScore.skillsMatch * 100)}% skill match`);
        }
        if (matchScore.experienceMatch > 0.7) {
            reasons.push('Experience requirements met');
        }
        if (matchScore.locationMatch > 0.8) {
            reasons.push('Location preference aligned');
        }
        return reasons;
    }
    calculateSalaryFit(jobSalary, expectedSalary) {
        if (!jobSalary || !expectedSalary)
            return 'match';
        const jobMin = jobSalary.min || 0;
        const jobMax = jobSalary.max || jobMin;
        if (expectedSalary < jobMin)
            return 'over';
        if (expectedSalary > jobMax)
            return 'under';
        return 'match';
    }
    calculateGrowthPotential(job, candidate) {
        return Math.random() * 0.5 + 0.5;
    }
}
exports.AIMLService = AIMLService;
exports.default = AIMLService;
