import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ExamCourse } from './entity/course.entity';
import { Group } from './entity/group.entity';
import { Subject } from './entity/subject.entity';
import { Chapter } from './entity/chapter.entity';
import { SubChapter } from './entity/subchapter.entity';
import { Question } from './entity/question.entity';
import { CourseController } from './course/course.controller';
import { GroupController } from './group/group.controller';
import { SubjectController } from './subject/subject.controller';
import { ChapterController } from './chapter/chapter.controller';
import { SubChapterController } from './subchapter/subchapter.controller';
import { QuestionController } from './question/question.controller';
import { CourseService } from './course/course.service';
import { GroupService } from './group/group.service';
import { SubjectService } from './subject/subject.service';
import { ChapterService } from './chapter/chapter.service';
import { SubChapterService } from './subchapter/subchapter.service';
import { QuestionService } from './question/question.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ExamCourse,
      Group,
      Subject,
      Chapter,
      SubChapter,
      Question,
    ]),
  ],
  controllers: [
    CourseController,
    GroupController,
    SubjectController,
    ChapterController,
    SubChapterController,
    QuestionController,
  ],
  providers: [
    CourseService,
    GroupService,
    SubjectService,
    ChapterService,
    SubChapterService,
    QuestionService,
  ],
  exports: [
    CourseService,
    GroupService,
    SubjectService,
    ChapterService,
    SubChapterService,
    QuestionService,
  ],
})
export class QuestionManagementModule {}