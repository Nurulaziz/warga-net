import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LettersService } from './letters.service';

@ApiTags('Letters')
@Controller('letters')
export class LettersController {
  constructor(private readonly lettersService: LettersService) {}

  // === Templates ===

  @Get('templates')
  @ApiOperation({ summary: 'Get all letter templates' })
  findAllTemplates() {
    return this.lettersService.findAllTemplates();
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create letter template' })
  createTemplate(@Body() body: { name: string; type: string; content: string; description?: string }) {
    return this.lettersService.createTemplate(body);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update letter template' })
  updateTemplate(@Param('id') id: string, @Body() body: { name?: string; type?: string; content?: string; description?: string; isActive?: boolean }) {
    return this.lettersService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Deactivate letter template' })
  deleteTemplate(@Param('id') id: string) {
    return this.lettersService.deleteTemplate(id);
  }

  // === Letters ===

  @Get()
  @ApiOperation({ summary: 'Get all letters' })
  findAllLetters(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string, @Query('templateId') templateId?: string) {
    return this.lettersService.findAllLetters({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      templateId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get letter by ID' })
  findOne(@Param('id') id: string) {
    return this.lettersService.findOneLetter(id);
  }

  @Get(':id/html')
  @ApiOperation({ summary: 'Get letter as printable HTML' })
  async getHtml(@Param('id') id: string, @Res() res: any) {
    const html = await this.lettersService.getLetterHtml(id);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Post()
  @ApiOperation({ summary: 'Generate a letter from template' })
  generate(@Body() body: { templateId: string; residentId?: string; recipientName: string; purpose?: string; variables?: Record<string, string>; createdBy?: string }) {
    return this.lettersService.generateLetter(body);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update letter status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.lettersService.updateLetterStatus(id, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete letter' })
  remove(@Param('id') id: string) {
    return this.lettersService.deleteLetter(id);
  }
}
