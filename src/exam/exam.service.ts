import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Exam } from './entity/exam.entity';
import { ExamResult } from './entity/exam-result.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { QuestionService } from '../question/question/question.service';
import { Question } from '../question/entity/question.entity';

@Injectable()
export class ExamService {
  constructor(
    private readonly em: EntityManager,
    private questionService: QuestionService,
  ) {}

  async findAll(): Promise<Exam[]> {
    return this.em.find(Exam, {}, { populate: ['questions'] });
  }

  async findOne(id: number): Promise<Exam> {
    const exam = await this.em.findOne(Exam, { id }, { populate: ['questions'] });
    
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    
    return exam;
  }

  async create(createExamDto: CreateExamDto): Promise<Exam> {
    const { questionIds, totalQuestions, examDate, startTime, endTime, ...examData } = createExamDto;
    
    // Validate that the number of selected questions matches the expected total
    if (questionIds.length !== totalQuestions) {
      throw new BadRequestException(
        `Number of selected questions (${questionIds.length}) does not match the expected total (${totalQuestions})`
      );
    }
    
    // Fetch questions by IDs
    const questions = await this.questionService.findByIds(questionIds);
    
    // Validate that all questions were found
    if (questions.length !== questionIds.length) {
      throw new BadRequestException('One or more selected questions do not exist');
    }
    
    const exam = new Exam();
    exam.name = examData.name;
    exam.description = examData.description || '';
    exam.examDate = examDate;
    exam.startTime = startTime;
    exam.endTime = endTime;
    exam.duration = examData.duration;
    exam.questions.set(questions);
    exam.totalQuestions = totalQuestions;
    exam.isActive = examData.isActive ?? true;
    exam.createdAt = new Date();
    exam.updatedAt = new Date();
    
    await this.em.persistAndFlush(exam);
    return exam;
  }

  async update(id: number, updateExamDto: UpdateExamDto): Promise<Exam> {
    const exam = await this.findOne(id);
    
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    
    // If questionIds are provided, fetch questions and validate
    if (updateExamDto.questionIds) {
      // If totalQuestions is also provided, validate the count
      if (updateExamDto.totalQuestions !== undefined) {
        if (updateExamDto.questionIds.length !== updateExamDto.totalQuestions) {
          throw new BadRequestException(
            `Number of selected questions (${updateExamDto.questionIds.length}) does not match the expected total (${updateExamDto.totalQuestions})`
          );
        }
      }
      
      const questions = await this.questionService.findByIds(updateExamDto.questionIds);
      
      // Validate that all questions were found
      if (questions.length !== updateExamDto.questionIds.length) {
        throw new BadRequestException('One or more selected questions do not exist');
      }
      
      exam.questions.set(questions);
      exam.totalQuestions = updateExamDto.totalQuestions ?? updateExamDto.questionIds.length;
    } else if (updateExamDto.totalQuestions !== undefined) {
      // If only totalQuestions is updated without questionIds, validate it matches current questions
      if (exam.questions.getItems().length !== updateExamDto.totalQuestions) {
        throw new BadRequestException(
          `Cannot update totalQuestions to ${updateExamDto.totalQuestions} as it does not match the current number of questions (${exam.questions.getItems().length})`
        );
      }
      exam.totalQuestions = updateExamDto.totalQuestions;
    }
    
    if (updateExamDto.name !== undefined) exam.name = updateExamDto.name;
    if (updateExamDto.description !== undefined) exam.description = updateExamDto.description;
    if (updateExamDto.examDate !== undefined) exam.examDate = updateExamDto.examDate;
    if (updateExamDto.startTime !== undefined) exam.startTime = updateExamDto.startTime;
    if (updateExamDto.endTime !== undefined) exam.endTime = updateExamDto.endTime;
    if (updateExamDto.duration !== undefined) exam.duration = updateExamDto.duration;
    if (updateExamDto.isActive !== undefined) exam.isActive = updateExamDto.isActive;
    
    exam.updatedAt = new Date();
    await this.em.flush();
    
    return exam;
  }

  async remove(id: number): Promise<void> {
    const exam = await this.findOne(id);
    
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    
    await this.em.removeAndFlush(exam);
  }

  async startExam(examId: number, userId: number): Promise<{ success: boolean; message: string }> {
    const exam = await this.findOne(examId);
    
    // Check if exam is active
    if (!exam.isActive) {
      return { success: false, message: 'Exam is not active' };
    }
    
    // Check if current time is within exam window
    const now = new Date();
    const examDateTimeStart = new Date(exam.examDate);
    const [startHours, startMinutes] = exam.startTime.split(':').map(Number);
    examDateTimeStart.setHours(startHours, startMinutes, 0, 0);
    
    const examDateTimeEnd = new Date(exam.examDate);
    const [endHours, endMinutes] = exam.endTime.split(':').map(Number);
    examDateTimeEnd.setHours(endHours, endMinutes, 0, 0);
    
    if (now < examDateTimeStart || now > examDateTimeEnd) {
      return { success: false, message: 'Exam is not available at this time' };
    }
    
    // In a real implementation, you would check if user has already started this exam
    // and create an exam session record
    
    return { success: true, message: 'Exam started successfully' };
  }

