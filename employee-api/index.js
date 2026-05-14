require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const employeeProjectRoutes = require('./routes/employeeProjectRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const positionRoutes = require('./routes/positionRoutes');
const projectRoutes = require('./routes/projectRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const managerRoutes = require('./routes/managerRoutes');
const syncRoutes = require('./routes/syncRoutes');

const db = require('./db');

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      'http://localhost',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Key', 'X-Tenant-Id'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);

app.get('/api/v1/health', async (req, res) => {
  try {
    const dbHealth = await db.checkDatabaseConnection();
    res.json({
      success: true,
      status: 'Healthy',
      isHealthy: true,
      database: dbHealth
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'Unhealthy',
      isHealthy: false,
      database: {
        isHealthy: false
      }
    });
  }
});

app.get('/api/v1/health/db', async (req, res) => {
  try {
    const dbHealth = await db.checkDatabaseConnection();
    res.json({
      success: true,
      status: 'Healthy',
      database: dbHealth
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'Unhealthy',
      database: {
        isHealthy: false
      }
    });
  }
});

app.get('/api/v1/health/last-activity', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT MAX(timestamp) as last_activity FROM audit_log');
    const lastActivity = rows[0].last_activity;

    if (!lastActivity) {
      return res.json({ display: 'No activity yet', raw: null });
    }

    const diffMs = new Date() - new Date(lastActivity);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let display;
    if (diffMins < 1) display = 'Just now';
    else if (diffMins < 60) display = `${diffMins} mins ago`;
    else if (diffHours < 24) display = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    else display = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    res.json({ display, raw: lastActivity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/positions', positionRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/employee-projects', employeeProjectRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leave-requests', leaveRoutes);
app.use('/api/v1/salary-history', salaryRoutes);
app.use('/api/v1/manager', managerRoutes);
app.use('/api/v1/sync', syncRoutes);

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await db.checkDatabaseConnection();

    app.listen(PORT, () => {
      console.log(` MVC Server Running on Port ${PORT} `);
    });
  } catch (error) {
    console.error('Database connection failed. Server startup aborted.');
    console.error(`Reason: ${error.code || error.message}`);
    process.exit(1);
  }
}

startServer();
