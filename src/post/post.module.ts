import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './post.entity';
import { User } from '../auth/entity/user.entity';
import { RolePermissionsService } from '../auth/role-permissions.service';

@Module({
  imports: [MikroOrmModule.forFeature([Post, User])],
  controllers: [PostController],
  providers: [PostService, RolePermissionsService],
  exports: [PostService],
})
export class PostModule {}
