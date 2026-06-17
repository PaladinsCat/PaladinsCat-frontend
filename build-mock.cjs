const fs = require('fs');
const path = require('path');

// This script verifies that mock-data.ts exists and is valid
const mockDataPath = path.join(__dirname, 'lib', 'mock-data.ts');

if (!fs.existsSync(mockDataPath)) {
  console.error('Mock data file not found: ' + mockDataPath);
  process.exit(1);
}

const content = fs.readFileSync(mockDataPath, 'utf-8');
const hasChampions = content.includes('export const CHAMPIONS');
const hasPlayers = content.includes('export const PLAYERS');
const hasMatches = content.includes('export const MATCHES');

console.log('Mock data file: ' + mockDataPath);
console.log('CHAMPIONS export: ' + hasChampions);
console.log('PLAYERS export: ' + hasPlayers);
console.log('MATCHES export: ' + hasMatches);

if (hasChampions && hasPlayers && hasMatches) {
  console.log('✓ Mock data file is complete');
  process.exit(0);
} else {
  console.log('⚠ Mock data file may be incomplete');
  process.exit(1);
}