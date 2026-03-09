require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const TripBudget = require('./models/TripBudget');

const categories = [
  'Salary',
  'Freelance',
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Travel',
];

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const createSeedTransactions = (userId, wallets) => {
  const today = new Date();
  const result = [];

  for (let i = 0; i < 22; i += 1) {
    const isIncome = i % 4 === 0;
    const amount = isIncome
      ? Math.floor(18000 + Math.random() * 35000)
      : Math.floor(300 + Math.random() * 7000);

    const date = new Date(today);
    date.setDate(today.getDate() - i * 2);

    result.push({
      user: userId,
      wallet: randomFrom(wallets)._id,
      title: isIncome ? randomFrom(['Salary Credit', 'Freelance Payment', 'Bonus']) : randomFrom(['Cafe Spend', 'Cab Ride', 'Groceries', 'Movie Night', 'Utilities']),
      category: isIncome ? randomFrom(['Salary', 'Freelance']) : randomFrom(categories.filter((item) => !['Salary', 'Freelance'].includes(item))),
      type: isIncome ? 'income' : 'expense',
      amount,
      date,
    });
  }

  return result;
};

const recomputeWalletBalances = async (userId, wallets) => {
  for (const wallet of wallets) {
    const transactions = await Transaction.find({ user: userId, wallet: wallet._id });
    const balance = transactions.reduce(
      (sum, transaction) => sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount),
      0
    );

    wallet.balance = Math.max(balance, 0);
    await wallet.save();
  }
};

const run = async () => {
  await connectDB();

  const email = 'vaishnavi@icloud.com';
  const password = 'vaishnavi';

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'Vaishnavi',
      email,
      password,
      role: 'super_admin',
    });
  } else {
    user.name = 'Vaishnavi';
    user.role = 'super_admin';
    user.password = password;
    await user.save();
  }

  const allowReset = String(process.env.FORCE_DEMO_RESET || '').toLowerCase() === 'true';

  if (allowReset) {
    await Promise.all([
      Wallet.deleteMany({ user: user._id }),
      Transaction.deleteMany({ user: user._id }),
      TripBudget.deleteMany({ user: user._id }),
    ]);
  }

  const wallets = await Wallet.insertMany([
    { user: user._id, name: 'Travel Wallet', walletType: 'travelling_wallet', balance: 0 },
    { user: user._id, name: 'Emergency Wallet', walletType: 'medical_emergency_wallet', balance: 0 },
    { user: user._id, name: 'Pocket Saver', walletType: 'pocket_saver_wallet', balance: 0 },
  ]);

  const transactions = createSeedTransactions(user._id, wallets);
  await Transaction.insertMany(transactions);
  await recomputeWalletBalances(user._id, wallets);

  await TripBudget.insertMany([
    {
      user: user._id,
      budgetName: 'Goa Summer Trip',
      destination: 'Goa',
      amount: 65000,
      period: 'custom',
      category: 'Travel',
      startDate: new Date(new Date().getFullYear(), 4, 10),
      endDate: new Date(new Date().getFullYear(), 4, 16),
      peopleCount: 2,
      breakdown: {
        accommodation: 22000,
        transportation: 14000,
        food: 10000,
        activities: 12000,
        miscellaneous: 7000,
      },
    },
  ]);

  console.log('Demo seed complete.');
  console.log('Login email:', email);
  console.log('Login password:', password);

  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
