import express from 'express';
import authMiddleware from '../middleware/auth';

const router = express.Router();

/**
 * Debug endpoint to test skill normalization
 * POST /api/debug/normalize-skills
 */
router.post('/normalize-skills', authMiddleware, async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: 'Skills array is required'
      });
    }

    // Normalize skill level to match Student schema enum values
    function normalizeSkillLevel(level: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
      if (!level || typeof level !== 'string') {
        return 'intermediate';
      }
      
      const normalizedLevel = level.toLowerCase().trim();
      
      if (normalizedLevel.includes('expert') || 
          normalizedLevel.includes('native') || 
          normalizedLevel.includes('fluent') ||
          normalizedLevel.includes('mastery') ||
          normalizedLevel.includes('senior') ||
          normalizedLevel.includes('lead')) {
        return 'expert';
      }
      
      if (normalizedLevel.includes('advanced') || 
          normalizedLevel.includes('professional') || 
          normalizedLevel.includes('proficient') ||
          normalizedLevel.includes('experienced') ||
          normalizedLevel.includes('strong')) {
        return 'advanced';
      }
      
      if (normalizedLevel.includes('beginner') || 
          normalizedLevel.includes('basic') || 
          normalizedLevel.includes('novice') ||
          normalizedLevel.includes('learning') ||
          normalizedLevel.includes('familiar') ||
          normalizedLevel.includes('entry')) {
        return 'beginner';
      }
      
      return 'intermediate';
    }

    // Normalize skill category to match Student schema enum values
    function normalizeSkillCategory(category: string): 'technical' | 'soft' | 'language' {
      if (!category || typeof category !== 'string') {
        return 'technical';
      }
      
      const normalizedCategory = category.toLowerCase().trim();
      
      if (normalizedCategory.includes('language') || 
          normalizedCategory.includes('linguistic')) {
        return 'language';
      }
      
      if (normalizedCategory.includes('soft') || 
          normalizedCategory.includes('interpersonal') ||
          normalizedCategory.includes('communication') ||
          normalizedCategory.includes('leadership') ||
          normalizedCategory.includes('management') ||
          normalizedCategory.includes('personal')) {
        return 'soft';
      }
      
      return 'technical';
    }

    const normalizedSkills = skills.map((skill: any) => {
      const original = {
        name: skill.name,
        level: skill.level,
        category: skill.category
      };

      const normalized = {
        name: String(skill.name || '').trim(),
        level: normalizeSkillLevel(skill.level),
        category: normalizeSkillCategory(skill.category)
      };

      return {
        original,
        normalized,
        changed: original.level !== normalized.level || original.category !== normalized.category
      };
    });

    const changedSkills = normalizedSkills.filter(skill => skill.changed);

    res.json({
      success: true,
      message: 'Skills normalized successfully',
      data: {
        totalSkills: skills.length,
        changedSkills: changedSkills.length,
        normalizedSkills,
        summary: {
          changedSkills: changedSkills.map(skill => ({
            name: skill.original.name,
            levelChange: `${skill.original.level} → ${skill.normalized.level}`,
            categoryChange: `${skill.original.category} → ${skill.normalized.category}`
          }))
        }
      }
    });

  } catch (error: any) {
    console.error('Error in skill normalization debug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to normalize skills',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Debug endpoint to validate Student schema fields
 * POST /api/debug/validate-student-data
 */
router.post('/validate-student-data', authMiddleware, async (req, res) => {
  try {
    const { studentData } = req.body;

    const validations = {
      skills: {
        valid: true,
        errors: [] as string[],
        validLevels: ['beginner', 'intermediate', 'advanced', 'expert'],
        validCategories: ['technical', 'soft', 'language']
      }
    };

    // Validate skills
    if (studentData.skills && Array.isArray(studentData.skills)) {
      studentData.skills.forEach((skill: any, index: number) => {
        if (!validations.skills.validLevels.includes(skill.level)) {
          validations.skills.valid = false;
          validations.skills.errors.push(`Skill ${index + 1} (${skill.name}): Invalid level "${skill.level}"`);
        }
        
        if (!validations.skills.validCategories.includes(skill.category)) {
          validations.skills.valid = false;
          validations.skills.errors.push(`Skill ${index + 1} (${skill.name}): Invalid category "${skill.category}"`);
        }
      });
    }

    res.json({
      success: true,
      message: 'Student data validation completed',
      data: {
        isValid: validations.skills.valid,
        validations,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error in student data validation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate student data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
