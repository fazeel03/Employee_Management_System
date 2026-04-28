const bcrypt = require('bcryptjs');

async function generateAdminHash() {
  const password = 'admin123';
  const saltRounds = 12;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nUse this hash in your SQL INSERT statement:');
    console.log(`INSERT INTO users (name, email, password, role) VALUES 
('System Administrator', 'admin@company.com', '${hash}', 'admin');`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateAdminHash();
