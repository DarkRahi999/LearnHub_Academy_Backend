import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, ValidationPipe, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NoticeService } from './notice.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard, RequirePermissions } from '../auth/role.guard';
import { Permission } from '../utils/enums';

@ApiTags('Notices')
@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.CREATE_NOTICE)
  @ApiOperation({ summary: 'Create a new notice (Admin/Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Notice created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async createNotice(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) createNoticeDto: CreateNoticeDto, 
    @Req() req: any
  ) {
    return this.noticeService.createNotice(createNoticeDto, req.user);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all active notices with read status' })
  @ApiResponse({ status: 200, description: 'Notices retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  async getAllNotices(@Req() req: any) {
    return this.noticeService.getAllNoticesWithReadStatus(req.user);
  }

  @Post(':id/read')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark notice as read' })
  @ApiResponse({ status: 200, description: 'Notice marked as read successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 404, description: 'Notice not found' })
  async markNoticeAsRead(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req: any
  ) {
    return this.noticeService.markNoticeAsRead(id, req.user);
  }

  @Get('unread/count')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get unread notices count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  async getUnreadNoticesCount(@Req() req: any) {
    return this.noticeService.getUnreadNoticesCount(req.user);
  }
}