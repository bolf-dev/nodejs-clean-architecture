/** A player as the read side returns it: flat data, no domain objects. */
export interface PlayerReadModel {
  id: string;
  nickname: string;
  createdAt: Date;
  updatedAt: Date;
}

/** What logging in needs to check a password: the player and their stored password hash. */
export interface PlayerCredentials {
  playerId: string;
  passwordHash: string;
}
