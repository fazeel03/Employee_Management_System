require('dotenv').config();
const db = require('./db');

async function test() {
  try {
    const [empRows] = await db.query(
      'SELECT emp_id FROM employees WHERE email = ?',
      ['user@test.com']
    );
    console.log('emp_id found:', empRows[0]?.emp_id);
    
    const whereClause = 'WHERE lr.emp_id = ?';
    const [rows] = await db.query(
      `SELECT lr.*, e.first_name, e.last_name 
       FROM leave_requests lr
       JOIN employees e ON lr.emp_id = e.emp_id
       ${whereClause}
       ORDER BY lr.created_at DESC`,
      [empRows[0].emp_id]
    );
    console.log('Results:', rows.length);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit();
}

test();