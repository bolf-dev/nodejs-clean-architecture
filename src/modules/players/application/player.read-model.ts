/** A player as the read side returns it: flat data, no domain objects. */
export interface PlayerReadModel {
  id: string;
  nickname: string;
  createdAt: Date;
  updatedAt: Date;
}
