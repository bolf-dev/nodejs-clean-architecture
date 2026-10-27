import type { Nickname } from './nickname.value-object.js';

export class Player {
  private constructor(
    readonly id: string,
    private _nickname: Nickname,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /** A new player. The id and the current time are passed in by the application. */
  static create(props: { id: string; nickname: Nickname; now: Date }): Player {
    return new Player(props.id, props.nickname, props.now, props.now);
  }

  /** Rebuilds a stored player, e.g. when the repository loads it from the database. */
  static reconstitute(props: { id: string; nickname: Nickname; createdAt: Date; updatedAt: Date }): Player {
    return new Player(props.id, props.nickname, props.createdAt, props.updatedAt);
  }

  get nickname(): Nickname {
    return this._nickname;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /** Changes the nickname (R6). Exactly the same nickname changes nothing, not even updatedAt (R9). */
  changeNickname(nickname: Nickname, now: Date): void {
    if (nickname.isSameAs(this._nickname)) {
      return;
    }
    this._nickname = nickname;
    this._updatedAt = now;
  }
}
