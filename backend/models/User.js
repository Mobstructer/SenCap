const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 32],
      is: /^[a-zA-Z0-9_]+$/,
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_matches: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  elo: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
  wallet_address: {
    type: DataTypes.STRING(42),
    allowNull: true,
    unique: true,
  },
  test_eth_balance: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 2.0,
  },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
  },
});

User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

User.prototype.toPublic = function () {
  const { password_hash, ...pub } = this.toJSON();
  return pub;
};

module.exports = User;
