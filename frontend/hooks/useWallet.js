'use client';
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { api } from '../lib/api';

const SEPOLIA_CHAIN_ID     = '0xaa36a7';
const SEPOLIA_CHAIN_ID_INT = 11155111;

// Only the one function the frontend calls on the contract
const ESCROW_ABI = [
  'function deposit(bytes32 roomId) payable',
];

export function useWallet() {
  const [address,    setAddress]    = useState(null);
  const [balance,    setBalance]    = useState(null);  // e.g. "0.4200"
  const [chainId,    setChainId]    = useState(null);
  const [signer,     setSigner]     = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [txPending,  setTxPending]  = useState(false);
  const [txHash,     setTxHash]     = useState(null);
  const [error,      setError]      = useState(null);

  const onSepolia = chainId === SEPOLIA_CHAIN_ID ||
                    Number(chainId) === SEPOLIA_CHAIN_ID_INT;

  // ── Internal helpers ────────────────────────────────────────────────────────

  async function _buildSigner(addr) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const s = await provider.getSigner(addr);
    setSigner(s);
    return s;
  }

  async function _refreshBalance(addr) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const raw = await provider.getBalance(addr);
      setBalance(parseFloat(ethers.formatEther(raw)).toFixed(4));
    } catch (_) {}
  }

  // ── Restore wallet on page load ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    (async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts[0]) {
        setAddress(accounts[0]);
        await _buildSigner(accounts[0]);
        await _refreshBalance(accounts[0]);
      }
      const id = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(id);
    })();

    const onAccountsChanged = async (accounts) => {
      const addr = accounts[0] || null;
      setAddress(addr);
      if (addr) { await _buildSigner(addr); await _refreshBalance(addr); }
      else       { setSigner(null); setBalance(null); }
    };
    const onChainChanged = (id) => setChainId(id);

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged',    onChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged',    onChainChanged);
    };
  }, []);

  // ── connect() — called by the Connect Wallet button ─────────────────────────

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask is not installed.');
      return null;
    }
    setConnecting(true);
    setError(null);

    try {
      // 1. Ask MetaMask for accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = accounts[0];
      setAddress(addr);

      // 2. Switch to Sepolia (add it if MetaMask doesn't have it yet)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId:           SEPOLIA_CHAIN_ID,
              chainName:         'Sepolia Test Network',
              nativeCurrency:    { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls:           ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          });
        }
      }

      const id = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(id);

      const s = await _buildSigner(addr);
      await _refreshBalance(addr);

      // 3. Save address to backend so it can be stored in the room
      try { await api.updateWallet(addr); } catch (_) {}

      return { address: addr, signer: s };
    } catch (err) {
      setError(
        err.code === 4001
          ? 'Connection rejected.'
          : (err.message || 'Failed to connect wallet')
      );
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  // ── depositToEscrow() ────────────────────────────────────────────────────────
  //
  // THIS is the function that actually moves real Sepolia ETH.
  // It opens a MetaMask popup asking the player to confirm sending betAmount ETH
  // to the SpadesEscrow contract. Nothing moves until they click Confirm.
  //
  // Call this from your UI right after the player clicks "Join Game".
  //
  // @param contractAddress  string  — deployed SpadesEscrow address
  // @param roomId           string  — UUID from the backend (e.g. "a1b2c3d4-...")
  // @param betAmountEth     number  — e.g. 0.1
  //
  // @returns receipt  — ethers TransactionReceipt once the tx is mined (1 confirmation)
  // @throws           — if user rejects, or tx fails

  const depositToEscrow = useCallback(async (contractAddress, roomId, betAmountEth) => {
    if (!signer)    throw new Error('Connect your MetaMask wallet first.');
    if (!onSepolia) throw new Error('Switch MetaMask to the Sepolia network first.');

    setTxPending(true);
    setTxHash(null);
    setError(null);

    try {
      // Build a contract instance connected to the player's signer
      const escrow = new ethers.Contract(contractAddress, ESCROW_ABI, signer);

      // Encode the UUID roomId into bytes32 (must match backend encoding)
      const roomIdBytes = ethers.encodeBytes32String(
        roomId.replace(/-/g, '').slice(0, 31)
      );

      // Convert ETH amount to wei
      const valueWei = ethers.parseEther(String(betAmountEth));

      // ✅ THIS LINE opens the MetaMask popup.
      // The player sees: "You are sending 0.1 ETH to contract 0x..."
      // Nothing is sent until they click Confirm.
      const tx = await escrow.deposit(roomIdBytes, { value: valueWei });
      setTxHash(tx.hash);

      // Wait for the transaction to be mined (1 block confirmation)
      const receipt = await tx.wait();

      // Refresh the displayed balance so the UI reflects the deduction
      await _refreshBalance(address);

      return receipt;
    } catch (err) {
      const msg = err.code === 4001
        ? 'Transaction rejected in MetaMask.'
        : (err.reason || err.message || 'Deposit failed.');
      setError(msg);
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [signer, onSepolia, address]);

  // ── refreshBalance ───────────────────────────────────────────────────────────

  const refreshBalance = useCallback(() => {
    if (address) _refreshBalance(address);
  }, [address]);

  return {
    address,          // connected wallet address or null
    balance,          // live Sepolia ETH balance string or null
    chainId,
    onSepolia,        // true when on the right network
    signer,
    connecting,
    txPending,        // true while deposit tx is in-flight
    txHash,           // hash of the last tx (for Etherscan link)
    error,
    connect,
    depositToEscrow,  // ← the real ETH transfer function
    refreshBalance,
  };
}
