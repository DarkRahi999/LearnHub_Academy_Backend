import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard, RequirePermissions } from '../auth/role.guard';
import { Permission } from '../utils/enums';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.CREATE_POST)
  @ApiOperation({ summary: 'Create a new post (Admin/Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async createPost(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    return this.postService.createPost(createPostDto, req.user);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all published posts' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  async getAllPosts() {
    return this.postService.getAllPosts();
  }

  @Get('admin')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.CREATE_POST)
  @ApiOperation({ summary: 'Get all posts for admin (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async getAllPostsForAdmin() {
    return this.postService.getAllPostsForAdmin();
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostById(@Param('id') id: string) {
    return this.postService.getPostById(Number(id));
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.UPDATE_POST)
  @ApiOperation({ summary: 'Update post (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async updatePost(
    @Param('id') id: string,
    @Body() updateData: Partial<CreatePostDto>,
    @Req() req: any
  ) {
    return this.postService.updatePost(Number(id), updateData, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.DELETE_POST)
  @ApiOperation({ summary: 'Delete post (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(@Param('id') id: string, @Req() req: any) {
    return this.postService.deletePost(Number(id), req.user);
  }
}
