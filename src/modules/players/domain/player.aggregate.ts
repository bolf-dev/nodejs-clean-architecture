import type { Nickname } from './nickname.value-object.js';

export class Player {
  private constructor(
    readonly id: string,
    readonly nickname: Nickname,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  /** A new player. The id and the current time are passed in by the application. */
  static create(props: { id: string; nickname: Nickname; now: Date }): Player {
    return new Player(props.id, props.nickname, props.now, props.now);
  }
}
