const router = require('express').Router();
const { leaderboard, myStats } = require('../controllers/statsController');
const { authenticate } = require('../middleware/auth');

router.get('/leaderboard', leaderboard);
router.get('/me', authenticate, myStats);

module.exports = router;
