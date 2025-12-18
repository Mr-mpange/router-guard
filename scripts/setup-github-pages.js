#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get repository name from command line argument or prompt
const repoName = process.argv[2];

if (!repoName) {
  console.log('Usage: node scripts/setup-github-pages.js <repository-name>');
  console.log('Example: node scripts/setup-github-pages.js my-awesome-app');
  process.exit(1);
}

// Update vite.config.ts with the correct repository name
const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

// Replace the placeholder with actual repo name
viteConfig = viteConfig.replace('/your-repo-name/', `/${repoName}/`);

fs.writeFileSync(viteConfigPath, viteConfig);

console.log(`✅ Updated vite.config.ts with repository name: ${repoName}`);
console.log('✅ GitHub Pages setup complete!');
console.log('\nNext steps:');
console.log('1. Push your changes to GitHub');
console.log('2. Go to your repository Settings > Pages');
console.log('3. Set Source to "GitHub Actions"');
console.log('4. Your site will be available at: https://your-username.github.io/' + repoName);