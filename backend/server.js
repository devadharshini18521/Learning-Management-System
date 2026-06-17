const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

/* =============================
   CORS CONFIGURATION
============================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://zoho-learning-lms.web.app",
  process.env.FRONTEND_URL
].filter(Boolean);

// Helper function to check if origin is allowed
const isOriginAllowed = (origin) => {
  // Allow origins from the allowedOrigins array
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Allow all Render frontend URLs (pattern: https://*.onrender.com)
  if (origin && origin.match(/^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/)) {
    return true;
  }
  
  // Allow localhost in development
  if (origin && origin.startsWith('http://localhost')) {
    return true;
  }
  
  return false;
};

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* =============================
   MIDDLEWARE
============================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =============================
   DEVELOPMENT SEEDING
============================= */

if (process.env.NODE_ENV !== "production") {
  const seedUsers = async () => {
    try {
      const User = require('./models/User.model');

      const testUsers = [
        {
          name: "Admin User",
          email: "admin@zoho.com",
          password: "admin123",
          role: "Super Admin",
        },
        {
          name: "Trainer User",
          email: "trainer@zoho.com",
          password: "trainer123",
          role: "Trainer",
        },
        {
          name: "Learner User",
          email: "learner@zoho.com",
          password: "learner123",
          role: "Learner",
        },
      ];

      for (const userData of testUsers) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          await User.create(userData);
          console.log(`✅ Seeded: ${userData.email}`);
        }
      }

      console.log("✅ Dev seeding complete");
    } catch (error) {
      console.log("⚠️ Seeding skipped:", error.message);
    }
  };

  setTimeout(seedUsers, 1000);
}

/* =============================
   ROUTES
============================= */

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/assessments', require('./routes/assessment.routes'));
app.use('/api/knowledge', require('./routes/knowledge.routes'));
app.use('/api/certificates', require('./routes/certificate.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/enrollments', require('./routes/enrollment.routes'));

/* =============================
   HEALTH CHECK
============================= */

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: "Zoho LMS Backend is running",
  });
});

/* =============================
   ERROR HANDLER
============================= */

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =============================
   SERVER START
============================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Zoho Learning Management System Backend`);
});