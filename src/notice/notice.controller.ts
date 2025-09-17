import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query, UseGuards, ValidationPipe, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NoticeService } from './notice.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard, RequirePermissions } from '../auth/role.guard';
import { Permission } from '../utils/enums';

@ApiTags('Notices')
@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
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
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all active notices with read status and optional search' })
  @ApiResponse({ status: 200, description: 'Notices retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  async getAllNotices(@Req() req: any, @Query('search') search?: string) {
    return this.noticeService.getAllNoticesWithReadStatus(req.user, search);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get notice by ID' })
  @ApiResponse({ status: 200, description: 'Notice retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 404, description: 'Notice not found' })
  async getNoticeById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number
  ) {
    return this.noticeService.getNoticeById(id);
  }

  @Post(':id/read')
  @ApiBearerAuth('JWT-auth')
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
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get unread notices count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  async getUnreadNoticesCount(@Req() req: any) {
    return this.noticeService.getUnreadNoticesCount(req.user);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.UPDATE_NOTICE)
  @ApiOperation({ summary: 'Update a notice (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Notice updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data or ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Notice not found' })
  async updateNotice(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) updateNoticeDto: UpdateNoticeDto,
    @Req() req: any
  ) {
    return this.noticeService.updateNotice(id, updateNoticeDto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.DELETE_NOTICE)
  @ApiOperation({ summary: 'Soft delete a notice (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Notice soft deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Notice not found' })
  async deleteNotice(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req: any
  ) {
    return this.noticeService.deleteNotice(id, req.user);
  }

  @Delete(':id/permanent')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.DELETE_NOTICE)
  @ApiOperation({ summary: 'Permanently delete a notice (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Notice permanently deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  @ApiResponse({ status: 404, description: 'Notice not found' })
  async permanentlyDeleteNotice(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req: any
  ) {
    return this.noticeService.permanentlyDeleteNotice(id, req.user);
  }

  @Put(':id/restore')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.UPDATE_NOTICE)
  @ApiOperation({ summary: 'Restore a soft-deleted notice (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Notice restored successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Deleted notice not found' })
  async restoreNotice(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req: any
  ) {
    return this.noticeService.restoreNotice(id, req.user);
  }
}