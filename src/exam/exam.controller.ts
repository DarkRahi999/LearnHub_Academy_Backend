import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ValidationPipe,
  ParseIntPipe,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard, RequirePermissions } from '../auth/role.guard';
import { Permission, UserRole } from '../utils/enums';
import { QuestionCountValidationPipe } from './pipes/question-count-validation.pipe';

@ApiTags('Exams')
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.CREATE_EXAM)
  @ApiOperation({ summary: 'Create a new exam (Admin/Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Exam created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }), QuestionCountValidationPipe) createExamDto: CreateExamDto,
    @Req() req: any,
  ) {
    return this.examService.create(createExamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all exams' })
  @ApiResponse({ status: 200, description: 'Exams retrieved successfully' })
  async findAll() {
    return this.examService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exam by ID' })
  @ApiResponse({ status: 200, description: 'Exam retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
  ) {
    return this.examService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.UPDATE_EXAM)
  @ApiOperation({ summary: 'Update an exam (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Exam updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data or ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async update(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }), QuestionCountValidationPipe) updateExamDto: UpdateExamDto,
  ) {
    return this.examService.update(id, updateExamDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.DELETE_EXAM)
  @ApiOperation({ summary: 'Delete an exam (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Exam deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async remove(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
  ) {
    return this.examService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/start')
  @ApiOperation({ summary: 'Start an exam for a user' })
  @ApiResponse({ status: 200, description: 'Exam started successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async startExam(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req,
  ) {
    const userId = req.user.userId;
    return this.examService.startExam(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit exam answers' })
  @ApiResponse({ status: 200, description: 'Exam submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID or answers' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Exam already taken' })
  async submitExam(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req,
    @Body('answers') answers: { questionId: number; answer: string }[],
  ) {
    const userId = req.user.userId;
    try {
      return await this.examService.submitExam(id, userId, answers);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/practice')
  @ApiOperation({ summary: 'Submit practice exam answers' })
  @ApiResponse({ status: 200, description: 'Practice exam submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID or answers' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async submitPracticeExam(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req,
    @Body('answers') answers: { questionId: number; answer: string }[],
  ) {
    const userId = req.user.userId;
    return this.examService.submitExam(id, userId, answers, true);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/results')
  @ApiOperation({ summary: 'Get authenticated user\'s exam results' })
  @ApiResponse({ status: 200, description: 'User exam results retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  async getUserResults(@Req() req) {
    const userId = req.user.userId;
    return this.examService.getUserExamResults(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/history')
  @ApiOperation({ summary: 'Get authenticated user\'s exam history' })
  @ApiResponse({ status: 200, description: 'User exam history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  async getUserHistory(@Req() req) {
    const userId = req.user.userId;
    return this.examService.getUserExamHistory(userId);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.CREATE_EXAM)
  @Get('admin/report')
  @ApiOperation({ summary: 'Get admin report (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getAdminReport(@Req() req) {
    return this.examService.getAdminReport();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/check-attempt')
  @ApiOperation({ summary: 'Check if user has already attempted this exam' })
  @ApiResponse({ status: 200, description: 'Exam attempt check completed' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async checkExamAttempt(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req,
  ) {
    const userId = req.user.userId;
    const hasAttempted = await this.examService.checkUserExamAttempt(id, userId);
    return { hasAttempted };
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.CREATE_EXAM)
  @Get('statistics')
  @ApiOperation({ summary: 'Get exam statistics (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Exam statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getExamStatistics() {
    return this.examService.getAllExamStatistics();
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.CREATE_EXAM)
  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get specific exam statistics (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Exam statistics retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async getSpecificExamStatistics(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
  ) {
    return this.examService.getExamStatistics(id);
  }
}