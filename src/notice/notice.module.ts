import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { Notice } from './notice.entity';
import { User } from '../auth/entity/user.entity';
import { RolePermissionsService } from '../auth/role-permissions.service';

@Module({
  imports: [MikroOrmModule.forFeature([Notice, User])],
  controllers: [NoticeController],
  providers: [NoticeService, RolePermissionsService],
  exports: [NoticeService],
})
export class NoticeModule {}
