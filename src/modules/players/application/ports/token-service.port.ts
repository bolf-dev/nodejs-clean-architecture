/** An access token for a player and the moment it expires. */
export interface AccessToken {
  accessToken: string;
  expiresAt: Date;
}

/** Port for issuing and checking access tokens, implemented in infrastructure. */
export abstract class TokenService {
  /** A new access token identifying the player, valid for 7 days (R9 of spec 004). */
  abstract issue(playerId: string): Promise<AccessToken>;

  /** The id of the player the token identifies, or null when the token is invalid or expired. */
  abstract verify(token: string): Promise<string | null>;
}
