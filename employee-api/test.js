require('dotenv').config();
const db = require('./db');

async function test() {
  try {
    const [empRows] = await db.query(
      'SELECT emp_id FROM employees WHERE email = ?',
      ['user@test.com']
    );
    console.log('empRows:', empRows);
    
    const conditions = ['lr.emp_id = ?'];
    const queryParams = [empRows[0].emp_id];
    const whereClause = 'WHERE ' + conditions.join(' AND ');
    
    console.log('whereClause:', whereClause);
    console.log('queryParams:', queryParams);

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM leave_requests lr
       JOIN employees e ON lr.emp_id = e.emp_id
       ${whereClause}`,
      queryParams
    );
    console.log('Count:', countResult[0].total);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit();
}

test();