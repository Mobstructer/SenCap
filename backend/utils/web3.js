/**
 * backend/utils/web3.js
 *
 * Backend-side Ethereum integration using ethers.js v6.
 *
 * Responsibilities:
 *   1. createGame()     — register the room on the escrow contract before play
 *   2. payoutWinners()  — called when a game ends; pushes ETH to winner wallets
 *
 * Required environment variables (add to backend/.env):
 *   SEPOLIA_RPC_URL      e.g. https://rpc.sepolia.org  OR  an Infura/Alchemy URL
 *   OWNER_PRIVATE_KEY    the private key of the wallet that deployed the contract
 *   CONTRACT_ADDRESS     deployed SpadesEscrow address on Sepolia
 *
 * Usage in gameSocket.js:
 *   const web3 = require('../utils/web3');
 *   await web3.createGame(roomId, [addr0, addr1, addr2, addr3], 0.1);
 *   await web3.payoutWinners(roomId, winnerTeam);   // 0 or 1
 */

require('dotenv').config();
const { ethers } = require('ethers');

const ABI = [
  'function createGame(bytes32 roomId, address[4] players, uint256 betAmount) external',
  'function payoutWinners(bytes32 roomId, uint8 winnerTeam) external',
  'function getGame(bytes32 roomId) view returns (address[4], uint256, uint8, uint8, bool[4])',
];

let provider = null;
let wallet   = null;
let contract = null;
let enabled  = false;

function init() {
  const rpc  = process.env.SEPOLIA_RPC_URL;
  const key  = process.env.OWNER_PRIVATE_KEY;
  const addr = process.env.CONTRACT_ADDRESS;

  if (!rpc || !key || !addr) {
    console.warn(
      '⚠  web3.js: SEPOLIA_RPC_URL / OWNER_PRIVATE_KEY / CONTRACT_ADDRESS not set.\n' +
      '   Blockchain payouts disabled — results will only be recorded in MySQL.'
    );
    return;
  }

  try {
    provider = new ethers.JsonRpcProvider(rpc);
    wallet   = new ethers.Wallet(key, provider);
    contract = new ethers.Contract(addr, ABI, wallet);
    enabled  = true;
    console.log('⛓  Blockchain payouts enabled. Contract:', addr);
  } catch (err) {
    console.error('web3.js init failed:', err.message);
  }
}

init();

// roomId encoding — must match useWallet.js on the frontend
function encodeRoomId(roomIdStr) {
  return ethers.encodeBytes32String(roomIdStr.replace(/-/g, '').slice(0, 31));
}

/**
 * Register a new room on-chain before the game starts.
 * @param {string}   roomId          - UUID from gameSocket
 * @param {string[]} walletAddresses - 4 addresses; ethers.ZeroAddress for bot seats
 * @param {number}   betAmountEth    - e.g. 0.1
 */
async function createGame(roomId, walletAddresses, betAmountEth) {
  if (!enabled) return null;

  const players = walletAddresses.map(addr =>
    addr && ethers.isAddress(addr) ? addr : ethers.ZeroAddress
  );
  while (players.length < 4) players.push(ethers.ZeroAddress);

  const betWei      = ethers.parseEther(String(betAmountEth));
  const roomIdBytes = encodeRoomId(roomId);

  try {
    const tx      = await contract.createGame(roomIdBytes, players, betWei);
    const receipt = await tx.wait();
    console.log(`⛓  createGame confirmed  txHash=${receipt.hash}  room=${roomId}`);
    return receipt;
  } catch (err) {
    // Log but don't crash — game continues in DB-only mode
    console.error('⛓  createGame failed:', err.reason || err.message);
    return null;
  }
}

/**
 * Push ETH to the two winning wallets after the game ends.
 * @param {string} roomId      - UUID
 * @param {number} winnerTeam  - 0 = South+North (seats 0,2)  1 = West+East (seats 1,3)
 */
async function payoutWinners(roomId, winnerTeam) {
  if (!enabled) return null;

  try {
    const tx      = await contract.payoutWinners(encodeRoomId(roomId), winnerTeam);
    const receipt = await tx.wait();
    console.log(`⛓  payoutWinners confirmed  txHash=${receipt.hash}  team=${winnerTeam}  room=${roomId}`);
    return receipt;
  } catch (err) {
    console.error('⛓  payoutWinners failed:', err.reason || err.message);
    return null;
  }
}

/**
 * Optional debug helper — fetch on-chain game state.
 */
async function getGameState(roomId) {
  if (!enabled) return null;
  try {
    const r = await contract.getGame(encodeRoomId(roomId));
    return {
      players:      r[0],
      betAmount:    ethers.formatEther(r[1]),
      deposited:    Number(r[2]),
      state:        Number(r[3]),  // 0=Open 1=Funded 2=Finished 3=Refunded
      hasDeposited: r[4],
    };
  } catch (err) {
    console.error('getGameState failed:', err.message);
    return null;
  }
}

module.exports = { createGame, payoutWinners, getGameState, encodeRoomId };
