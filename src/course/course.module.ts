import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { Course } from './course.entity';
import { User } from '../auth/entity/user.entity';
import { RolePermissionsService } from '../auth/role-permissions.service';

@Module({
  imports: [MikroOrmModule.forFeature([Course, User])],
  controllers: [CourseController],
  providers: [CourseService, RolePermissionsService],
  exports: [CourseService],
})
export class CourseModule {}