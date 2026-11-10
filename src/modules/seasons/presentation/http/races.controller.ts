import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { SeasonRequest } from '../../../../shared/presentation/http/season.request.js';
import { GetRaceQuery } from '../../application/queries/get-race/get-race.query.js';
import { ListRacesQuery } from '../../application/queries/list-races/list-races.query.js';
import { RaceResponse } from './race.response.js';
import { RacesListResponse } from './races-list.response.js';

const raceIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new BadRequestException('raceId must be a UUID'),
});

@Controller('v1/races')
export class RacesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(@Query() request: SeasonRequest): Promise<RacesListResponse> {
    return RacesListResponse.from(await this.queryBus.execute(new ListRacesQuery(Number(request.season))));
  }

  @Get(':raceId')
  async get(@Param('raceId', raceIdPipe) raceId: string): Promise<RaceResponse> {
    return RaceResponse.from(await this.queryBus.execute(new GetRaceQuery(raceId)));
  }
}
