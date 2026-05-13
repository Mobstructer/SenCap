const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, me, updateWallet } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 32 }).isAlphanumeric('en-US', { ignore: '_' }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  login
);

router.get('/me', authenticate, me);
router.put('/wallet', authenticate, updateWallet);

module.exports = router;
