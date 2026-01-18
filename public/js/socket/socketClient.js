/**
 * Socket Client Management
 * Handles all Socket.IO communication
 */
import { GameState } from "../game/gameState.js";
import { GameUI } from "../ui/gameUI.js";
import { ResultUI } from "../ui/resultUI.js";
import { JoinUI } from "../ui/joinUI.js";

export class SocketClient {
  constructor(gameState, gameUI, resultUI, joinUI) {
    // Auto-detect server URL (works for localhost and LAN IP)
    const serverURL = window.location.origin;
    console.log("Connecting to Socket.IO server:", serverURL);
    
    this.socket = io(serverURL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false,
      upgrade: true
    });
    
    this.gameState = gameState;
    this.gameUI = gameUI;
    this.resultUI = resultUI;
    this.joinUI = joinUI;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to server, socket ID:", this.socket.id);
      console.log("Server URL:", this.socket.io.uri);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from server, reason:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      console.error("Error type:", error.type);
      console.error("Error message:", error.message);
      console.error("Server URL:", window.location.origin);
      console.error("Socket transport:", this.socket.io?.engine?.transport?.name);
      
      // Don't show alert immediately, let it retry
      setTimeout(() => {
        if (!this.socket.connected) {
          alert("Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Server đã chạy chưa\n2. Firewall có chặn port 3000 không\n3. Cả 2 thiết bị cùng mạng WiFi");
        }
      }, 5000);
    });
    
    this.socket.io.on("reconnect_attempt", () => {
      console.log("Attempting to reconnect...");
    });
    
    this.socket.io.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
    });
    
    this.socket.io.on("reconnect_failed", () => {
      console.error("Reconnection failed");
    });

    this.socket.on("error", (message) => {
      console.error("Server error:", message);
      alert(`Error: ${message}`);
    });

    this.socket.on("playersConnected", (data) => {
      this.handlePlayersConnected(data);
    });

    this.socket.on("p1Choice", (data) => {
      this.handleOpponentChoice(data, "p1");
    });

    this.socket.on("p2Choice", (data) => {
      this.handleOpponentChoice(data, "p2");
    });

    this.socket.on("winner", (data) => {
      this.handleWinner(data);
    });

    this.socket.on("playAgain", () => {
      this.handlePlayAgain();
    });

    this.socket.on("opponentLeft", (data) => {
      this.handleOpponentLeft(data);
    });

    this.socket.on("notValidToken", () => {
      console.error("Invalid room token");
      alert("Mã phòng không hợp lệ! Vui lòng kiểm tra và thử lại.");
      this.joinUI.show();
    });

    this.socket.on("roomFull", () => {
      console.error("Room is full");
      alert("Phòng đã đầy! Tối đa 2 người chơi.");
      this.joinUI.show();
    });
  }

  handlePlayersConnected(data) {
    console.log("playersConnected event received", data);

    // Set roomID FIRST (important!)
    if (data.roomID) {
      this.gameState.setRoomID(data.roomID);
      console.log(`RoomID set: ${data.roomID}`);
      // Show Room ID in UI
      this.gameUI.showRoomID(data.roomID);
    }

    // Set player role
    if (data.isPlayer1 !== undefined) {
      this.gameState.setPlayerRole(data.isPlayer1);
      console.log(`Player role set: ${data.isPlayer1 ? "Player 1" : "Player 2"}`);
    } else {
      // Fallback: determine by socket ID
      if (data.player1Id === this.socket.id) {
        this.gameState.setPlayerRole(true);
      } else if (data.player2Id === this.socket.id) {
        this.gameState.setPlayerRole(false);
      }
    }

    // Reset state
    this.gameState.resetForNewRound();
    this.gameState.setWaitingForOpponent(false);
    this.gameState.resetScores();

    // Update UI
    this.gameUI.show();
    this.gameUI.resetScores();
    this.resultUI.hide();
    this.resultUI.reset();
  }

  handleOpponentChoice(data, playerType) {
    console.log(`${playerType}Choice event received:`, data);

    this.resultUI.displayOpponentChoice(data.rpsValue);

    // Update scores if provided
    if (data.p1Score !== undefined && data.p2Score !== undefined) {
      this.gameState.updateScores(data.p1Score, data.p2Score);
      this.gameUI.updateScores(data.p1Score, data.p2Score, this.gameState.player1);
    }
  }

  handleWinner(data) {
    console.log("Winner event received:", data);

    let winnerValue, p1Score, p2Score;
    if (typeof data === "string") {
      winnerValue = data;
      p1Score = this.gameState.player1Score;
      p2Score = this.gameState.player2Score;
    } else {
      winnerValue = data.winner;
      p1Score = data.p1Score || 0;
      p2Score = data.p2Score || 0;
    }

    this.gameState.winner = winnerValue;
    this.gameState.updateScores(p1Score, p2Score);

    // Display winner
    this.resultUI.displayWinner(winnerValue, this.gameState.player1);
    this.gameUI.updateScores(p1Score, p2Score, this.gameState.player1);
  }

  handlePlayAgain() {
    console.log("Received playAgain event from server");
    this.resultUI.removeWinnerClasses();
    this.returnToGame();
  }

  handleOpponentLeft(data) {
    console.log("Opponent left:", data);
    console.log("Current roomID:", this.gameState.roomID);

    // Only handle if we're actually in a room
    if (!this.gameState.roomID) {
      console.log("No roomID, ignoring opponentLeft event");
      return;
    }

    this.gameState.setWaitingForOpponent(true);
    this.gameState.resetForNewRound();
    this.gameState.resetScores();

    if (data && data.message) {
      alert(data.message);
    } else {
      alert("Đối thủ đã rời phòng. Bạn có thể chờ người chơi khác hoặc bấm Thoát để quay lại màn hình chính.");
    }

    // Reset UI to waiting state
    this.gameUI.showGameArea();
    this.resultUI.hide();
    this.resultUI.reset();
    this.resultUI.showWaitingForNewPlayer();
    this.gameUI.resetScores();
  }

  returnToGame() {
    console.log("Returning to game");

    // Reset game state
    this.gameState.resetForNewRound();
    
    // Initialize UI elements
    if (!this.resultUI.elements) this.resultUI.init();
    if (!this.gameUI.elements) this.gameUI.init();
    
    // Hide result board completely FIRST
    this.resultUI.hide();
    this.resultUI.reset();
    
    // Force hide result board with direct DOM manipulation
    // Use cached elements if available, otherwise query
    if (this.resultUI.elements) {
      const { resultBoard, results, yourChoice, oppoChoice } = this.resultUI.elements;
      
      if (resultBoard) {
        resultBoard.style.display = "none";
        resultBoard.classList.add("none");
        resultBoard.classList.remove("grid");
        resultBoard.classList.remove("after-choosing");
      }
      
      if (results) {
        results.style.display = "none";
        results.classList.add("none");
        results.classList.remove("grid");
      }
      
      if (yourChoice) yourChoice.innerHTML = "";
      if (oppoChoice) oppoChoice.innerHTML = "";
    } else {
      // Fallback to direct queries if elements not initialized
      const resultBoard = document.querySelector(".result__board");
      const results = document.querySelector(".results");
      const yourChoice = document.querySelector(".your__choice");
      const oppoChoice = document.querySelector(".oppo__choice");
      
      if (resultBoard) {
        resultBoard.style.display = "none";
        resultBoard.classList.add("none");
        resultBoard.classList.remove("grid");
        resultBoard.classList.remove("after-choosing");
      }
      if (results) {
        results.style.display = "none";
        results.classList.add("none");
        results.classList.remove("grid");
      }
      if (yourChoice) yourChoice.innerHTML = "";
      if (oppoChoice) oppoChoice.innerHTML = "";
    }
    
    // Show game area AFTER hiding result board
    this.gameUI.showGameArea();
    
    console.log("Returned to game, result board hidden, game area shown");
  }

  // Public methods for game actions
  createRoom(roomID) {
    console.log(`Creating room: ${roomID}`);
    console.log(`Socket connected: ${this.socket.connected}`);
    console.log(`Socket ID: ${this.socket.id}`);
    
    if (!this.socket.connected) {
      console.error("Socket not connected, cannot create room");
      alert("Chưa kết nối đến server. Vui lòng đợi vài giây rồi thử lại.");
      return;
    }
    
    this.gameState.setPlayerRole(true);
    this.gameState.setRoomID(roomID);
    
    console.log(`Emitting createRoom event with roomID: ${roomID}`);
    this.socket.emit("createRoom", roomID);
    console.log(`createRoom event emitted`);
  }

  joinRoom(roomID) {
    console.log(`Joining room: ${roomID}`);
    // Set roomID BEFORE reset to preserve it
    this.gameState.setRoomID(roomID);
    // Reset other state but keep roomID
    this.gameState.resetForNewRound();
    this.gameState.setWaitingForOpponent(false);
    this.gameState.resetScores();
    this.gameState.player1 = false; // Will be set by server
    this.socket.emit("joinRoom", roomID);
  }

  sendChoice(choice) {
    // Validation is done in main.js before calling this
    // Just send the choice to server
    const player = this.gameState.player1 ? "p1Choice" : "p2Choice";
    console.log(`Emitting ${player} for room ${this.gameState.roomID}`);

    this.socket.emit(player, {
      rpschoice: choice,
      roomID: this.gameState.roomID,
    });
  }

  playAgain() {
    if (!this.gameState.roomID) {
      console.error("No roomID, cannot play again");
      return;
    }

    if (!this.socket.connected) {
      alert("Chưa kết nối đến server. Vui lòng làm mới.");
      return;
    }

    console.log(`Emitting playerClicked for room ${this.gameState.roomID}`);
    this.socket.emit("playerClicked", {
      roomID: this.gameState.roomID,
      player1: this.gameState.player1,
    });

    this.resultUI.removeWinnerClasses();
    this.returnToGame();
  }

  exitGame() {
    console.log("exitGame() called");

    if (!this.gameState.roomID) {
      return;
    }

    if (this.socket.connected) {
      try {
        this.socket.emit("exitGame", {
          roomID: this.gameState.roomID,
          player: this.gameState.player1,
        });
        console.log("Exit event emitted");
      } catch (error) {
        console.error("Error emitting exitGame:", error);
      }
    }
  }

  getSocket() {
    return this.socket;
  }
}
