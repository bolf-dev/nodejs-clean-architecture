/** A player as the read side returns it: flat data, no domain objects. */
export interface PlayerReadModel {
  id: string;
  email: string;
  nickname: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A player in the list of all players (spec 005): only what the list shows. */
export interface PlayerListItem {
  id: string;
  nickname: string;
}

/** What logging in needs to check a password: the player and their stored password hash. */
export interface PlayerCredentials {
  playerId: string;
  passwordHash: string;
}
