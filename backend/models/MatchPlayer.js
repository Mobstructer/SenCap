const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MatchPlayer = sequelize.define('MatchPlayer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  match_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  seat: {
    type: DataTypes.TINYINT,
    allowNull: false, // 0=South(You), 1=West, 2=North(Partner), 3=East
  },
  team: {
    type: DataTypes.TINYINT,
    allowNull: false, // 0=Team A (seats 0,2), 1=Team B (seats 1,3)
  },
  tricks_won: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  final_bid: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  result: {
    type: DataTypes.ENUM('win', 'loss', 'pending'),
    defaultValue: 'pending',
  },
  eth_delta: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
  },
}, {
  tableName: 'match_players',
});

module.exports = MatchPlayer;
