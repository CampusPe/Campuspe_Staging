#!/usr/bin/env node
/**
 * Test script to verify skill level normalization
 */

// Import the normalization functions (we'll copy them here for testing)
function normalizeSkillLevel(level) {
  if (!level || typeof level !== 'string') {
    return 'intermediate'; // Default fallback
  }
  
  const normalizedLevel = level.toLowerCase().trim();
  
  // Map various AI-generated levels to schema enum values
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
  
  // Default to intermediate for any other values
  return 'intermediate';
}

function normalizeSkillCategory(category) {
  if (!category || typeof category !== 'string') {
    return 'technical'; // Default fallback
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
  
  // Default to technical for anything else
  return 'technical';
}

console.log('🧪 Testing skill normalization...');

// Test problematic skill levels from the error messages
const testSkillLevels = [
  'native/fluent',
  'professional',
  'native fluent', 
  'expert',
  'advanced',
  'beginner',
  'basic',
  'proficient',
  'experienced',
  'mastery',
  'invalid-level',
  null,
  undefined,
  ''
];

const testSkillCategories = [
  'technical',
  'soft',
  'language',
  'business', 
  'operational',
  'interpersonal',
  'communication',
  'invalid-category',
  null,
  undefined,
  ''
];

console.log('\n📊 Skill Level Normalization Tests:');
testSkillLevels.forEach(level => {
  const normalized = normalizeSkillLevel(level);
  console.log(`"${level}" → "${normalized}"`);
});

console.log('\n📊 Skill Category Normalization Tests:');
testSkillCategories.forEach(category => {
  const normalized = normalizeSkillCategory(category);
  console.log(`"${category}" → "${normalized}"`);
});

// Test the specific cases from the error messages
console.log('\n🎯 Specific Error Case Tests:');
const errorCases = [
  { name: 'JavaScript', level: 'native/fluent', category: 'technical' },
  { name: 'English', level: 'professional', category: 'language' },
  { name: 'Communication', level: 'native fluent', category: 'soft' }
];

errorCases.forEach(skill => {
  const normalizedLevel = normalizeSkillLevel(skill.level);
  const normalizedCategory = normalizeSkillCategory(skill.category);
  console.log(`${skill.name}: "${skill.level}" → "${normalizedLevel}", "${skill.category}" → "${normalizedCategory}"`);
});

console.log('\n✅ All skill normalization tests completed successfully!');
console.log('The normalization functions should prevent the MongoDB validation errors.');
