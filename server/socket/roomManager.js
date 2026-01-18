import { ROOM_STATUS } from "../../config/constants.js";

/**
 * Room Manager - Handles room creation, joining, and state management
 */
export class RoomManager {
  constructor() {
    this.rooms = {};
  }

  /**
   * Create a new room
   * @param {string} roomID - Room identifier
   * @param {string} playerId - Player 1's socket ID
   */
  createRoom(roomID, playerId) {
    this.rooms[roomID] = {
      p1Choice: null,
      p2Choice: null,
      p1Score: 0,
      p2Score: 0,
      player1Id: playerId,
      player2Id: null,
      status: ROOM_STATUS.WAITING,
    };
    return this.rooms[roomID];
  }

  /**
   * Get room data
   * @param {string} roomID - Room identifier
   * @returns {Object|null} - Room data or null if not found
   */
  getRoom(roomID) {
    return this.rooms[roomID] || null;
  }

  /**
   * Check if room exists
   * @param {string} roomID - Room identifier
   * @returns {boolean}
   */
  roomExists(roomID) {
    return !!this.rooms[roomID];
  }

  /**
   * Join a room (assign player role)
   * @param {string} roomID - Room identifier
   * @param {string} playerId - Player's socket ID
   * @param {number} currentRoomSize - Current number of players in room
   * @returns {Object|null} - Updated room data or null
   */
  joinRoom(roomID, playerId, currentRoomSize) {
    if (!this.rooms[roomID]) {
      // Room doesn't exist, create it with player as player1
      this.rooms[roomID] = {
        p1Choice: null,
        p2Choice: null,
        p1Score: 0,
        p2Score: 0,
        player1Id: playerId,
        player2Id: null,
        status: ROOM_STATUS.PLAYING,
      };
      return this.rooms[roomID];
    }

    // If room exists but no active players, reset it
    if (currentRoomSize === 1 && (!this.rooms[roomID].player1Id || !this.rooms[roomID].player2Id)) {
      this.rooms[roomID] = {
        p1Choice: null,
        p2Choice: null,
        p1Score: 0,
        p2Score: 0,
        player1Id: null,
        player2Id: null,
        status: ROOM_STATUS.WAITING,
      };
    }

    // Assign player role
    if (!this.rooms[roomID].player1Id) {
      this.rooms[roomID].player1Id = playerId;
      this.rooms[roomID].status = ROOM_STATUS.PLAYING;
    } else if (!this.rooms[roomID].player2Id) {
      this.rooms[roomID].player2Id = playerId;
      this.rooms[roomID].status = ROOM_STATUS.PLAYING;
    }

    // Reset choices when 2 players join
    if (currentRoomSize >= 2) {
      this.rooms[roomID].p1Choice = null;
      this.rooms[roomID].p2Choice = null;
    }

    return this.rooms[roomID];
  }

}