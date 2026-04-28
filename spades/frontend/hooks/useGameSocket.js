'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '../lib/socket';

export function useGameSocket() {
  const [room, setRoom] = useState(null);
  const [myHand, setMyHand] = useState([]);
  const [mySeat, setMySeat] = useState(null);
  const [gameEvent, setGameEvent] = useState(null); // latest broadcast event
  const [chat, setChat] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('spades_token');
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room_state', (data) => {
      setRoom(data);
      setMyHand(data.myHand || []);
      setMySeat(data.mySeat);
    });

    const events = [
      'room_joined', 'player_joined', 'game_start',
      'bid_placed', 'bidding_complete',
      'card_played', 'trick_complete', 'round_complete',
      'round_start', 'game_over', 'player_disconnected', 'error',
    ];

    events.forEach(ev => {
      socket.on(ev, (data) => setGameEvent({ type: ev, data, ts: Date.now() }));
    });

    socket.on('room_joined', (data) => {
      setRoom(data);
      setMyHand(data.myHand || []);
      setMySeat(data.mySeat);
    });

    socket.on('chat_message', (msg) => {
      setChat(prev => [...prev.slice(-99), msg]);
    });

    return () => {
      events.forEach(ev => socket.off(ev));
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_state');
      socket.off('chat_message');
    };
  }, []);

  const joinRoom = useCallback(({ betAmount, roomId } = {}) => {
    socketRef.current?.emit('join_room', { betAmount, roomId });
  }, []);

  const placeBid = useCallback((bid) => {
    socketRef.current?.emit('place_bid', { bid });
  }, []);

  const playCard = useCallback((card) => {
    socketRef.current?.emit('play_card', { card });
  }, []);

  const sendChat = useCallback((message) => {
    socketRef.current?.emit('chat_message', { message });
  }, []);

  return {
    room, myHand, mySeat, gameEvent, chat, connected,
    joinRoom, placeBid, playCard, sendChat,
  };
}
