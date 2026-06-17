const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: String,
  status: String
});

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zoho-lms');
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', userSchema);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Update user password
    const result = await User.findOneAndUpdate(
      { email: 'k.vinothkumar2317@gmail.com' },
      { password: hashedPassword },
      { new: true }
    );

    if (result) {
      console.log('✅ Password reset successfully!');
      console.log('Email:', result.email);
      console.log('Role:', result.role);
    } else {
      console.log('❌ User not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();

