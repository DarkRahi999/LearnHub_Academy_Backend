import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';
import { SystemSetting } from './entity/system-setting.entity';
import { RolePermissionsService } from '../auth/role-permissions.service';

@Module({
  imports: [MikroOrmModule.forFeature([SystemSetting])],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService, RolePermissionsService],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}