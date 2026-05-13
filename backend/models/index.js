const sequelize = require('../config/database');
const User = require('./User');
const Match = require('./Match');
const MatchPlayer = require('./MatchPlayer');

// Associations
User.hasMany(MatchPlayer, { foreignKey: 'user_id' });
MatchPlayer.belongsTo(User, { foreignKey: 'user_id' });

Match.hasMany(MatchPlayer, { foreignKey: 'match_id' });
MatchPlayer.belongsTo(Match, { foreignKey: 'match_id' });

module.exports = { sequelize, User, Match, MatchPlayer };
