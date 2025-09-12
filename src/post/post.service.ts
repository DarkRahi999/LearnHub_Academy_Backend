import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { Post } from './post.entity';
import { User } from '../auth/entity/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { RolePermissionsService } from '../auth/role-permissions.service';
import { UserRole, Permission } from '../utils/enums';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly postRepo: EntityRepository<Post>,
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  async createPost(createPostDto: CreatePostDto, createdBy: User) {
    // Check if user has permission to create posts (Super Admin only)
    if (!this.rolePermissionsService.hasPermission(createdBy.role, Permission.CREATE_POST)) {
      throw new ForbiddenException('You do not have permission to create posts');
    }

    const post = this.postRepo.create({
      title: createPostDto.title,
      content: createPostDto.content,
      isPublished: createPostDto.isPublished ?? true,
      isActive: true,
      createdBy,
    });

    await this.postRepo.getEntityManager().persistAndFlush(post);
    return this.sanitize(post);
  }

  async getAllPosts() {
    const posts = await this.postRepo.find(
      { isActive: true, isPublished: true },
      { 
        populate: ['createdBy'],
        orderBy: { createdAt: 'DESC' }
      }
    );
    return { posts: posts.map(post => this.sanitize(post)) };
  }

  async getAllPostsForAdmin() {
    const posts = await this.postRepo.find(
      { isActive: true },
      { 
        populate: ['createdBy'],
        orderBy: { createdAt: 'DESC' }
      }
    );
    return { posts: posts.map(post => this.sanitize(post)) };
  }

  async getPostById(id: number) {
    const post = await this.postRepo.findOne(
      { id, isActive: true, isPublished: true },
      { populate: ['createdBy'] }
    );
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.sanitize(post);
  }

  async updatePost(id: number, updateData: Partial<CreatePostDto>, user: User) {
    const post = await this.postRepo.findOne({ id }, { populate: ['createdBy'] });
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user has permission to update posts
    if (!this.rolePermissionsService.hasPermission(user.role, Permission.UPDATE_POST)) {
      throw new ForbiddenException('You do not have permission to update posts');
    }

    // Only allow the creator or super admin to update
    if (post.createdBy.id !== user.id && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only update your own posts');
    }

    if (updateData.title) post.title = updateData.title;
    if (updateData.content) post.content = updateData.content;
    if (updateData.isPublished !== undefined) post.isPublished = updateData.isPublished;

    await this.postRepo.getEntityManager().persistAndFlush(post);
    return this.sanitize(post);
  }

  async deletePost(id: number, user: User) {
    const post = await this.postRepo.findOne({ id }, { populate: ['createdBy'] });
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user has permission to delete posts
    if (!this.rolePermissionsService.hasPermission(user.role, Permission.DELETE_POST)) {
      throw new ForbiddenException('You do not have permission to delete posts');
    }

    // Only allow the creator or super admin to delete
    if (post.createdBy.id !== user.id && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    post.isActive = false;
    await this.postRepo.getEntityManager().persistAndFlush(post);
    return { message: 'Post deleted successfully' };
  }

  private sanitize(post: Post) {
    const { createdBy, ...rest } = post as any;
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
