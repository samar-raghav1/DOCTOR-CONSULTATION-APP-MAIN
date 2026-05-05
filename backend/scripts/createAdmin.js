const mongoose = require('mongoose')
const bcrypt = require('bcryptjs');
const path = require('path');

const Admin = require('../modal/Admin');


require('dotenv').config({
    path:path.resolve(__dirname, '../.env')
});

async function createAdmin() {
    try{
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');

        const existingAdmin = await Admin.findOne({ email: 'admin1@gmail.com' });
        if(existingAdmin){
            console.log('Admin already exists');
            return process.exit(1);
          
        }
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const admin = new Admin({
            name: 'System Administrator',
            email: 'admin1@gmail.com',
            password: hashedPassword,
            role: 'super_admin',
            isActive: true,
            permissions: {
                userManagement: true,
                doctorManagement: true,
                paymentManagement: true,
                analytics: true,
            }

        });
        await admin.save();
        console.log('Admin user created successfully');
        console.log(admin.email, 'Password: admin123');
      
    } catch (error) {
        console.error('Error creating admin:', error);
      
    }finally{
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdmin();