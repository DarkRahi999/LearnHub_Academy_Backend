import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { Notice } from './notice.entity';
import { NoticeRead } from './notice-read.entity';
import { User } from '../auth/entity/user.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { RolePermissionsService } from '../auth/role-permissions.service';
import { UserRole, Permission } from '../utils/enums';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name);

  constructor(
    @InjectRepository(Notice) private readonly noticeRepo: EntityRepository<Notice>,
    @InjectRepository(NoticeRead) private readonly noticeReadRepo: EntityRepository<NoticeRead>,
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    private readonly rolePermissionsService: RolePermissionsService,
    private readonly configService: ConfigService,
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
      
      // Send email notifications to users who have email notifications enabled
      await this.sendNoticeEmailNotifications(savedNotice!);
      
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

      // Only count notices created after user registration
      // This prevents new users from seeing all historical notices as "unread"
      const userCreatedAt = user.createdAt;
      
      // Get all active notices created after user registration
      const relevantNotices = await this.noticeRepo.find({
        isActive: true,
        createdAt: { $gte: userCreatedAt }
      });
      
      // Get count of notices this user has read from relevant notices
      const relevantNoticeIds = relevantNotices.map(notice => notice.id);
      const readNoticesCount = await this.noticeReadRepo.count({ 
        user,
        notice: { id: { $in: relevantNoticeIds } }
      });
      
      const unreadCount = relevantNotices.length - readNoticesCount;
      
      this.logger.log(`User has ${unreadCount} unread notices (${relevantNotices.length} relevant, ${readNoticesCount} read)`);
      return { unreadCount: Math.max(0, unreadCount) };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error getting unread count: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to get unread notices count');
    }
  }

  async getAllNoticesWithReadStatus(userFromJwt: any, searchTerm?: string) {
    try {
      const user = await this.userRepo.findOne({ id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Build search query - only show notices created after user registration
      const whereCondition: any = { 
        isActive: true,
        createdAt: { $gte: user.createdAt }
      };
      
      if (searchTerm && searchTerm.trim()) {
        const searchPattern = `%${searchTerm.trim().toLowerCase()}%`;
        whereCondition.$and = [
          { createdAt: { $gte: user.createdAt } },
          {
            $or: [
              { subHeading: { $ilike: searchPattern } },
              { description: { $ilike: searchPattern } }
            ]
          }
        ];
        // Remove the conflicting createdAt from the root level
        delete whereCondition.createdAt;
      }

      const notices = await this.noticeRepo.find(
        whereCondition,
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
      
      this.logger.log(`Retrieved ${notices.length} notices with read status${searchTerm ? ` (search: "${searchTerm}")` : ''} for user since ${user.createdAt}`);
      return { 
        notices: noticesWithReadStatus,
        total: notices.length,
        searchTerm: searchTerm || null
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error fetching notices with read status: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch notices');
    }
  }

  async getAllNotices(isAdminView: boolean = false) {
    try {
      const notices = await this.noticeRepo.find(
        { isActive: true },
        { 
          populate: ['createdBy'],
          orderBy: { createdAt: 'DESC' },
          limit: isAdminView ? 500 : 100 // Admins can see more notices
        }
      );
      
      this.logger.log(`Retrieved ${notices.length} active notices${isAdminView ? ' (admin view)' : ''}`);
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

      // Start transaction for safe deletion
      await em.begin();
      
      try {
        // First, delete all related NoticeRead records
        const relatedReads = await em.find(NoticeRead, { notice });
        if (relatedReads.length > 0) {
          await em.removeAndFlush(relatedReads);
          this.logger.log(`Deleted ${relatedReads.length} related read records for notice ${noticeId}`);
        }

        // Then perform soft delete by setting isActive to false
        // This preserves the notice data while making it unavailable
        notice.isActive = false;
        notice.editedAt = new Date();
        await em.persistAndFlush(notice);
        
        // Commit the transaction
        await em.commit();
        
        this.logger.log(`Notice ${noticeId} soft deleted successfully (marked as inactive)`);
        return { message: 'Notice deleted successfully' };
      } catch (transactionError) {
        // Rollback the transaction on any error
        await em.rollback();
        throw transactionError;
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error deleting notice: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete notice');
    }
  }

  // Admin-only method for permanent deletion (hard delete)
  async permanentlyDeleteNotice(noticeId: number, userFromJwt: any) {
    const em = this.noticeRepo.getEntityManager().fork();
    
    try {
      const user = await em.findOne(User, { id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Only SUPER_ADMIN can permanently delete notices
      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only Super Admin can permanently delete notices');
      }

      const notice = await em.findOne(Notice, { id: noticeId });
      if (!notice) {
        throw new NotFoundException('Notice not found');
      }

      // Start transaction for safe permanent deletion
      await em.begin();
      
      try {
        // First, delete all related NoticeRead records
        const relatedReads = await em.find(NoticeRead, { notice });
        if (relatedReads.length > 0) {
          await em.removeAndFlush(relatedReads);
          this.logger.log(`Permanently deleted ${relatedReads.length} related read records for notice ${noticeId}`);
        }

        // Then permanently delete the notice
        await em.removeAndFlush(notice);
        
        // Commit the transaction
        await em.commit();
        
        this.logger.log(`Notice ${noticeId} permanently deleted by Super Admin`);
        return { message: 'Notice permanently deleted successfully' };
      } catch (transactionError) {
        // Rollback the transaction on any error
        await em.rollback();
        throw transactionError;
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error permanently deleting notice: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to permanently delete notice');
    }
  }

  // Method to restore soft-deleted notices
  async restoreNotice(noticeId: number, userFromJwt: any) {
    const em = this.noticeRepo.getEntityManager().fork();
    
    try {
      const user = await em.findOne(User, { id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if user has permission to restore notices
      if (!this.rolePermissionsService.hasPermission(user.role, Permission.UPDATE_NOTICE)) {
        throw new ForbiddenException('You do not have permission to restore notices');
      }

      // Find the notice including inactive ones
      const notice = await em.findOne(Notice, { id: noticeId, isActive: false });
      if (!notice) {
        throw new NotFoundException('Deleted notice not found');
      }

      // Restore the notice by setting isActive to true
      notice.isActive = true;
      notice.editedAt = new Date();
      await em.persistAndFlush(notice);
      
      this.logger.log(`Notice ${noticeId} restored successfully`);
      return { 
        message: 'Notice restored successfully',
        notice: this.sanitize(notice)
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error restoring notice: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to restore notice');
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

  private async sendNoticeEmailNotifications(notice: Notice) {
    try {
      // Get all users who have email notifications enabled
      const users = await this.userRepo.find({ emailNoticeEnabled: true });
      
      // Send email to each user
      for (const user of users) {
        // Skip sending email to the user who created the notice
        if (user.id === notice.createdBy.id) {
          continue;
        }
        
        try {
          await this.sendMail(
            user.email,
            `New Notice: ${notice.subHeading}`,
            `<div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <!-- Header -->
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #4F46E5;">
                <h1 style="color: #4F46E5; font-size: 24px; font-weight: bold; margin: 0;">LearnHub Academy</h1>
                <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0;">Your Learning Platform</p>
              </div>

              <!-- Content -->
              <div style="padding-top: 12px; padding-bottom: 12px;">
                <h2 style="color: #1F2937; font-size: 20px; font-weight: bold;">New Notice Posted</h2>
                <p style="margin-top: 12px;">Hello ${user.firstName || 'User'},</p>
                <p style="margin-top: 8px; font-size: 14px;">A new notice has been posted on LearnHub Academy:</p>

                <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px; margin: 24px 0;">
                  <h3 style="color: #1F2937; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">${notice.subHeading}</h3>
                  <p style="color: #6B7280; margin: 0; line-height: 1.5;">${notice.description}</p>
                  <p style="color: #6B7280; font-size: 12px; margin: 8px 0 0 0;">
                    Posted by: ${notice.createdBy.firstName} ${notice.createdBy.lastName || ''} on ${new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <p style="margin-top: 16px;">
                  Please <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/notices" style="color: #4F46E5; text-decoration: none; font-weight: bold;">log in to your account</a> to view the full notice.
                </p>

                <p style="margin-top: 16px;">Thank you for using LearnHub Academy!</p>
              </div>

              <!-- Footer -->
              <div style="padding-top: 20px; padding-bottom: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #9CA3AF; font-size: 14px;">
                <p>© 2025 LearnHub Academy. All rights reserved.</p>
                <p style="font-size: 12px; margin-top: 4px;">
                  You received this email because you have enabled email notifications for notices. 
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/update" style="color: #4F46E5; text-decoration: none;">Manage your notification preferences</a>
                </p>
              </div>
            </div>`
          );
        } catch (emailError) {
          this.logger.error(`Failed to send email to ${user.email}: ${emailError.message}`, emailError.stack);
        }
      }
    } catch (error) {
      this.logger.error(`Error sending notice email notifications: ${error.message}`, error.stack);
    }
  }

  private async sendMail(to: string, subject: string, html: string) {
    try {
      // Use ConfigService to get environment variables with fallbacks
      const userEmail = this.configService.get<string>('MAIL_USER') || 'usera2lite789@gmail.com';
      const appPassword = this.configService.get<string>('MAIL_PASS') || 'digkzlwkzvrxtsab'; // Your working password

      // Validate credentials
      if (!userEmail || !appPassword) {
        throw new Error('Email credentials are missing');
      }

      // Ensure credentials are strings and not empty
      const user = String(userEmail).trim();
      const pass = String(appPassword).trim();

      if (!user || !pass) {
        throw new Error('Email credentials are invalid or empty');
      }

      // Gmail configuration with explicit SMTP settings
      const transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com',
        port: this.configService.get<number>('MAIL_PORT') || 587,
        secure: this.configService.get<string>('MAIL_SECURE') === 'true',
        auth: {
          user: user,
          pass: pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.sendMail({
        from: `"LearnHub Academy" <${user}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      // Provide specific error messages based on the error type
      if (error.message.includes('Missing credentials')) {
        throw new BadRequestException('Email configuration error: Missing or invalid credentials.');
      }

      if (error.message.includes('BadCredentials') || error.message.includes('Invalid login')) {
        throw new BadRequestException('Email authentication failed. Please check: 1) App Password is correct, 2) 2-Factor Authentication is enabled.');
      }

      // Generic error message
      throw new BadRequestException('Failed to send email. Please try again. Error: ' + error.message);
    }
  }
}