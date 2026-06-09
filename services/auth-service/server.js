const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const sequelize = require('./config/database');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
      description: 'Authentication Service for Travel Wisata System',
    },
    servers: [
      { url: 'http://localhost:3000/auth', description: 'Through API Gateway' },
      { url: `http://localhost:${PORT}`, description: 'Direct Service' }
    ],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ token });
  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); }
});

app.get('/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (userId) {
      const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.status(200).json(user);
    }
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Forbidden' });
      const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json(user);
    });
  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); }
});

sequelize.sync()
  .then(() => {
    console.log('Database connected & tables synced...');
    app.listen(PORT, () => console.log(`Auth Service is running on port ${PORT}`));
  })
  .catch(err => { console.error('Database connection failed:', err); process.exit(1); });