const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email: admin@snapshare.com');
      console.log('Password: admin123');
    } else {
      // Create admin user
      const adminPassword = await bcrypt.hash('admin123', 12);
      
      const admin = new User({
        username: 'admin',
        email: 'admin@snapshare.com',
        password: adminPassword,
        role: 'admin',
        bio: 'System Administrator',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff&size=200'
      });

      // Skip the pre-save hook since we already hashed
      admin.isNew = false;
      await User.collection.insertOne(admin);

      console.log('Admin user created successfully!');
      console.log('Email: admin@snapshare.com');
      console.log('Password: admin123');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
