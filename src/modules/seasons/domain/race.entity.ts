/** What the data source says about a race of a season. Times are in UTC (R6). */
export interface RaceData {
  round: number;
  name: string;
  circuit: string;
  locality: string;
  country: string;
  /** Only on sprint weekends */
  sprintQualifyingAt: Date | null;
  qualifyingAt: Date;
  raceAt: Date;
}

/** A race of a season, identified within it by its round (R5). Part of the Season aggregate. */
export class Race {
  constructor(
    readonly id: string,
    private data: RaceData,
  ) {}

  get round(): number {
    return this.data.round;
  }

  get name(): string {
    return this.data.name;
  }

  get circuit(): string {
    return this.data.circuit;
  }

  get locality(): string {
    return this.data.locality;
  }

  get country(): string {
    return this.data.country;
  }

  get sprintQualifyingAt(): Date | null {
    return this.data.sprintQualifyingAt;
  }

  get qualifyingAt(): Date {
    return this.data.qualifyingAt;
  }

  get raceAt(): Date {
    return this.data.raceAt;
  }

  /** Takes over the current data of the source, e.g. a changed qualifying time (R2). */
  update(data: RaceData): void {
    this.data = data;
  }
}
