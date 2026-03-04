const shouldSkip = process.env.SKIP_POSTINSTALL === '1' || process.env.SKIP_POSTINSTALL === 'true';

if (shouldSkip) {
  console.log('Skipping postinstall build (SKIP_POSTINSTALL set)');
  process.exit(0);
}

const { execSync } = require('node:child_process');

try {
  execSync('npm run build', { stdio: 'inherit' });
  execSync('npx puppeteer install', { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status || 1);
}
