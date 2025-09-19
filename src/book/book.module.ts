import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { Book } from './book.entity';
import { User } from '../auth/entity/user.entity';
import { RolePermissionsService } from '../auth/role-permissions.service';

@Module({
  imports: [MikroOrmModule.forFeature([Book, User])],
  controllers: [BookController],
  providers: [BookService, RolePermissionsService],
  exports: [BookService],
})
export class BookModule {}