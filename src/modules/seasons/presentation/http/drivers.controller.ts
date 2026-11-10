import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { SeasonRequest } from '../../../../shared/presentation/http/season.request.js';
import { ListDriversQuery } from '../../application/queries/list-drivers/list-drivers.query.js';
import { DriversListResponse } from './drivers-list.response.js';

@Controller('v1/drivers')
export class DriversController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(@Query() request: SeasonRequest): Promise<DriversListResponse> {
    return DriversListResponse.from(await this.queryBus.execute(new ListDriversQuery(Number(request.season))));
  }
}
