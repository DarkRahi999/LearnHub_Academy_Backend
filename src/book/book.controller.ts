import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query, UseGuards, ValidationPipe, ParseIntPipe, HttpStatus, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/book.dto';
import { UpdateBookDto } from './dto/updateBook.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard, RequirePermissions } from '../auth/role.guard';
import { Permission } from '../utils/enums';

@ApiTags('Books')
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.CREATE_BOOK)
  @ApiOperation({ summary: 'Create a new book (Admin/Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Book created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async createBook(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) createBookDto: CreateBookDto, 
    @Req() req: any
  ) {
    return this.bookService.createBook(createBookDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active books with optional search and filters' })
  @ApiResponse({ status: 200, description: 'Books retrieved successfully' })
  async getAllBooks(
    @Query('search') search?: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('createdBy') createdBy?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const logger = new Logger('BookController');
    logger.log(`Fetching books with search: ${search}, page: ${page}, limit: ${limit}, sortBy: ${sortBy}, sortOrder: ${sortOrder}, createdBy: ${createdBy}, dateFrom: ${dateFrom}, dateTo: ${dateTo}`);
    
    // Ensure page and limit are numbers
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10)); // Limit max to 100 for performance
    
    // Validate sortOrder
    const order = sortOrder && (sortOrder.toUpperCase() === 'ASC' || sortOrder.toUpperCase() === 'DESC') 
      ? sortOrder.toUpperCase() 
      : 'DESC';
    
    // Validate sortBy
    const validSortFields = ['createdAt', 'title', 'highlight', 'price'];
    const sortField = sortBy && validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    logger.log(`Processed params - page: ${pageNum}, limit: ${limitNum}, sortField: ${sortField}, order: ${order}`);
    
    try {
      const result = await this.bookService.getAllBooks({
        search,
        page: pageNum,
        limit: limitNum,
        sortBy: sortField,
        sortOrder: order as 'ASC' | 'DESC',
        createdBy: createdBy ? Number(createdBy) : undefined,
        dateFrom,
        dateTo
      });
      logger.log(`Successfully fetched ${result.books.length} books`);
      return result;
    } catch (error) {
      logger.error('Error fetching books:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book by ID' })
  @ApiResponse({ status: 200, description: 'Book retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async getBookById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number
  ) {
    return this.bookService.getBookById(id);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.UPDATE_BOOK)
  @ApiOperation({ summary: 'Update a book (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Book updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data or ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async updateBook(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) updateBookDto: UpdateBookDto,
    @Req() req: any
  ) {
    return this.bookService.updateBook(id, updateBookDto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequirePermissions(Permission.DELETE_BOOK)
  @ApiOperation({ summary: 'Soft delete a book (Admin/Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Book soft deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Please login' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async deleteBook(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req: any
  ) {
    return this.bookService.deleteBook(id, req.user);
  }
}