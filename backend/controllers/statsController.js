const { User, Match, MatchPlayer } = require('../models');
const { Op } = require('sequelize');

exports.leaderboard = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'wins', 'losses', 'total_matches', 'elo'],
      order: [['elo', 'DESC']],
      limit: 50,
    });
    res.json({ leaderboard: users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

exports.myStats = async (req, res) => {
  try {
    const matchPlayers = await MatchPlayer.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Match, where: { status: 'finished' } }],
      order: [[Match, 'finished_at', 'DESC']],
      limit: 20,
    });

    res.json({
      stats: {
        wins: req.user.wins,
        losses: req.user.losses,
        total_matches: req.user.total_matches,
        elo: req.user.elo,
        win_rate: req.user.total_matches > 0
          ? ((req.user.wins / req.user.total_matches) * 100).toFixed(1)
          : 0,
        test_eth_balance: req.user.test_eth_balance,
      },
      recentMatches: matchPlayers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
