// Push database schema to Railway PostgreSQL
const { exec } = require('child_process');

console.log('Pushing schema to Railway database...');

exec('railway run npx drizzle-kit push', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  console.log(stdout);
});
