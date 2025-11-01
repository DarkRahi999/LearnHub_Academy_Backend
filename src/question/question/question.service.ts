import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CreateQuestionDto, UpdateQuestionDto } from '../dto/question.dto';
import { Question } from '../entity/question.entity';
import { SubChapter } from '../entity/subchapter.entity';

@Injectable()
export class QuestionService {
  constructor(private readonly em: EntityManager) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const subChapter = await this.em.findOne(SubChapter, { id: createQuestionDto.subChapterId });
    if (!subChapter) {
      throw new Error('SubChapter not found');
    }

    // Create the question entity with all required fields
    const questionData = {
      subChapter: subChapter,
      questionText: createQuestionDto.questionText,
      optionA: createQuestionDto.optionA,
      optionB: createQuestionDto.optionB,
      optionC: createQuestionDto.optionC,
      optionD: createQuestionDto.optionD,
      correctAnswer: createQuestionDto.correctAnswer,
      description: createQuestionDto.description,
      previousYearInfo: createQuestionDto.previousYearInfo,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const question = this.em.create(Question, questionData);

    await this.em.persistAndFlush(question);
    return question;
  }

  async findAll(): Promise<any[]> {
    const questions = await this.em.find(Question, {}, { populate: ['subChapter'] });
    // Transform questions to ensure they have subChapterId property
    return questions.map(question => ({
      id: question.id,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      description: question.description,
      previousYearInfo: question.previousYearInfo,
      subChapterId: question.subChapter.id,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    }));
  }

  async findOne(id: number): Promise<any | null> {
    const question = await this.em.findOne(Question, { id }, { populate: ['subChapter'] });
    if (question) {
      // Transform question to ensure it has subChapterId property
      return {
        id: question.id,
        questionText: question.questionText,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        correctAnswer: question.correctAnswer,
        description: question.description,
        previousYearInfo: question.previousYearInfo,
        subChapterId: question.subChapter.id,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt
      };
    }
    return null;
  }

  async update(id: number, updateQuestionDto: UpdateQuestionDto): Promise<any | null> {
    const question = await this.em.findOne(Question, { id });
    if (!question) {
      return null;
    }

    if (updateQuestionDto.subChapterId) {
      const subChapter = await this.em.findOne(SubChapter, { id: updateQuestionDto.subChapterId });
      if (!subChapter) {
        throw new Error('SubChapter not found');
      }
      question.subChapter = subChapter;
    }

    this.em.assign(question, updateQuestionDto);
    question.updatedAt = new Date();
    await this.em.flush();
    
    // Transform question to ensure it has subChapterId property
    return {
      id: question.id,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      description: question.description,
      previousYearInfo: question.previousYearInfo,
      subChapterId: question.subChapter.id,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };
  }

  async remove(id: number): Promise<boolean> {
    const question = await this.em.findOne(Question, { id });
    if (!question) {
      return false;
    }

    await this.em.removeAndFlush(question);
    return true;
  }

  async findByIds(ids: number[]): Promise<Question[]> {
    return this.em.find(Question, { id: { $in: ids } });
  }

  // New method to filter questions by course, group, subject, chapter, and subchapter
  async findFilteredQuestions(
    courseId?: number,
    groupId?: number,
    subjectId?: number,
    chapterId?: number,
    subChapterId?: number
  ): Promise<any[]> {
    // First, get all questions with their subchapters
    const questions = await this.em.find(Question, {}, { 
      populate: ['subChapter.course', 'subChapter.group', 'subChapter.subject', 'subChapter.chapter'] 
    });
    
    // Filter questions in memory based on the provided criteria
    const filteredQuestions = questions.filter(question => {
      // If no filter is specified for a level, it passes automatically
      // If a filter is specified, it must match
      const courseMatch = !courseId || question.subChapter.course.id === courseId;
      const groupMatch = !groupId || question.subChapter.group.id === groupId;
      const subjectMatch = !subjectId || question.subChapter.subject.id === subjectId;
      const chapterMatch = !chapterId || question.subChapter.chapter.id === chapterId;
      const subChapterMatch = !subChapterId || question.subChapter.id === subChapterId;
      
      return courseMatch && groupMatch && subjectMatch && chapterMatch && subChapterMatch;
    });
    
    // Transform questions to ensure they have the right structure
    return filteredQuestions.map(question => ({
      id: question.id,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      description: question.description,
      previousYearInfo: question.previousYearInfo,
      subChapterId: question.subChapter.id,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    }));
  }
}