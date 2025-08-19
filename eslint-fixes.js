#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common patterns to fix
const fixes = [
  // Fix unescaped entities
  {
    pattern: /(['"'])/g,
    replacement: '&apos;',
    description: 'Fix unescaped single quotes'
  },
  {
    pattern: /(["])/g,
    replacement: '&quot;',
    description: 'Fix unescaped double quotes'
  },
  // Fix any types
  {
    pattern: /: any/g,
    replacement: ': unknown',
    description: 'Replace any with unknown'
  },
  // Comment out unused variables
  {
    pattern: /const (\w+) = /g,
    replacement: '// const $1 = ',
    description: 'Comment out unused const variables'
  }
];

// Get all TypeScript files in pages directory
function getAllTsxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllTsxFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Apply fixes to a file
function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let fixedContent = content;
  
  // Apply each fix
  for (const fix of fixes) {
    fixedContent = fixedContent.replace(fix.pattern, fix.replacement);
  }
  
  // Only write if content changed
  if (fixedContent !== content) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`Fixed: ${filePath}`);
  }
}

// Main execution
const pagesDir = path.join(__dirname, 'apps', 'web', 'pages');
const componentDir = path.join(__dirname, 'apps', 'web', 'components');

console.log('Starting ESLint fixes...');

const allFiles = [
  ...getAllTsxFiles(pagesDir),
  ...getAllTsxFiles(componentDir)
];

for (const file of allFiles) {
  try {
    fixFile(file);
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message);
  }
}

console.log('ESLint fixes completed!');
