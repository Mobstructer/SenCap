# Malachi Gray

COSC – 480
Dr. Tankeh

# ♠ Crypto Spades — Full Stack

4-player multiplayer Spades with JWT auth, real-time Socket.IO gameplay, MySQL persistence, and simulated test-ETH betting.

## Prerequisites

This document assumes that the machine already has Node.js, Git, and Docker installed. If not, please obtain the software here:

- Node.js: https://nodejs.org/en/download/current
- Git: https://github.com/git-guides/install-git
- Docker: https://docs.docker.com/get-docker/

## Step 1: Setting up the Database and Application with Docker

1. Clone the repository:
   ```
   git clone https://github.com/Mobstructer/SenCap.git
   cd SenCap/spades
   ```

2. Run the application using Docker Compose:
   ```
   docker compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Database: localhost:3307 (MySQL)

The application will automatically set up the database, backend, and frontend services.

## Step 2: Manual Setup (Alternative)

### Database Setup (MySQL)

If not using Docker, set up MySQL manually:

1. Install MySQL 8 from https://dev.mysql.com/downloads/installer/
2. Create a database named `spades_db`
3. Create a user with appropriate privileges

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables by copying `.env.example` to `.env` and filling in database credentials.

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables by copying `.env.local.example` to `.env.local`.

4. Start the frontend:
   ```
   npm run dev
   ```

### Smart Contract Setup (Optional)

1. Navigate to the contracts directory:
   ```
   cd contracts
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Compile contracts:
   ```
   npx hardhat compile
   ```

4. Deploy to Sepolia testnet:
   ```
   npx hardhat run scripts/deploy.js --network sepolia
   ```

5. Update the frontend `.env.local` with the deployed contract address.

## Project Overview

Crypto Spades is a full-stack multiplayer Spades card game with real-time gameplay, user authentication, and simulated cryptocurrency betting using Solidity smart contracts on the Ethereum testnet.

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Socket.IO client
- **Backend**: Node.js, Express, Socket.IO, JWT authentication
- **Database**: MySQL with Sequelize ORM
- **Blockchain**: Solidity, Hardhat, MetaMask integration
- **Real-time Communication**: Socket.IO
- **Deployment**: Docker Compose

### Features

- 4-player Spades gameplay with real-time updates
- User registration and authentication
- Game room management
- Score tracking and statistics
- Simulated ETH betting with escrow smart contract
- Responsive web interface

## Screenshots

[Include screenshots of the application here]

- Welcome/Login page
- Game table
- Bidding interface
- Scoreboard
- Wallet connection

## Conclusion

This project demonstrates a complete full-stack application integrating traditional card game mechanics with modern web technologies and blockchain concepts.</content>
<parameter name="filePath">c:\Users\malac\Downloads\SenCap-Main\spades\Crypto_Spades_Project_Document.md
