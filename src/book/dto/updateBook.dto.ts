import { PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './book.dto';

export class UpdateBookDto extends PartialType(CreateBookDto) {}