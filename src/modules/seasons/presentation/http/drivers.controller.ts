import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ListDriversQuery } from '../../application/queries/list-drivers/list-drivers.query.js';
import { DriversListResponse } from './drivers-list.response.js';
import { SeasonRequest } from './season.request.js';

@Controller('v1/drivers')
export class DriversController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(@Query() request: SeasonRequest): Promise<DriversListResponse> {
    return DriversListResponse.from(await this.queryBus.execute(new ListDriversQuery(Number(request.season))));
  }
}
