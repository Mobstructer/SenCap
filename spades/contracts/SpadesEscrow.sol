// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SpadesEscrow
 * @notice Holds test-ETH bets for a 4-player Spades game on Sepolia.
 *
 * Flow:
 *   1. Backend creates a new game → deployGame(roomId, players[4])
 *   2. Each of the 4 players calls deposit{value: betAmount}(roomId)
 *   3. When game ends, backend (owner) calls declareWinner(roomId, winnerTeam)
 *   4. Winners call withdraw(roomId) to claim their share
 *
 * Security notes:
 *   - Only the contract owner (backend deployer) can declare winners.
 *   - Funds are locked until all 4 players have deposited.
 *   - A 48-hour timeout allows refunds if a game never starts.
 */
contract SpadesEscrow {
    address public immutable owner;

    enum GameState { Open, Funded, Finished, Refunded }

    struct Game {
        address[4] players;    // seats 0-3
        uint256 betAmount;     // per player (wei)
        uint8 deposited;       // count of deposits
        GameState state;
        uint8 winnerTeam;      // 0 = Team A (seats 0,2) | 1 = Team B (seats 1,3)
        uint256 createdAt;
        bool[4] claimed;
    }

    mapping(bytes32 => Game) public games;

    event GameCreated(bytes32 indexed roomId, address[4] players, uint256 betAmount);
    event Deposited(bytes32 indexed roomId, address player, uint8 seat);
    event GameFunded(bytes32 indexed roomId);
    event WinnerDeclared(bytes32 indexed roomId, uint8 winnerTeam);
    event Claimed(bytes32 indexed roomId, address player, uint256 amount);
    event Refunded(bytes32 indexed roomId, address player, uint256 amount);

    error NotOwner();
    error GameNotFound();
    error InvalidSeat();
    error AlreadyDeposited();
    error WrongAmount();
    error GameNotFunded();
    error AlreadyFinished();
    error AlreadyClaimed();
    error NotAWinner();
    error TooEarlyForRefund();
    error NotAPlayer();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier gameExists(bytes32 roomId) {
        if (games[roomId].betAmount == 0) revert GameNotFound();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ── Owner: create a game slot ─────────────────────────────────────────────

    function createGame(
        bytes32 roomId,
        address[4] calldata players,
        uint256 betAmount
    ) external onlyOwner {
        require(games[roomId].betAmount == 0, "Game exists");
        require(betAmount > 0, "Bet must be > 0");

        games[roomId] = Game({
            players: players,
            betAmount: betAmount,
            deposited: 0,
            state: GameState.Open,
            winnerTeam: 0,
            createdAt: block.timestamp,
            claimed: [false, false, false, false]
        });

        emit GameCreated(roomId, players, betAmount);
    }

    // ── Player: deposit bet ───────────────────────────────────────────────────

    function deposit(bytes32 roomId) external payable gameExists(roomId) {
        Game storage g = games[roomId];
        if (g.state != GameState.Open) revert AlreadyFinished();
        if (msg.value != g.betAmount) revert WrongAmount();

        // Find the sender's seat
        uint8 seat = 4;
        for (uint8 i = 0; i < 4; i++) {
            if (g.players[i] == msg.sender) { seat = i; break; }
        }
        if (seat == 4) revert NotAPlayer();
        if (g.claimed[seat]) revert AlreadyDeposited();

        g.claimed[seat] = true; // reuse as "has deposited" flag until game over
        g.deposited++;

        emit Deposited(roomId, msg.sender, seat);

        if (g.deposited == 4) {
            g.state = GameState.Funded;
            emit GameFunded(roomId);
        }
    }

    // ── Owner: declare winner after game ends ─────────────────────────────────

    function declareWinner(bytes32 roomId, uint8 winnerTeam)
        external
        onlyOwner
        gameExists(roomId)
    {
        Game storage g = games[roomId];
        if (g.state != GameState.Funded) revert GameNotFunded();
        if (winnerTeam > 1) revert InvalidSeat();

        g.winnerTeam = winnerTeam;
        g.state = GameState.Finished;
        // Reset claimed flags so winners can now withdraw
        g.claimed = [false, false, false, false];

        emit WinnerDeclared(roomId, winnerTeam);
    }

    // ── Winner: claim payout ──────────────────────────────────────────────────

    function claim(bytes32 roomId) external gameExists(roomId) {
        Game storage g = games[roomId];
        if (g.state != GameState.Finished) revert GameNotFunded();

        // Find seat
        uint8 seat = 4;
        for (uint8 i = 0; i < 4; i++) {
            if (g.players[i] == msg.sender) { seat = i; break; }
        }
        if (seat == 4) revert NotAPlayer();

        // Check team membership: team 0 = seats 0,2; team 1 = seats 1,3
        bool isWinner = (g.winnerTeam == 0 && (seat == 0 || seat == 2))
                     || (g.winnerTeam == 1 && (seat == 1 || seat == 3));
        if (!isWinner) revert NotAWinner();
        if (g.claimed[seat]) revert AlreadyClaimed();

        g.claimed[seat] = true;
        // Each winner gets back their bet × 2
        uint256 payout = g.betAmount * 2;

        (bool ok, ) = payable(msg.sender).call{value: payout}("");
        require(ok, "Transfer failed");

        emit Claimed(roomId, msg.sender, payout);
    }

    // ── Refund: if game stalls after 48 hours ─────────────────────────────────

    function refund(bytes32 roomId) external gameExists(roomId) {
        Game storage g = games[roomId];
        if (g.state == GameState.Finished || g.state == GameState.Refunded)
            revert AlreadyFinished();
        if (block.timestamp < g.createdAt + 48 hours)
            revert TooEarlyForRefund();

        uint8 seat = 4;
        for (uint8 i = 0; i < 4; i++) {
            if (g.players[i] == msg.sender) { seat = i; break; }
        }
        if (seat == 4) revert NotAPlayer();
        if (!g.claimed[seat]) revert AlreadyClaimed(); // not deposited → nothing to refund

        g.claimed[seat] = false;
        g.state = GameState.Refunded;

        (bool ok, ) = payable(msg.sender).call{value: g.betAmount}("");
        require(ok, "Transfer failed");

        emit Refunded(roomId, msg.sender, g.betAmount);
    }

    // ── View helpers ──────────────────────────────────────────────────────────

    function getGame(bytes32 roomId) external view returns (
        address[4] memory players,
        uint256 betAmount,
        uint8 deposited,
        GameState state,
        uint8 winnerTeam
    ) {
        Game storage g = games[roomId];
        return (g.players, g.betAmount, g.deposited, g.state, g.winnerTeam);
    }

    receive() external payable {}
}
