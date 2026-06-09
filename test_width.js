import fs from 'fs';
const code = fs.readFileSync('src/styles/shockwave_stats.css', 'utf-8');
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('width:') && (lines[i].includes('therapist-col') || lines[i].includes('compact'))) {
    console.log(`Line ${i}: ${lines[i].trim()}`);
  }
}
