const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Learner' },
  status: { type: String, default: 'Active' },
  department: String,
  avatar: String,
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Test users data - matching credentials shown in Login component
const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@zoho.com',
    password: 'admin123',
    role: 'Super Admin',
    department: 'Administration'
  },
  {
    name: 'Trainer User',
    email: 'trainer@zoho.com',
    password: 'trainer123',
    role: 'Trainer',
    department: 'Training'
  },
  {
    name: 'Learner User',
    email: 'learner@zoho.com',
    password: 'learner123',
    role: 'Learner',
    department: 'Development'
  }
];

const createTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
    console.log('MongoDB Connected\n');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const userData of testUsers) {
      // Check if user exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⏭️  Skipped: ${userData.email} (already exists)`);
        skippedCount++;
        continue;
      }
      
      // Create test user
      const user = await User.create(userData);
      console.log(`✅ Created: ${userData.email} / ${userData.password} (Role: ${userData.role})`);
      createdCount++;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Users created: ${createdCount}`);
    console.log(`   - Users skipped (already exist): ${skippedCount}`);
    console.log(`\n🎯 Login credentials to use:`);
    console.log(`   - Admin: admin@zoho.com / admin123`);
    console.log(`   - Trainer: trainer@zoho.com / trainer123`);
    console.log(`   - Learner: learner@zoho.com / learner123`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createTestUsers();

