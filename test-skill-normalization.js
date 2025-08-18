// Test the skill normalization functions
const normalizeSkillLevel = (level) => {
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
};

// Test problematic skill levels from error messages
const testSkills = [
  'native/fluent',
  'professional',
  'nativ…onal', // truncated in error message
  'fluent',
  'expert',
  'beginner',
  'advanced',
  'mastery',
  'proficient',
  'basic',
  'senior level',
  'lead developer',
  'unknown level'
];

console.log('Skill Level Normalization Test Results:');
console.log('=====================================');

testSkills.forEach(skill => {
  const normalized = normalizeSkillLevel(skill);
  console.log(`"${skill}" → "${normalized}"`);
});

console.log('\nValidation against Student schema:');
console.log('- Valid levels: ["beginner", "intermediate", "advanced", "expert"]');
console.log('- All normalized values should match these enum values');
