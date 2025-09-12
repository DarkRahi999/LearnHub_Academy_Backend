import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
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
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async createNotice(@Body() createNoticeDto: CreateNoticeDto, @Req() req: any) {
    return this.noticeService.createNotice(createNoticeDto, req.user);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all active notices' })
  @ApiResponse({ status: 200, description: 'Notices retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  async getAllNotices() {
    return this.noticeService.getAllNotices();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get notice by ID' })
  @ApiResponse({ status: 200, description: 'Notice retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 404, description: 'Notice not found' })
  async getNoticeById(@Param('id') id: string) {
    return this.noticeService.getNoticeById(Number(id));
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.UPDATE_NOTICE)
  @ApiOperation({ summary: 'Update notice (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Notice updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Notice not found' })
  async updateNotice(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateNoticeDto>,
    @Req() req: any
  ) {
    return this.noticeService.updateNotice(Number(id), updateData, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.DELETE_NOTICE)
  @ApiOperation({ summary: 'Delete notice (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Notice deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Notice not found' })
  async deleteNotice(@Param('id') id: string, @Req() req: any) {
    return this.noticeService.deleteNotice(Number(id), req.user);
  }
}
