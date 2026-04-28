const crypto = require('crypto');

function generateSecureSecret() {
  // Generate a cryptographically secure 64-character secret
  const secret = crypto.randomBytes(32).toString('hex');
  console.log('Generated JWT Secret (64 characters):'); 
  console.log(secret);
  console.log('\nAdd this to your .env file:');
  console.log(`JWT_SECRET=${secret}`);
}

generateSecureSecret();
