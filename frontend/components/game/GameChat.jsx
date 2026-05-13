'use client';
import { useState, useRef, useEffect } from 'react';

export function GameChat({ messages = [], onSend, username }) {
  const [msg, setMsg] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const trimmed = msg.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMsg('');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'rgba(10,20,12,0.85)',
      border: '1px solid rgba(201,168,76,0.15)',
      borderRadius: 12,
      height: 220,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(201,168,76,0.1)', fontSize: 11, color: 'var(--muted)', fontFamily: 'Cinzel, serif', letterSpacing: '0.08em' }}>
        CHAT
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ fontSize: 12, lineHeight: 1.4 }}>
            <span style={{ color: m.username === username ? 'var(--gold)' : 'var(--muted)', fontWeight: 600 }}>
              {m.username}:{' '}
            </span>
            <span style={{ color: 'var(--cream)' }}>{m.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
        <input
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Say something..."
          maxLength={200}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: 'var(--cream)', fontSize: 12, padding: '8px 10px',
            outline: 'none',
          }}
        />
        <button onClick={send} style={{
          padding: '6px 12px', border: 'none',
          background: 'transparent', color: 'var(--gold)',
          cursor: 'pointer', fontSize: 16,
        }}>→</button>
      </div>
    </div>
  );
}
