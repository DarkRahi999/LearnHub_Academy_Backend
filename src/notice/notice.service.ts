import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { Notice } from './notice.entity';
import { NoticeRead } from './notice-read.entity';
import { User } from '../auth/entity/user.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { RolePermissionsService } from '../auth/role-permissions.service';
import { UserRole, Permission } from '../utils/enums';

@Injectable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name);

  constructor(
    @InjectRepository(Notice) private readonly noticeRepo: EntityRepository<Notice>,
    @InjectRepository(NoticeRead) private readonly noticeReadRepo: EntityRepository<NoticeRead>,
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async createNotice(createNoticeDto: CreateNoticeDto, userFromJwt: any) {
    const em = this.noticeRepo.getEntityManager().fork();
    
    try {
      // Fetch the complete user from database using the JWT user info
      const user = await em.findOne(User, { id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if user has permission to create notices
      if (!this.rolePermissionsService.hasPermission(user.role, Permission.CREATE_NOTICE)) {
        throw new ForbiddenException('You do not have permission to create notices');
      }

      // Validate input data
      if (!createNoticeDto.subHeading || createNoticeDto.subHeading.trim().length < 5) {
        throw new BadRequestException('Subheading must be at least 5 characters long');
      }
      if (!createNoticeDto.description || createNoticeDto.description.trim().length < 10) {
        throw new BadRequestException('Description must be at least 10 characters long');
      }

      // Create the notice entity with user reference
      const notice = em.create(Notice, {
        subHeading: createNoticeDto.subHeading.trim(),
        description: createNoticeDto.description.trim(),
        isActive: true,
        createdBy: em.getReference(User, user.id), // Use reference to avoid validation issues
        createdAt: new Date(),
      });

      // Persist to database
      await em.persistAndFlush(notice);
      
      // Reload with relations for response
      const savedNotice = await em.findOne(Notice, { id: notice.id }, { populate: ['createdBy'] });
      
      this.logger.log(`Notice created successfully with ID: ${notice.id}`);
      return this.sanitize(savedNotice!);
    } catch (error) {
      this.logger.error(`Error creating notice: ${error.message}`, error.stack);
      
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle database specific errors
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('A notice with similar content already exists');
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw new BadRequestException('Invalid user reference');
      }
      if (error.code === '23514') { // Check constraint violation
        throw new BadRequestException('Notice data does not meet validation requirements');
      }
      
      throw new BadRequestException('Failed to create notice. Please try again.');
    }
  }

  async getNoticeById(noticeId: number) {
    try {
      const notice = await this.noticeRepo.findOne(
        { id: noticeId, isActive: true },
        { populate: ['createdBy'] }
      );
      
      if (!notice) {
        throw new NotFoundException('Notice not found');
      }
      
      this.logger.log(`Retrieved notice with ID: ${noticeId}`);
      return this.sanitize(notice);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching notice by ID: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch notice');
    }
  }

  // Notification system methods
  async markNoticeAsRead(noticeId: number, userFromJwt: any) {
    const em = this.noticeReadRepo.getEntityManager().fork();
    
    try {
      const user = await em.findOne(User, { id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const notice = await em.findOne(Notice, { id: noticeId, isActive: true });
      if (!notice) {
        throw new NotFoundException('Notice not found');
      }

      // Check if already marked as read
      const existingRead = await em.findOne(NoticeRead, { user, notice });
      if (existingRead) {
        return { message: 'Notice already marked as read' };
      }

      // Create read record
      const noticeRead = em.create(NoticeRead, {
        user: em.getReference(User, user.id),
        notice: em.getReference(Notice, notice.id),
        readAt: new Date(),
      });

      await em.persistAndFlush(noticeRead);
      
      this.logger.log(`Notice ${noticeId} marked as read`);
      return { message: 'Notice marked as read successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error marking notice as read: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to mark notice as read');
    }
  }

  async getUnreadNoticesCount(userFromJwt: any) {
    try {
      const user = await this.userRepo.findOne({ id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Get all active notices
      const totalNotices = await this.noticeRepo.count({ isActive: true });
      
      // Get count of notices this user has read
      const readNoticesCount = await this.noticeReadRepo.count({ user });
      
      const unreadCount = totalNotices - readNoticesCount;
      
      this.logger.log(`User has ${unreadCount} unread notices`);
      return { unreadCount: Math.max(0, unreadCount) };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error getting unread count: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to get unread notices count');
    }
  }

  async getAllNoticesWithReadStatus(userFromJwt: any) {
    try {
      const user = await this.userRepo.findOne({ id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const notices = await this.noticeRepo.find(
        { isActive: true },
        { 
          populate: ['createdBy'],
          orderBy: { createdAt: 'DESC' },
          limit: 100
        }
      );

      // Get read status for each notice
      const noticesWithReadStatus = await Promise.all(
        notices.map(async (notice) => {
          const isRead = await this.noticeReadRepo.findOne({ user, notice });
          return {
            ...this.sanitize(notice),
            isRead: !!isRead,
            readAt: isRead?.readAt || null
          };
        })
      );
      
      this.logger.log(`Retrieved ${notices.length} notices with read status`);
      return { 
        notices: noticesWithReadStatus,
        total: notices.length 
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error fetching notices with read status: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch notices');
    }
  }

  async getAllNotices() {
    try {
      const notices = await this.noticeRepo.find(
        { isActive: true },
        { 
          populate: ['createdBy'],
          orderBy: { createdAt: 'DESC' },
          limit: 100 // Prevent loading too many notices at once
        }
      );
      
      this.logger.log(`Retrieved ${notices.length} active notices`);
      return { 
        notices: notices.map(notice => this.sanitize(notice)),
        total: notices.length 
      };
    } catch (error) {
      this.logger.error(`Error fetching notices: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch notices');
    }
  }

  async updateNotice(noticeId: number, updateNoticeDto: UpdateNoticeDto, userFromJwt: any) {
    const em = this.noticeRepo.getEntityManager().fork();
    
    try {
      const user = await em.findOne(User, { id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if user has permission to update notices
      if (!this.rolePermissionsService.hasPermission(user.role, Permission.UPDATE_NOTICE)) {
        throw new ForbiddenException('You do not have permission to update notices');
      }

      const notice = await em.findOne(Notice, { id: noticeId, isActive: true });
      if (!notice) {
        throw new NotFoundException('Notice not found');
      }

      // Validate input data if provided
      if (updateNoticeDto.subHeading !== undefined) {
        if (!updateNoticeDto.subHeading || updateNoticeDto.subHeading.trim().length < 5) {
          throw new BadRequestException('Subheading must be at least 5 characters long');
        }
        notice.subHeading = updateNoticeDto.subHeading.trim();
      }
      
      if (updateNoticeDto.description !== undefined) {
        if (!updateNoticeDto.description || updateNoticeDto.description.trim().length < 10) {
          throw new BadRequestException('Description must be at least 10 characters long');
        }
        notice.description = updateNoticeDto.description.trim();
      }

      // Update timestamp
      notice.editedAt = new Date();
      
      await em.persistAndFlush(notice);
      
      // Reload with relations for response
      const updatedNotice = await em.findOne(Notice, { id: notice.id }, { populate: ['createdBy'] });
      
      this.logger.log(`Notice ${noticeId} updated successfully`);
      return this.sanitize(updatedNotice!);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error updating notice: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update notice');
    }
  }

  async deleteNotice(noticeId: number, userFromJwt: any) {
    const em = this.noticeRepo.getEntityManager().fork();
    
    try {
      const user = await em.findOne(User, { id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if user has permission to delete notices
      if (!this.rolePermissionsService.hasPermission(user.role, Permission.DELETE_NOTICE)) {
        throw new ForbiddenException('You do not have permission to delete notices');
      }

      const notice = await em.findOne(Notice, { id: noticeId });
      if (!notice) {
        throw new NotFoundException('Notice not found');
      }

      // Hard delete - completely remove from database
      await em.removeAndFlush(notice);
      
      this.logger.log(`Notice ${noticeId} deleted successfully`);
      return { message: 'Notice deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error deleting notice: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete notice');
    }
  }

  private sanitize(notice: Notice) {
    if (!notice) return null;
    
    const { createdBy, ...rest } = notice as any;
    return {
      ...rest,
      createdBy: createdBy ? {
        id: createdBy.id,
        firstName: createdBy.firstName,
        lastName: createdBy.lastName,
        email: createdBy.email,
        role: createdBy.role,
      } : null
    };
  }
}