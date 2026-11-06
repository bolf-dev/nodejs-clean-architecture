import type { Email } from './email.value-object.js';
import type { Nickname } from './nickname.value-object.js';

export class Player {
  private constructor(
    readonly id: string,
    readonly email: Email,
    private _nickname: Nickname,
    readonly passwordHash: string,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /**
   * A newly registered player. The id, the password hash and the current time are passed in by the application;
   * hashing the password is not the domain's job.
   */
  static register(props: { id: string; email: Email; nickname: Nickname; passwordHash: string; now: Date }): Player {
    return new Player(props.id, props.email, props.nickname, props.passwordHash, props.now, props.now);
  }

  /** Rebuilds a stored player, e.g. when the repository loads it from the database. */
  static reconstitute(props: {
    id: string;
    email: Email;
    nickname: Nickname;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  }): Player {
    return new Player(
      props.id,
      props.email,
      props.nickname,
      props.passwordHash,
      props.createdAt,
      props.updatedAt,
    );
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
