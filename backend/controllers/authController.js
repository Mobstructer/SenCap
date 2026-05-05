const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User } = require('../models');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(409).json({ error: 'Username taken' });

    const user = await User.create({
      username,
      email,
      password_hash: password, // hook will bcrypt this
    });

    const token = signToken(user.id);
    res.status(201).json({ token, user: user.toPublic() });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.validatePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user.id);
    res.json({ token, user: user.toPublic() });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toPublic() });
};

exports.updateWallet = async (req, res) => {
  const { walletAddress } = req.body;
  try {
    await req.user.update({ wallet_address: walletAddress });
    res.json({ user: req.user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wallet' });
  }
};
