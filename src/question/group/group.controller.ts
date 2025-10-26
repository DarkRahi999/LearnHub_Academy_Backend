import { Controller, Post, Body, Get, Param, ParseIntPipe, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { GroupService } from './group.service';
import { CreateGroupDto, GroupRes, UpdateGroupDto } from '../dto/group.dto';
import { Group } from '../entity/group.entity';

@ApiTags('groups')
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group successfully created.', type: GroupRes })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createGroupDto: CreateGroupDto): Promise<Group> {
    return await this.groupService.create(createGroupDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all groups' })
  @ApiResponse({ status: 200, description: 'Return all groups.', type: [GroupRes] })
  async findAll(): Promise<Group[]> {
    return await this.groupService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a group by ID' })
  @ApiResponse({ status: 200, description: 'Return the group.', type: GroupRes })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Group> {
    const group = await this.groupService.findOne(id);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a group by ID' })
  @ApiResponse({ status: 200, description: 'Group successfully updated.', type: GroupRes })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<Group> {
    const group = await this.groupService.update(id, updateGroupDto);
    if (!group) {
      throw new Error('Group not found');
    }
    return group;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a group by ID' })
  @ApiResponse({ status: 204, description: 'Group successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const result = await this.groupService.remove(id);
    if (!result) {
      throw new Error('Group not found');
    }
  }
}