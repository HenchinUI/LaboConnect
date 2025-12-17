const bcrypt = require('bcryptjs');
const db = require('./db');

async function fixAdminPassword() {
  try {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Generated hash:', hash);
    
    const updateResult = await db.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hash, 'admin@gmail.com']
    );
    
    console.log('Updated rows:', updateResult.rowCount);
    
    const result = await db.query(
      'SELECT id, username, email, role, admin_role, is_verified FROM users WHERE email = $1',
      ['admin@gmail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('Admin user updated successfully:');
      console.log(result.rows[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixAdminPassword();
