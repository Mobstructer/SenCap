const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  room_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('waiting', 'bidding', 'playing', 'finished'),
    defaultValue: 'waiting',
  },
  bet_amount: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0.1,
  },
  winning_team: {
    type: DataTypes.TINYINT,
    allowNull: true, // 0 = Team A, 1 = Team B
  },
  team_a_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  team_b_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  rounds_played: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  tx_hash: {
    type: DataTypes.STRING(66),
    allowNull: true,
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  finished_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'matches',
});

module.exports = Match;
