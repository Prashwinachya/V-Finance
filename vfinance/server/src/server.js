require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const auth = require('./middleware/auth');
const adminOnly = require('./middleware/admin');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const tripRoutes = require('./routes/tripRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const securityRoutes = require('./routes/securityRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const loanRoutes = require('./routes/loanRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const User = require('./models/User');

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const configured = process.env.CLIENT_URL;
      if (configured && origin === configured) return callback(null, true);

      if (
        process.env.NODE_ENV !== 'production'
        && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'VFinance API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/transactions', auth, transactionRoutes);
app.use('/api/wallets', auth, walletRoutes);
app.use('/api/trips', auth, tripRoutes);
app.use('/api/admin', auth, adminOnly, adminRoutes);
app.use('/api/user', auth, userRoutes);
app.use('/api/security', auth, securityRoutes);
app.use('/api/subscriptions', auth, subscriptionRoutes);
app.use('/api/loans', auth, loanRoutes);
app.use('/api/payments', auth, paymentRoutes);

const start = async () => {
  try {
    await connectDB();

    const superAdminEmail = String(process.env.SUPER_ADMIN_EMAIL || 'vaishnavi@icloud.com').toLowerCase();
    const superAdminPassword = String(process.env.SUPER_ADMIN_PASSWORD || 'vaishnavi');

    // Ensure only one Super Admin (by configured email)
    await User.updateMany(
      { role: 'super_admin', email: { $ne: superAdminEmail } },
      { $set: { role: 'admin' } }
    );

    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: process.env.SUPER_ADMIN_NAME || 'Vaishnavi',
        email: superAdminEmail,
        password: superAdminPassword,
        role: 'super_admin',
      });
      console.log('Super Admin user created');
    } else {
      if (superAdmin.role !== 'super_admin') {
        superAdmin.role = 'super_admin';
        await superAdmin.save();
      }

      // In non-production, keep Super Admin credentials deterministic for demos.
      if (process.env.NODE_ENV !== 'production') {
        superAdmin.password = superAdminPassword;
        await superAdmin.save();
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const allowBootstrapAdmin = String(process.env.ALLOW_BOOTSTRAP_ADMIN || '').toLowerCase() === 'true';

    if (allowBootstrapAdmin && adminEmail && adminPassword) {
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (!existingAdmin) {
        await User.create({
          name: process.env.ADMIN_NAME || 'VFinance Admin',
          email: String(adminEmail).toLowerCase(),
          password: adminPassword,
          role: 'admin',
        });
        console.log('Default admin user created');
      }
    }

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

start();
