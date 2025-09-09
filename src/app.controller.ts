import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @ApiResponse({ status: 200, description: 'Return hello message' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
