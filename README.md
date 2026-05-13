# ♠ Crypto Spades — Full Stack

4-player multiplayer Spades with JWT auth, real-time Socket.IO gameplay, MySQL persistence, and simulated test-ETH betting.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) |
| Backend | Node.js + Express |
| Realtime | Socket.IO |
| ORM | Sequelize |
| Database | MySQL 8 |
| Auth | JWT + bcrypt |
| Blockchain | MetaMask + Solidity + Hardhat (Sepolia testnet) |

---

## Project Structure

```
spades/
├── backend/              # Express + Socket.IO server
│   ├── config/           # DB + JWT config
│   ├── controllers/      # Auth, game, stats controllers
│   ├── middleware/        # JWT auth middleware
│   ├── models/           # Sequelize models
│   ├── routes/           # Express routes
│   ├── socket/           # Socket.IO event handlers
│   └── utils/            # Game logic (pure functions)
├── frontend/             # Next.js app
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks (socket, wallet, auth)
│   ├── lib/              # API client, socket client
│   └── pages/            # Next.js pages
├── contracts/            # Solidity smart contracts
└── scripts/              # Hardhat deploy scripts
```

---

## Quick Start

### 1. Database Setup (MySQL)

```sql
CREATE DATABASE spades_db;
CREATE USER 'spades'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON spades_db.* TO 'spades'@'localhost';
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # fill in DB creds + JWT secret
npm install
npm run dev                   # runs on :4000
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                   # runs on :3000
```

### 4. Smart Contract (optional)

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
# copy deployed address into frontend/.env.local
```

---

## Environment Variables

### backend/.env
```
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=spades_db
DB_USER=spades
DB_PASS=yourpassword
JWT_SECRET=supersecretkey_change_this
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...   # after deploying
```

---

## Game Rules (Spades)

- 4 players, 2 teams: You + Partner (Team A) vs West + East (Team B)
- Each player bids how many tricks they'll take; team bids combine
- **Nil bid**: bet you take 0 tricks → +100 if successful, −100 if not
- Making your bid: `bid × 10` points; overtricks (bags) count +1 each
- **Bag penalty**: every 10 bags accumulated = −100 points
- Missing your bid: `bid × 10` negative points
- Spades can't be led until broken (unless only spades remain)
- First to **500 points** wins; −200 = loss

---

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_room` | C→S | Join/create a game room |
| `room_joined` | S→C | Room state sent back |
| `player_joined` | S→C | Broadcast new player |
| `game_start` | S→C | Cards dealt, bidding begins |
| `place_bid` | C→S | Player submits bid |
| `bid_placed` | S→C | Broadcast bid |
| `play_card` | C→S | Player plays a card |
| `card_played` | S→C | Broadcast card play |
| `trick_complete` | S→C | Trick resolved, winner announced |
| `round_complete` | S→C | Scores updated |
| `game_over` | S→C | Final scores + ETH payout |
| `chat_message` | C↔S | In-game chat |

---

## Smart Contract

`SpadesEscrow.sol` handles:
1. `deposit()` — each player locks in tETH
2. `declareWinner(address[2])` — backend calls after game ends
3. `withdraw()` — winners claim their payout

The contract is deployed on **Sepolia testnet** — no real ETH involved.
