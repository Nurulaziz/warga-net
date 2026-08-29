import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CashService } from './cash.service';

@ApiTags('Kas RT')
@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  // === Categories ===

  @Get('categories')
  @ApiOperation({ summary: 'Get all cash categories' })
  findAllCategories() {
    return this.cashService.findAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create cash category' })
  createCategory(@Body() body: { name: string; type: string; description?: string }) {
    return this.cashService.createCategory(body);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete cash category' })
  deleteCategory(@Param('id') id: string) {
    return this.cashService.deleteCategory(id);
  }

  // === Transactions ===

  @Get('transactions')
  @ApiOperation({ summary: 'Get cash transactions with filters' })
  findAllTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cashService.findAllTransactions({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      type,
      categoryId,
      startDate,
      endDate,
    });
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create cash transaction' })
  createTransaction(@Body() body: { categoryId: string; type: string; amount: number; description: string; date?: string; createdBy?: string }) {
    return this.cashService.createTransaction(body);
  }

  @Put('transactions/:id')
  @ApiOperation({ summary: 'Update cash transaction' })
  updateTransaction(@Param('id') id: string, @Body() body: { categoryId?: string; type?: string; amount?: number; description?: string; date?: string }) {
    return this.cashService.updateTransaction(id, body);
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: 'Delete cash transaction' })
  deleteTransaction(@Param('id') id: string) {
    return this.cashService.deleteTransaction(id);
  }

  // === Summary ===

  @Get('summary')
  @ApiOperation({ summary: 'Get cash summary (total income, expense, balance)' })
  getSummary(@Query('month') month?: string) {
    return this.cashService.getSummary(month);
  }
}
