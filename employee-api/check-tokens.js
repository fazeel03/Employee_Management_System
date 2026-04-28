const db = require('./config/database');

async function checkResetTokens() {
  try {
    console.log('🔍 Checking password reset tokens in database...\n');

    // 1. Check all tokens
    const [allTokens] = await db.query(
      'SELECT prt.token, prt.user_id, prt.is_used, prt.created_at, prt.expires_at, u.email ' +
      'FROM password_reset_tokens prt ' +
      'JOIN users u ON prt.user_id = u.id ' +
      'ORDER BY prt.created_at DESC ' +
      'LIMIT 10'
    );

    console.log('📊 Recent Password Reset Tokens:');
    allTokens.forEach((token, index) => {
      const isExpired = new Date(token.expires_at) < new Date();
      const status = token.is_used ? 'USED' : (isExpired ? 'EXPIRED' : 'VALID');
      
      console.log(`\n${index + 1}. Token: ${token.token.substring(0, 20)}...`);
      console.log(`   Email: ${token.email}`);
      console.log(`   Status: ${status}`);
      console.log(`   Created: ${token.created_at}`);
      console.log(`   Expires: ${token.expires_at}`);
      console.log(`   Used: ${token.is_used ? 'Yes' : 'No'}`);
    });

    // 2. Check specific token (if provided)
    const specificToken = process.argv[2];
    if (specificToken) {
      console.log(`\n🔍 Checking specific token: ${specificToken}`);
      
      const [tokens] = await db.query(
        'SELECT prt.*, u.email FROM password_reset_tokens prt ' +
        'JOIN users u ON prt.user_id = u.id ' +
        'WHERE prt.token = ?',
        [specificToken]
      );

      if (tokens.length > 0) {
        const token = tokens[0];
        const isExpired = new Date(token.expires_at) < new Date();
        const isValid = !token.is_used && !isExpired;
        
        console.log('✅ Token found in database:');
        console.log(`   Email: ${token.email}`);
        console.log(`   Valid: ${isValid ? 'YES' : 'NO'}`);
        console.log(`   Used: ${token.is_used ? 'YES' : 'NO'}`);
        console.log(`   Expired: ${isExpired ? 'YES' : 'NO'}`);
        console.log(`   Created: ${token.created_at}`);
        console.log(`   Expires: ${token.expires_at}`);
      } else {
        console.log('❌ Token not found in database');
      }
    }

    // 3. Database schema check
    console.log('\n🗄️ Database Schema Check:');
    const [schema] = await db.query('DESCRIBE password_reset_tokens');
    schema.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key || ''}`);
    });

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    process.exit(0);
  }
}

checkResetTokens();
