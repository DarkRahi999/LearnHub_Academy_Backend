import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { Notice } from './notice.entity';
import { User } from '../auth/entity/user.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { RolePermissionsService } from '../auth/role-permissions.service';
import { UserRole, Permission } from '../utils/enums';

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice) private readonly noticeRepo: EntityRepository<Notice>,
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async createNotice(createNoticeDto: CreateNoticeDto, createdBy: User) {
    // Check if user has permission to create notices
    if (!this.rolePermissionsService.hasPermission(createdBy.role, Permission.CREATE_NOTICE)) {
      throw new ForbiddenException('You do not have permission to create notices');
    }

    const notice = this.noticeRepo.create({
      title: createNoticeDto.title,
      content: createNoticeDto.content,
      isActive: true,
      createdBy,
    });

    await this.noticeRepo.getEntityManager().persistAndFlush(notice);
    return this.sanitize(notice);
  }

  async getAllNotices() {
    const notices = await this.noticeRepo.find(
      { isActive: true },
      { 
        populate: ['createdBy'],
        orderBy: { createdAt: 'DESC' }
      }
    );
    return { notices: notices.map(notice => this.sanitize(notice)) };
  }

  async getNoticeById(id: number) {
    const notice = await this.noticeRepo.findOne(
      { id, isActive: true },
      { populate: ['createdBy'] }
    );
    
    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    return this.sanitize(notice);
  }

  async updateNotice(id: number, updateData: Partial<CreateNoticeDto>, user: User) {
    const notice = await this.noticeRepo.findOne({ id }, { populate: ['createdBy'] });
    
    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    // Check if user has permission to update notices
    if (!this.rolePermissionsService.hasPermission(user.role, Permission.UPDATE_NOTICE)) {
      throw new ForbiddenException('You do not have permission to update notices');
    }

    // Only allow the creator or super admin to update
    if (notice.createdBy.id !== user.id && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only update your own notices');
    }

    if (updateData.title) notice.title = updateData.title;
    if (updateData.content) notice.content = updateData.content;

    await this.noticeRepo.getEntityManager().persistAndFlush(notice);
    return this.sanitize(notice);
  }

  async deleteNotice(id: number, user: User) {
    const notice = await this.noticeRepo.findOne({ id }, { populate: ['createdBy'] });
    
    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    // Check if user has permission to delete notices
    if (!this.rolePermissionsService.hasPermission(user.role, Permission.DELETE_NOTICE)) {
      throw new ForbiddenException('You do not have permission to delete notices');
    }

    // Only allow the creator or super admin to delete
    if (notice.createdBy.id !== user.id && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only delete your own notices');
    }

    notice.isActive = false;
    await this.noticeRepo.getEntityManager().persistAndFlush(notice);
    return { message: 'Notice deleted successfully' };
  }

  private sanitize(notice: Notice) {
    const { createdBy, ...rest } = notice as any;
    return {
      ...rest,
      createdBy: {
        id: createdBy.id,
        firstName: createdBy.firstName,
        lastName: createdBy.lastName,
        email: createdBy.email,
      }
    };
  }
}
