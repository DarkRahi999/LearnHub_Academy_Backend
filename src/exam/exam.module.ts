import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Exam } from './entity/exam.entity';
import { ExamResult } from './entity/exam-result.entity';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { QuestionManagementModule } from '../question/question.module';
import { AuthModule } from '../auth/auth.module';
import { QuestionCountValidationPipe } from './pipes/question-count-validation.pipe';

@Module({
  imports: [
    MikroOrmModule.forFeature([Exam, ExamResult]),
    QuestionManagementModule,
    AuthModule,
  ],
  providers: [ExamService, QuestionCountValidationPipe],
  controllers: [ExamController],
  exports: [ExamService],
})
export class ExamModule {}