  async submitExam(
    examId: number, 
    userId: number, 
    answers: { questionId: number; answer: string }[],
    isPractice: boolean = false
  ): Promise<any> {
    const exam = await this.findOne(examId);
    
    // Check if user has already taken this exam (only for real exams, not practice)
    if (!isPractice) {
      const existingResult = await this.em.findOne(ExamResult, { 
        user: userId, 
        exam: examId, 
        isPractice: false 
      });
      
      if (existingResult) {
        throw new ConflictException('You have already taken this exam');
      }
    }
    
    // Create a map of submitted answers for easier lookup
    const answerMap = new Map(answers.map(a => [a.questionId, a.answer]));
    
    // Grade the answers - check all questions in the exam, not just submitted answers
    let correctAnswers = 0;
    const totalQuestions = exam.questions.getItems().length;
    
    // For each question in the exam, check if the user's answer is correct
    exam.questions.getItems().forEach(question => {
      const userAnswer = answerMap.get(question.id);
      // If user didn't answer, it's considered incorrect
      if (userAnswer && userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Store the results (only for real exams, not practice)
    if (!isPractice) {
      const result = new ExamResult();
      result.user = userId as any;
      result.exam = examId as any;
      result.score = correctAnswers;
      result.totalQuestions = totalQuestions;
      result.correctAnswers = correctAnswers;
      result.percentage = percentage;
      result.passed = percentage >= 50;
      result.answers = exam.questions.getItems().map(question => {
        const userAnswer = answerMap.get(question.id) || "";
        return {
          questionId: question.id,
          userAnswer: userAnswer,
          correctAnswer: question.correctAnswer
        };
      });
      result.isPractice = false;
      result.submittedAt = new Date();
      
      await this.em.persistAndFlush(result);
    }
    
    return {
      examId,
      userId,
      correctAnswers,
      totalQuestions,
      percentage,
      passed: percentage >= 50,
      answers: exam.questions.getItems().map(question => {
        const userAnswer = answerMap.get(question.id) || "";
        return {
          questionId: question.id,
          userAnswer: userAnswer,
          correctAnswer: question.correctAnswer
        };
      }),
      isPractice
    };
  }
  
  async getUserExamResults(userId: number): Promise<ExamResult[]> {
    return this.em.find(ExamResult, { user: userId, isPractice: false }, { populate: ['exam'] });
  }
  
  async getExamStatistics(examId: number): Promise<any> {
    const results = await this.em.find(ExamResult, { exam: examId, isPractice: false });
    
    if (results.length === 0) {
      return {
        examId,
        totalParticipants: 0,
        averageScore: 0,
        passRate: 0,
        highestScore: 0,
        lowestScore: 0
      };
    }
    
    const totalScores = results.reduce((sum, result) => sum + result.score, 0);
    const passedCount = results.filter(r => r.percentage >= 50).length;
    const scores = results.map(r => r.score);
    
    return {
      examId,
      totalParticipants: results.length,
      averageScore: Math.round(totalScores / results.length),
      passRate: Math.round((passedCount / results.length) * 100),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores)
    };
  }
  
  async getAllExamStatistics(): Promise<any[]> {
    const exams = await this.findAll();
    const statistics: any[] = [];
    
    for (const exam of exams) {
      const stats = await this.getExamStatistics(exam.id);
      statistics.push({
        ...stats,
        examName: exam.name
      });
    }
    
    return statistics;
  }
  
  async getUserExamHistory(userId: number): Promise<any[]> {
    const results = await this.em.find(ExamResult, { 
      user: userId, 
      isPractice: false 
    }, { 
      populate: ['exam'],
      orderBy: { submittedAt: 'DESC' }
    });
    
    // Map the results to include examName and recalculate passed status based on new threshold
    return results.map(result => ({
      ...result,
      examName: result.exam.name,
      passed: result.percentage >= 50
    }));
  }
  
  async getAdminReport(): Promise<any> {
    const totalExams = await this.em.count(Exam);
    const totalResults = await this.em.count(ExamResult, { isPractice: false });
    const totalUsers = await this.em.count('User');
    
    // Get recent exam results
    const recentResults = await this.em.find(ExamResult, { isPractice: false }, {
      populate: ['user', 'exam'],
      orderBy: { submittedAt: 'DESC' },
      limit: 10
    });
    
    // Get exam statistics
    const examStats = await this.getAllExamStatistics();
    
    return {
      totalExams,
      totalResults,
      totalUsers,
      recentResults: recentResults.map(result => ({
        id: result.id,
        user: result.user.id,  // Add user ID
        userName: `${result.user.firstName} ${result.user.lastName}`,
        examName: result.exam.name,
        score: result.score,
        percentage: result.percentage,
        passed: result.percentage >= 50,
        submittedAt: result.submittedAt
      })),
      examStats
    };
  }
  
  async checkUserExamAttempt(examId: number, userId: number): Promise<boolean> {
    const existingResult = await this.em.findOne(ExamResult, { 
      user: userId, 
      exam: examId, 
      isPractice: false 
    });
    
    return !!existingResult;
  }
  
  async getExamParticipationData(): Promise<any> {
    // Get all exam results with user and exam data
    const allResults = await this.em.find(ExamResult, { isPractice: false }, {
      populate: ['user', 'exam'],
      orderBy: { submittedAt: 'DESC' }
    });
    
    // Group results by exam
    const examParticipation: any = {};
    
    for (const result of allResults) {
      const examId = result.exam.id;
      
      if (!examParticipation[examId]) {
        examParticipation[examId] = {
          examId: examId,
          examName: result.exam.name,
          totalParticipants: 0,
          participants: []
        };
      }
      
      examParticipation[examId].totalParticipants += 1;
      examParticipation[examId].participants.push({
        userId: result.user.id,
        userName: `${result.user.firstName} ${result.user.lastName}`,
        score: result.score,
        percentage: result.percentage,
        passed: result.percentage >= 50,
        submittedAt: result.submittedAt
      });
    }
    
    return Object.values(examParticipation);
  }
}