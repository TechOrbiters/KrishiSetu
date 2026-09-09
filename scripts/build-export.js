const { execSync } = require('child_process');
process.env.STATIC_EXPORT = 'true';
console.log('[build-export] Starting static export build (STATIC_EXPORT=true)...');
execSync('npx --no-install next build', { stdio: 'inherit', env: process.env });
console.log('[build-export] Static export build complete. Files generated in out/');
