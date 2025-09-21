import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/book.dto';
import { UpdateBookDto } from './dto/updateBook.dto';
import { User } from '../auth/entity/user.entity';
import { Permission, UserRole } from '../utils/enums';
import { RolePermissionsService } from 'src/auth/role-permissions.service';

@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: EntityRepository<Book>,
    private readonly rolePermissionsService: RolePermissionsService,
  ) { }

  async createBook(createBookDto: CreateBookDto, userFromJwt: any) {
    const em = this.bookRepository.getEntityManager().fork();
    try {
      // Fetch the complete user from database using the JWT user info
      const user = await em.findOne(User, { id: parseInt(userFromJwt.userId) });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      // Check if user has permission to create books
      if (!this.rolePermissionsService.hasPermission(user.role, Permission.CREATE_BOOK)) {
        throw new ForbiddenException('You do not have permission to create books');
      }

      // Validate input data (these validations are also handled by DTO validators)
      if (!createBookDto.title || createBookDto.title.trim().length < 5) {
        throw new BadRequestException('Title must be at least 5 characters long');
      }
      if (!createBookDto.description || createBookDto.description.trim().length < 10) {
        throw new BadRequestException('Description must be at least 10 characters long');
      }
      if (!createBookDto.highlight || createBookDto.highlight.trim().length < 5) {
        throw new BadRequestException('Highlight must be at least 5 characters long');
      }
      if (createBookDto.price < 0) {
        throw new BadRequestException('Price must be greater than or equal to 0');
      }

      // Create the book entity with user reference
      const book = em.create(Book, {
        title: createBookDto.title.trim(),
        description: createBookDto.description.trim(),
        highlight: createBookDto.highlight.trim(),
        imageUrl: createBookDto.imageUrl?.trim(),
        price: createBookDto.price,
        discountPrice: createBookDto.discountPrice,
        isActive: true,
        createdAt: new Date(),
        createdBy: user // Reference the user entity directly
      });
      
      // Persist to database
      await em.persistAndFlush(book);

      // Reload with relations for response
      const savedBook = await em.findOne(Book, { id: book.id }, { populate: ['createdBy'] });

      this.logger.log(`Book created successfully with ID: ${savedBook!.id}`);
      return savedBook;
    } catch (error) {
      this.logger.error(`Error creating book: ${error.message}`, error.stack);

      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }

      // Handle database specific errors
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('A book with similar content already exists');
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw new BadRequestException('Invalid user reference');
      }
      if (error.code === '23514') { // Check constraint violation
        throw new BadRequestException('Book data does not meet validation requirements');
      }

      throw new BadRequestException('Failed to create book. Please try again.');
    }
  }

  async getAllBooks(options: {
    search?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    createdBy?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ books: any[], total: number, page: number, totalPages: number }> {
    try {
      // Using repository find method instead of query builder
      const where: any = { isActive: true };

      // Apply search filter
      if (options.search) {
        where.$or = [
          { title: { $ilike: `%${options.search}%` } },
          { description: { $ilike: `%${options.search}%` } },
          { highlight: { $ilike: `%${options.search}%` } },
        ];
      }

      // Apply createdBy filter
      if (options.createdBy) {
        where.createdBy = options.createdBy;
      }

      // Apply date range filters
      if (options.dateFrom || options.dateTo) {
        where.createdAt = {};
        if (options.dateFrom) {
          where.createdAt.$gte = new Date(options.dateFrom);
        }
        if (options.dateTo) {
          where.createdAt.$lte = new Date(options.dateTo);
        }
      }

      // Set default sort options
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || 'DESC';

      const [books, total] = await this.bookRepository.findAndCount(where, {
        orderBy: { [sortBy]: sortOrder },
        limit: options.limit,
        offset: (options.page - 1) * options.limit,
        populate: ['createdBy'] // Populate the createdBy field
      });

      // Serialize books to match frontend expectations
      const serializedBooks = books.map(book => ({
        id: book.id,
        title: book.title,
        description: book.description,
        highlight: book.highlight,
        imageUrl: book.imageUrl,
        price: book.price,
        discountPrice: book.discountPrice,
        isActive: book.isActive,
        createdAt: book.createdAt.toISOString(),
        editedAt: book.editedAt ? book.editedAt.toISOString() : undefined,
        createdBy: {
          id: book.createdBy.id,
          firstName: book.createdBy.firstName || '',
          lastName: book.createdBy.lastName || ''
        }
      }));

      return {
        books: serializedBooks,
        total,
        page: options.page,
        totalPages: Math.ceil(total / options.limit) || 0 // Ensure totalPages is 0 if total is 0
      };
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  async getBookById(id: number): Promise<any> {
    const book = await this.bookRepository.findOne(
      { id, isActive: true },
      { populate: ['createdBy'] }
    );
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Serialize book to match frontend expectations
    return {
      id: book.id,
      title: book.title,
      description: book.description,
      highlight: book.highlight,
      imageUrl: book.imageUrl,
      price: book.price,
      discountPrice: book.discountPrice,
      isActive: book.isActive,
      createdAt: book.createdAt.toISOString(),
      editedAt: book.editedAt ? book.editedAt.toISOString() : undefined,
      createdBy: {
        id: book.createdBy.id,
        firstName: book.createdBy.firstName || '',
        lastName: book.createdBy.lastName || ''
      }
    };
  }

  async updateBook(id: number, updateBookDto: UpdateBookDto, user: User): Promise<any> {
    const book = await this.bookRepository.findOne(
      { id, isActive: true },
      { populate: ['createdBy'] }
    );

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Check if user is the creator or has admin rights
    if (book.createdBy.id !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to update this book');
    }

    this.bookRepository.assign(book, updateBookDto);
    await this.bookRepository.getEntityManager().flush();

    // Serialize book to match frontend expectations
    return {
      id: book.id,
      title: book.title,
      description: book.description,
      highlight: book.highlight,
      imageUrl: book.imageUrl,
      price: book.price,
      discountPrice: book.discountPrice,
      isActive: book.isActive,
      createdAt: book.createdAt.toISOString(),
      editedAt: book.editedAt ? book.editedAt.toISOString() : undefined,
      createdBy: {
        id: book.createdBy.id,
        firstName: book.createdBy.firstName || '',
        lastName: book.createdBy.lastName || ''
      }
    };
  }

  async deleteBook(id: number, user: User): Promise<void> {
    const book = await this.bookRepository.findOne(
      { id, isActive: true },
      { populate: ['createdBy'] }
    );

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Check if user is the creator or has admin rights
    if (book.createdBy.id !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this book');
    }

    book.isActive = false;
    await this.bookRepository.getEntityManager().flush();
  }
}