import type { DriverReadModel } from '../../application/season.read-model.js';

/** Body of GET /v1/drivers, wrapped in an object like the list of players. */
export class DriversListResponse {
  constructor(readonly drivers: DriverReadModel[]) {}

  static from(drivers: DriverReadModel[]): DriversListResponse {
    return new DriversListResponse(
      drivers.map(({ id, code, number, firstName, lastName, team }) => ({
        id,
        code,
        number,
        firstName,
        lastName,
        team,
      })),
    );
  }
}
