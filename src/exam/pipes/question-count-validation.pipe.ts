import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { QuestionService } from '../../question/question/question.service';
import { CreateExamDto } from '../dto/create-exam.dto';
import { UpdateExamDto } from '../dto/update-exam.dto';

@Injectable()
export class QuestionCountValidationPipe implements PipeTransform {
  constructor(private readonly questionService: QuestionService) {}

  async transform(value: CreateExamDto | UpdateExamDto) {
    // For update operations, questionIds might not be provided
    if ('questionIds' in value && value.questionIds) {
      const { questionIds } = value;
      
      // Check that we have question IDs
      if (!questionIds || questionIds.length === 0) {
        throw new BadRequestException('At least one question must be selected for the exam');
      }
      
      // Validate minimum question count
      if (questionIds.length < 10) {
        throw new BadRequestException('Minimum 10 questions required for an exam');
      }
      
      // For CreateExamDto, validate that question count matches totalQuestions
      if ('totalQuestions' in value && value.totalQuestions !== undefined) {
        if (questionIds.length !== value.totalQuestions) {
          throw new BadRequestException(
            `Number of selected questions (${questionIds.length}) must match total questions (${value.totalQuestions})`
          );
        }
      }
      
      // Fetch questions to verify they exist
      const questions = await this.questionService.findByIds(questionIds);
      
      // Check that all requested questions were found
      if (questions.length !== questionIds.length) {
        throw new BadRequestException('One or more selected questions do not exist');
      }
    }
    
    return value;
  }
}