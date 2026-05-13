'use client';
import { useWallet } from '../../hooks/useWallet';

export function WalletButton({ compact = false }) {
  const { address, connecting, error, connect } = useWallet();

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;

  if (address) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(10,31,14,0.8)',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 20,
        padding: compact ? '4px 12px' : '6px 14px',
        fontSize: compact ? 12 : 13,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6ec97a', display: 'inline-block' }} />
        <span style={{ color: 'var(--cream)', fontFamily: 'monospace' }}>{short}</span>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>Sepolia</span>
      </div>
    );
  }

  return (
    <button onClick={connect} disabled={connecting} style={{
      padding: compact ? '5px 14px' : '8px 18px',
      borderRadius: 20,
      border: '1px solid rgba(201,168,76,0.35)',
      background: 'rgba(10,31,14,0.8)',
      color: connecting ? 'var(--muted)' : 'var(--gold)',
      cursor: connecting ? 'not-allowed' : 'pointer',
      fontSize: compact ? 12 : 13,
      fontFamily: 'Cinzel, serif',
      display: 'flex', alignItems: 'center', gap: 6,
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}>
      {connecting ? (
        <>
          <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--muted)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Connecting…
        </>
      ) : (
        <>🦊 Connect Wallet</>
      )}
    </button>
  );
}
