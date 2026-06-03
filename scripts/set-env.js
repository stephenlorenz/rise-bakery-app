const fs = require('fs');
const path = require('path');

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'STRIPE_PUBLISHABLE_KEY'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const content = `export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseAnonKey: '${process.env.SUPABASE_ANON_KEY}',
  stripePublishableKey: '${process.env.STRIPE_PUBLISHABLE_KEY}',
};
`;

const dest = path.join(__dirname, '../src/environments/environment.ts');
fs.writeFileSync(dest, content);
console.log('environment.ts generated from Netlify environment variables.');
