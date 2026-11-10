/**
 * Port for the players a prediction belongs to. They belong to the players module,
 * so the adapter asks its queries instead of reading its tables (constitution 2).
 */
export abstract class PlayerDirectory {
  abstract exists(playerId: string): Promise<boolean>;
}
