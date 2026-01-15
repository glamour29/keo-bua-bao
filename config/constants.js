export const CHOICES = ["rock", "paper", "scissors"];

// Backwards-compatible aliases used across server/client code
export const VALID_CHOICES = CHOICES;

export const ROOM_STATUS = {
  WAITING: "waiting",
  PLAYING: "playing",
};

export const WINNER_TYPES = {
  DRAW: "draw",
  PLAYER1: "p1",
  PLAYER2: "p2",
};

export const RESULT = {
  WIN: "win",
  LOSE: "lose",
  DRAW: "draw",
};

export const GAME_MESSAGES = {
  OPPONENT_LEFT: "Đối thủ đã rời khỏi phòng",
  INVALID_CHOICE: "Lựa chọn không hợp lệ",
  ROOM_NOT_FOUND: "Không tìm thấy phòng",
  NEED_TWO_PLAYERS: "Cần 2 người chơi để bắt đầu",
  NOT_PLAYER1: "Bạn không phải người chơi 1",
  NOT_PLAYER2: "Bạn không phải người chơi 2",
  OPPONENT_NOT_IN_ROOM: "Đối thủ không có trong phòng",
  ALREADY_CHOSEN: "Bạn đã chọn rồi",
};

