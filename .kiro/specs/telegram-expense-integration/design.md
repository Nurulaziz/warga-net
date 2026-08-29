# Design Document - Telegram Expense Integration

## Overview

Integrasi Telegram bot untuk WargaNet menggunakan library `node-telegram-bot-api` yang merupakan wrapper untuk Telegram Bot API. Bot akan berjalan sebagai long-polling service di dalam NestJS application, menggunakan existing ExpensesService untuk business logic, dan menyimpan authentication state di Redis untuk persistence.

**Key Design Decisions:**
- **Library Choice**: `node-telegram-bot-api` - mature, well-documented, supports TypeScript
- **Polling Strategy**: Long polling (simpler deployment, no webhook setup needed)
- **Authentication Storage**: Redis (fast, supports TTL for auto-expiry)
- **Command Pattern**: Interactive conversation flow dengan inline keyboards
- **Integration Approach**: Reuse existing ExpensesService (no duplicate business logic)

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Telegram User  │
└────────┬────────┘
         │ Commands
         ▼
┌─────────────────────────────────────────┐
│         Telegram Bot API                │
└────────┬────────────────────────────────┘
         │ Long Polling
         ▼
┌─────────────────────────────────────────┐
│      TelegramBotService (NestJS)        │
│  ┌───────────────────────────────────┐  │
│  │  Command Handlers                 │  │
│  │  - /start, /expense, /categories  │  │
│  │  - /help, /logout                 │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Conversation State Manager       │  │
│  │  (Redis-backed)                   │  │
│  └───────────────────────────────────┘  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│    TelegramAuthService                  │
│  - Phone verification                   │
│  - User mapping (Telegram ↔ WargaNet)  │
│  - Session management                   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      ExpensesService (Existing)         │
│  - recordExpense()                      │
│  - getExpenseCategories()               │
│  - validateExpenseAmount()              │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Database (PostgreSQL)           │
│  - expenses table                       │
│  - expense_categories table             │
│  - users table                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           Redis Cache                   │
│  - telegram_auth:{telegramId}           │
│  - telegram_conversation:{telegramId}   │
└─────────────────────────────────────────┘
```

### Module Structure

```
src/
├── telegram/
│   ├── telegram.module.ts
│   ├── telegram-bot.service.ts          # Main bot service
│   ├── telegram-auth.service.ts         # Authentication logic
│   ├── telegram-conversation.service.ts # Conversation state management
│   ├── telegram-file.service.ts         # File upload/download handling
│   ├── handlers/
│   │   ├── start.handler.ts             # /start command
│   │   ├── expense.handler.ts           # /expense command
│   │   ├── categories.handler.ts        # /categories command
│   │   ├── help.handler.ts              # /help command
│   │   └── logout.handler.ts            # /logout command
│   ├── dto/
│   │   ├── telegram-user.dto.ts
│   │   ├── conversation-state.dto.ts
│   │   └── file-metadata.dto.ts
│   └── interfaces/
│       ├── telegram-message.interface.ts
│       ├── bot-command.interface.ts
│       └── file-storage.interface.ts
```

## Components and Interfaces

### 1. TelegramBotService

**Responsibility**: Initialize bot, register command handlers, manage bot lifecycle

```typescript
interface TelegramBotService {
  // Lifecycle
  onModuleInit(): Promise<void>;
  onModuleDestroy(): Promise<void>;
  
  // Bot management
  startBot(): Promise<void>;
  stopBot(): Promise<void>;
  getHealthStatus(): BotHealthStatus;
  
  // Message handling
  sendMessage(chatId: number, text: string, options?: SendMessageOptions): Promise<void>;
  sendInlineKeyboard(chatId: number, text: string, buttons: InlineButton[][]): Promise<void>;
  
  // Command registration
  registerCommandHandler(command: string, handler: CommandHandler): void;
}

interface BotHealthStatus {
  isRunning: boolean;
  lastPollTime: Date;
  totalCommands: number;
  successRate: number;
  errorRate: number;
}

interface SendMessageOptions {
  parseMode?: 'Markdown' | 'HTML';
  replyMarkup?: any;
}

interface InlineButton {
  text: string;
  callbackData: string;
}

type CommandHandler = (message: TelegramMessage, user: AuthenticatedUser | null) => Promise<void>;
```

### 2. TelegramAuthService

**Responsibility**: Handle user authentication, manage Telegram ↔ WargaNet user mapping

```typescript
interface TelegramAuthService {
  // Authentication
  startAuthentication(telegramId: number, chatId: number): Promise<void>;
  verifyPhoneNumber(telegramId: number, phoneNumber: string): Promise<AuthResult>;
  logout(telegramId: number): Promise<void>;
  
  // User mapping
  getAuthenticatedUser(telegramId: number): Promise<AuthenticatedUser | null>;
  isAuthenticated(telegramId: number): Promise<boolean>;
  
  // Session management
  refreshSession(telegramId: number): Promise<void>;
  cleanupInactiveSessions(): Promise<number>;
}

interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

interface AuthenticatedUser {
  userId: string;
  telegramId: number;
  phoneNumber: string;
  fullName: string;
  role: string;
  authenticatedAt: Date;
}
```

### 3. TelegramConversationService

**Responsibility**: Manage conversation state for multi-step interactions

```typescript
interface TelegramConversationService {
  // State management
  startConversation(telegramId: number, type: ConversationType): Promise<void>;
  getConversationState(telegramId: number): Promise<ConversationState | null>;
  updateConversationState(telegramId: number, data: Partial<ConversationState>): Promise<void>;
  endConversation(telegramId: number): Promise<void>;
  
  // Validation
  isInConversation(telegramId: number): Promise<boolean>;
}

enum ConversationType {
  EXPENSE_RECORDING = 'EXPENSE_RECORDING',
  AUTHENTICATION = 'AUTHENTICATION',
}

interface ConversationState {
  type: ConversationType;
  step: string;
  data: Record<string, any>;
  startedAt: Date;
  expiresAt: Date;
}

// Example conversation state for expense recording:
interface ExpenseConversationData {
  categoryId?: string;
  categoryName?: string;
  amount?: number;
  description?: string;
  receiptFileId?: string;
  receiptUploaded?: boolean;
}
```

### 4. File Storage Service

**Responsibility**: Handle receipt image upload, storage, and retrieval

```typescript
interface TelegramFileService {
  // File handling
  downloadFile(fileId: string): Promise<Buffer>;
  uploadToStorage(buffer: Buffer, metadata: FileMetadata): Promise<string>;
  getFileUrl(fileKey: string): Promise<string>;
  deleteFile(fileKey: string): Promise<void>;
  
  // Validation
  validateImageFile(file: TelegramFile): ValidationResult;
}

interface FileMetadata {
  expenseId?: string;
  telegramUserId: number;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
}

interface TelegramFile {
  fileId: string;
  fileSize: number;
  mimeType: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

**Storage Strategy:**
- **Development**: Local filesystem (`apps/backend/uploads/receipts/`)
- **Production**: Cloud storage (AWS S3 / Google Cloud Storage / Azure Blob)
- **File naming**: `{expenseId}_{timestamp}_{random}.{ext}`
- **Max file size**: 5MB
- **Allowed formats**: JPG, JPEG, PNG, PDF

### 5. Command Handlers

#### StartHandler

```typescript
class StartHandler {
  async handle(message: TelegramMessage, user: AuthenticatedUser | null): Promise<void> {
    if (user) {
      // Already authenticated
      await this.botService.sendMessage(
        message.chatId,
        `Halo ${user.fullName}! Anda sudah terautentikasi.\n\n` +
        `Gunakan /help untuk melihat perintah yang tersedia.`
      );
    } else {
      // Start authentication
      await this.authService.startAuthentication(message.telegramId, message.chatId);
      await this.botService.sendMessage(
        message.chatId,
        `Selamat datang di WargaNet Bot!\n\n` +
        `Untuk menggunakan bot ini, Anda harus terautentikasi terlebih dahulu.\n\n` +
        `Silakan kirim nomor telepon Anda yang terdaftar di WargaNet (format: +628xxx)`
      );
    }
  }
}
```

#### ExpenseHandler

```typescript
class ExpenseHandler {
  async handle(message: TelegramMessage, user: AuthenticatedUser | null): Promise<void> {
    // Check authentication
    if (!user) {
      await this.botService.sendMessage(
        message.chatId,
        'Anda harus terautentikasi terlebih dahulu. Gunakan /start untuk memulai.'
      );
      return;
    }
    
    // Check authorization
    if (!['ADMIN_BENDAHARA', 'ADMIN_RT', 'SUPER_ADMIN'].includes(user.role)) {
      await this.botService.sendMessage(
        message.chatId,
        'Maaf, Anda tidak memiliki izin untuk mencatat pengeluaran.'
      );
      return;
    }
    
    // Start expense recording conversation
    await this.conversationService.startConversation(
      message.telegramId,
      ConversationType.EXPENSE_RECORDING
    );
    
    // Fetch categories
    const categories = await this.expensesService.getExpenseCategories();
    
    if (categories.length === 0) {
      await this.botService.sendMessage(
        message.chatId,
        'Tidak ada kategori pengeluaran aktif. Silakan buat kategori melalui web app terlebih dahulu.'
      );
      await this.conversationService.endConversation(message.telegramId);
      return;
    }
    
    // Show categories as inline keyboard
    const buttons = categories.map(cat => [{
      text: cat.name,
      callbackData: `expense_category_${cat.id}`
    }]);
    
    await this.botService.sendInlineKeyboard(
      message.chatId,
      'Pilih kategori pengeluaran:',
      buttons
    );
  }
  
  async handleCategorySelection(
    callbackQuery: CallbackQuery,
    user: AuthenticatedUser
  ): Promise<void> {
    const categoryId = callbackQuery.data.replace('expense_category_', '');
    
    // Update conversation state
    await this.conversationService.updateConversationState(
      callbackQuery.from.id,
      {
        step: 'AMOUNT_INPUT',
        data: { categoryId }
      }
    );
    
    await this.botService.sendMessage(
      callbackQuery.message.chatId,
      'Masukkan jumlah pengeluaran (dalam rupiah, contoh: 100000):'
    );
  }
  
  async handleAmountInput(
    message: TelegramMessage,
    user: AuthenticatedUser,
    state: ConversationState
  ): Promise<void> {
    const amount = parseFloat(message.text);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      await this.botService.sendMessage(
        message.chatId,
        'Jumlah tidak valid. Masukkan angka positif (contoh: 100000):'
      );
      return;
    }
    
    // Validate balance
    const validation = await this.expensesService.validateExpenseAmount(amount);
    if (!validation.valid) {
      await this.botService.sendMessage(
        message.chatId,
        `Saldo tidak mencukupi!\n\n` +
        `Saldo saat ini: Rp ${validation.currentBalance.toLocaleString()}\n` +
        `Jumlah yang diminta: Rp ${amount.toLocaleString()}\n\n` +
        `Silakan masukkan jumlah yang lebih kecil atau batalkan dengan /cancel`
      );
      return;
    }
    
    // Update conversation state
    await this.conversationService.updateConversationState(
      message.telegramId,
      {
        step: 'DESCRIPTION_INPUT',
        data: { ...state.data, amount }
      }
    );
    
    await this.botService.sendMessage(
      message.chatId,
      'Masukkan deskripsi pengeluaran:'
    );
  }
  
  async handleDescriptionInput(
    message: TelegramMessage,
    user: AuthenticatedUser,
    state: ConversationState
  ): Promise<void> {
    const description = message.text.trim();
    
    if (description.length === 0) {
      await this.botService.sendMessage(
        message.chatId,
        'Deskripsi tidak boleh kosong. Silakan masukkan deskripsi:'
      );
      return;
    }
    
    // Update conversation state with description
    await this.conversationService.updateConversationState(
      message.telegramId,
      {
        step: 'RECEIPT_UPLOAD',
        data: { ...state.data, description }
      }
    );
    
    // Ask for receipt photo (optional)
    const buttons = [
      [{ text: '📷 Upload Struk/Kwitansi', callbackData: 'expense_upload_receipt' }],
      [{ text: '⏭️ Lewati (Tanpa Struk)', callbackData: 'expense_skip_receipt' }]
    ];
    
    await this.botService.sendInlineKeyboard(
      message.chatId,
      'Apakah Anda ingin mengupload foto struk/kwitansi?',
      buttons
    );
  }
  
  async handleReceiptUploadChoice(
    callbackQuery: CallbackQuery,
    user: AuthenticatedUser,
    state: ConversationState
  ): Promise<void> {
    if (callbackQuery.data === 'expense_skip_receipt') {
      // Record expense without receipt
      await this.recordExpense(callbackQuery.message.chatId, user, state, null);
    } else {
      // Wait for photo upload
      await this.botService.sendMessage(
        callbackQuery.message.chatId,
        '📷 Silakan kirim foto struk/kwitansi Anda.\n\n' +
        'Format yang didukung: JPG, PNG, PDF\n' +
        'Ukuran maksimal: 5MB\n\n' +
        'Atau ketik /skip untuk melewati.'
      );
    }
  }
  
  async handleReceiptPhoto(
    message: TelegramMessage,
    user: AuthenticatedUser,
    state: ConversationState
  ): Promise<void> {
    // Get photo file
    const photo = message.photo?.[message.photo.length - 1]; // Get highest resolution
    const document = message.document; // For PDF files
    
    if (!photo && !document) {
      await this.botService.sendMessage(
        message.chatId,
        '❌ File tidak valid. Silakan kirim foto atau PDF, atau ketik /skip untuk melewati.'
      );
      return;
    }
    
    const file = photo || document;
    
    // Validate file
    const validation = await this.fileService.validateImageFile(file);
    if (!validation.valid) {
      await this.botService.sendMessage(
        message.chatId,
        `❌ ${validation.error}\n\nSilakan kirim file yang valid atau ketik /skip untuk melewati.`
      );
      return;
    }
    
    // Download file from Telegram
    await this.botService.sendMessage(
      message.chatId,
      '⏳ Mengupload struk...'
    );
    
    try {
      const fileBuffer = await this.fileService.downloadFile(file.fileId);
      
      // Record expense with receipt
      await this.recordExpense(message.chatId, user, state, fileBuffer);
      
    } catch (error) {
      await this.botService.sendMessage(
        message.chatId,
        `❌ Gagal mengupload struk: ${error.message}\n\n` +
        `Pengeluaran akan dicatat tanpa struk.`
      );
      
      // Record without receipt
      await this.recordExpense(message.chatId, user, state, null);
    }
  }
  
  private async recordExpense(
    chatId: number,
    user: AuthenticatedUser,
    state: ConversationState,
    receiptBuffer: Buffer | null
  ): Promise<void> {
    try {
      // Record expense
      const expense = await this.expensesService.recordExpense(
        {
          categoryId: state.data.categoryId,
          amount: state.data.amount,
          description: state.data.description,
          notes: `Dicatat via Telegram Bot oleh ${user.fullName}`
        },
        user.userId
      );
      
      // Upload receipt if provided
      let receiptUrl: string | null = null;
      if (receiptBuffer) {
        const fileKey = await this.fileService.uploadToStorage(receiptBuffer, {
          expenseId: expense.id,
          telegramUserId: user.telegramId,
          originalFileName: `receipt_${expense.id}`,
          mimeType: 'image/jpeg',
          fileSize: receiptBuffer.length,
          uploadedAt: new Date()
        });
        
        receiptUrl = await this.fileService.getFileUrl(fileKey);
        
        // Update expense with receipt URL
        await this.expensesService.updateExpenseReceipt(expense.id, receiptUrl);
      }
      
      // Send confirmation
      await this.botService.sendMessage(
        chatId,
        `✅ Pengeluaran berhasil dicatat!\n\n` +
        `ID: ${expense.id}\n` +
        `Kategori: ${expense.category.name}\n` +
        `Jumlah: Rp ${expense.amount.toLocaleString()}\n` +
        `Deskripsi: ${expense.description}\n` +
        `Waktu: ${expense.createdAt.toLocaleString('id-ID')}\n` +
        (receiptUrl ? `📷 Struk: Tersimpan\n` : '') +
        `\nGunakan /expense untuk mencatat pengeluaran lagi.`
      );
      
      // End conversation
      await this.conversationService.endConversation(user.telegramId);
      
    } catch (error) {
      await this.botService.sendMessage(
        chatId,
        `❌ Gagal mencatat pengeluaran: ${error.message}\n\n` +
        `Silakan coba lagi dengan /expense`
      );
      await this.conversationService.endConversation(user.telegramId);
    }
  }
}
```

## Data Models

### Redis Data Structures

#### Authentication Mapping

```
Key: telegram_auth:{telegramId}
Value: JSON string
TTL: 30 days (2592000 seconds)

{
  "userId": "uuid",
  "phoneNumber": "+628123456789",
  "fullName": "John Doe",
  "role": "ADMIN_BENDAHARA",
  "authenticatedAt": "2024-01-15T10:30:00Z",
  "lastActivityAt": "2024-01-15T14:20:00Z"
}
```

#### Conversation State

```
Key: telegram_conversation:{telegramId}
Value: JSON string
TTL: 10 minutes (600 seconds)

{
  "type": "EXPENSE_RECORDING",
  "step": "AMOUNT_INPUT",
  "data": {
    "categoryId": "uuid",
    "categoryName": "Kebersihan"
  },
  "startedAt": "2024-01-15T14:20:00Z"
}
```

### Database Schema (No Changes)

Menggunakan existing tables:
- `users` - untuk validasi phone number dan role
- `expenses` - untuk menyimpan expense records
- `expense_categories` - untuk kategori pengeluaran
- `audit_logs` - untuk audit trail

**Note**: Perlu menambahkan kolom `receiptUrl` ke tabel `expenses` untuk menyimpan URL/path file struk:

```sql
ALTER TABLE expenses ADD COLUMN receipt_url VARCHAR(500) NULL;
```

Atau jika menggunakan Prisma schema:

```prisma
model Expense {
  id          String   @id @default(uuid())
  // ... existing fields
  receiptUrl  String?  @map("receipt_url") @db.VarChar(500)
  // ... existing fields
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication State Consistency

*For any* Telegram user ID, if authentication succeeds, then subsequent calls to `getAuthenticatedUser()` should return the same user data until logout or session expiry.

**Validates: Requirements 2.4, 2.5**

### Property 2: Authorization Enforcement

*For any* bot command that requires admin privileges, if the user is not authenticated or does not have admin role, then the command should be rejected with appropriate error message.

**Validates: Requirements 2.3, 3.1**

### Property 3: Expense Recording Consistency

*For any* expense recorded via Telegram bot, the expense should be immediately visible in the web application and should have identical data (category, amount, description) as provided through the bot.

**Validates: Requirements 9.6**

### Property 4: Balance Validation Integrity

*For any* expense recording attempt, if the expense amount exceeds current balance, then the system should reject the expense and the database should remain unchanged.

**Validates: Requirements 3.6, 3.7**

### Property 5: Conversation State Isolation

*For any* two concurrent users in conversation, updating one user's conversation state should not affect the other user's state.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 6: Input Sanitization

*For any* user input (description, notes), the stored value should not contain SQL injection patterns or script tags.

**Validates: Requirements 8.3, 8.4**

### Property 7: Rate Limiting Enforcement

*For any* user sending commands, if the user exceeds 10 commands per minute, then subsequent commands within that minute should be rejected with rate limit message.

**Validates: Requirements 8.1, 8.2**

### Property 8: Audit Trail Completeness

*For any* expense recorded via Telegram, there should exist a corresponding audit log entry with source "TELEGRAM_BOT" and Telegram user metadata.

**Validates: Requirements 5.2, 5.3**

### Property 9: Session Auto-Expiry

*For any* authenticated user, if there is no activity for 30 days, then the authentication should be automatically revoked.

**Validates: Requirements 8.6**

### Property 10: Error Message Clarity

*For any* error condition (invalid input, insufficient balance, unauthorized access), the bot should send a user-friendly error message that explains the problem and suggests corrective action.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 11: Receipt Upload Integrity

*For any* expense with uploaded receipt, the receipt file should be accessible via the stored URL and the file content should match the original uploaded file.

**Validates: Requirements 3A.6, 3A.7, 3A.8, 3A.9, 3A.11**

### Property 12: Receipt Upload Optional

*For any* expense recording flow, if user chooses to skip receipt upload, the expense should still be recorded successfully without receipt URL.

**Validates: Requirements 3.6, 3A.1, 3A.10**

### Property 13: Receipt File Validation

*For any* file upload attempt, if the file format is not JPG/PNG/PDF or size exceeds 5MB, then the upload should be rejected with clear error message.

**Validates: Requirements 3A.3, 3A.4, 3A.5**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Phone number not found
   - User not admin
   - Session expired
   - Response: Clear message with /start instruction

2. **Authorization Errors**
   - Insufficient permissions
   - Response: Explain required role

3. **Validation Errors**
   - Invalid amount format
   - Insufficient balance
   - Invalid category
   - Response: Explain error with example

4. **System Errors**
   - Database connection failure
   - Telegram API error
   - Redis connection failure
   - Response: Generic error message, log technical details

5. **Rate Limit Errors**
   - Too many commands
   - Response: Wait time until next command allowed

### Error Handling Strategy

```typescript
class TelegramErrorHandler {
  async handleError(
    error: Error,
    chatId: number,
    context: ErrorContext
  ): Promise<void> {
    // Log error with context
    this.logger.error('Telegram bot error', {
      error: error.message,
      stack: error.stack,
      context
    });
    
    // Send user-friendly message
    let userMessage: string;
    
    if (error instanceof AuthenticationError) {
      userMessage = 'Anda harus terautentikasi terlebih dahulu. Gunakan /start untuk memulai.';
    } else if (error instanceof AuthorizationError) {
      userMessage = 'Maaf, Anda tidak memiliki izin untuk melakukan aksi ini.';
    } else if (error instanceof ValidationError) {
      userMessage = `Input tidak valid: ${error.message}`;
    } else if (error instanceof RateLimitError) {
      userMessage = `Terlalu banyak perintah. Silakan tunggu ${error.waitTime} detik.';
    } else {
      userMessage = 'Terjadi kesalahan sistem. Silakan coba lagi nanti atau hubungi administrator.';
    }
    
    await this.botService.sendMessage(chatId, userMessage);
  }
}
```

## Testing Strategy

### Unit Tests

Focus on specific components and edge cases:

1. **TelegramAuthService**
   - Phone number validation (valid format, invalid format)
   - User role checking (admin roles, non-admin roles)
   - Session expiry logic
   - Authentication mapping CRUD

2. **TelegramConversationService**
   - Conversation state transitions
   - State expiry handling
   - Concurrent conversation isolation

3. **Command Handlers**
   - Authenticated vs unauthenticated users
   - Authorized vs unauthorized users
   - Invalid input handling
   - Success scenarios

4. **TelegramFileService**
   - File format validation (valid and invalid formats)
   - File size validation (within limit, exceeds limit)
   - File download from Telegram
   - File upload to storage
   - File URL generation

5. **Error Handling**
   - Each error type produces correct user message
   - Technical details are logged
   - No sensitive data in user messages

### Property-Based Tests

Verify universal properties across all inputs:

1. **Property Test: Authentication Consistency** (Property 1)
   - Generate random Telegram IDs and user data
   - Authenticate user
   - Verify subsequent calls return same data
   - Logout and verify authentication is removed

2. **Property Test: Authorization Enforcement** (Property 2)
   - Generate random users with various roles
   - Attempt admin commands
   - Verify only admin roles succeed

3. **Property Test: Expense Recording Consistency** (Property 3)
   - Generate random expense data
   - Record via Telegram
   - Query via ExpensesService
   - Verify data matches

4. **Property Test: Balance Validation** (Property 4)
   - Generate random balances and expense amounts
   - Attempt to record expense
   - Verify rejection when amount > balance
   - Verify database unchanged after rejection

5. **Property Test: Input Sanitization** (Property 6)
   - Generate random strings including injection patterns
   - Submit as expense description
   - Verify stored value is sanitized

6. **Property Test: Rate Limiting** (Property 7)
   - Generate rapid command sequences
   - Verify rejection after 10 commands per minute
   - Verify acceptance after rate limit window

### Integration Tests

Test end-to-end flows:

1. **Full Authentication Flow**
   - Send /start
   - Provide phone number
   - Verify authentication success
   - Verify Redis state

2. **Full Expense Recording Flow**
   - Authenticate user
   - Send /expense
   - Select category
   - Enter amount
   - Enter description
   - Verify expense in database
   - Verify audit log entry

3. **Error Recovery Flow**
   - Start expense recording
   - Provide invalid amount
   - Provide valid amount
   - Complete successfully

4. **Concurrent Users**
   - Two users start expense recording simultaneously
   - Verify states don't interfere
   - Both complete successfully

### Test Configuration

- **Property tests**: Minimum 100 iterations per test
- **Test tagging**: `Feature: telegram-expense-integration, Property {number}: {property_text}`
- **Test library**: Jest for unit/integration, fast-check for property-based tests
- **Mock strategy**: Mock Telegram API calls, use real Redis (test container), use real database (test container)

## Security Considerations

### 1. Token Security

- Store bot token in environment variable
- Never log bot token
- Rotate token if compromised
- Use different tokens for dev/staging/production

### 2. Input Validation

- Validate all user inputs before processing
- Sanitize descriptions to prevent injection
- Limit input lengths (description max 500 chars)
- Validate phone number format strictly

### 3. Rate Limiting

- Implement per-user rate limiting (10 commands/minute)
- Track failed authentication attempts
- Block users after 5 failed auth attempts (1 hour cooldown)

### 4. Session Management

- Auto-expire sessions after 30 days inactivity
- Require re-authentication after expiry
- Provide logout command for manual session termination

### 5. Audit Logging

- Log all bot interactions
- Include Telegram user ID, username, command, timestamp
- Log authentication attempts (success and failure)
- Log expense recording with full details

### 6. Error Messages

- Never expose internal system details in error messages
- Don't reveal whether phone number exists in system
- Generic error messages for system failures
- Log technical details server-side only

## Deployment Considerations

### Environment Variables

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=8366745143:AAFJ66J1rtS2gHXJgJa2cEtBhv0WXz6sd90
TELEGRAM_BOT_POLLING_INTERVAL=1000  # milliseconds
TELEGRAM_BOT_RATE_LIMIT=10          # commands per minute
TELEGRAM_SESSION_TTL=2592000        # 30 days in seconds
TELEGRAM_CONVERSATION_TTL=600       # 10 minutes in seconds

# Existing environment variables
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://...
```

### Module Registration

```typescript
// app.module.ts
@Module({
  imports: [
    // ... existing modules
    TelegramModule,
  ],
})
export class AppModule {}
```

### Health Check Integration

```typescript
// health.service.ts
async checkTelegramBot(): Promise<HealthIndicatorResult> {
  const status = await this.telegramBotService.getHealthStatus();
  
  const isHealthy = status.isRunning && 
                    status.errorRate < 0.1 && // Less than 10% error rate
                    (Date.now() - status.lastPollTime.getTime()) < 60000; // Last poll within 1 minute
  
  return {
    telegram_bot: {
      status: isHealthy ? 'up' : 'down',
      isRunning: status.isRunning,
      lastPoll: status.lastPollTime,
      totalCommands: status.totalCommands,
      successRate: status.successRate,
      errorRate: status.errorRate,
    },
  };
}
```

### Graceful Shutdown

```typescript
// telegram-bot.service.ts
async onModuleDestroy() {
  this.logger.log('Stopping Telegram bot...');
  await this.bot.stopPolling();
  this.logger.log('Telegram bot stopped');
}
```

## Performance Considerations

### 1. Redis Connection Pooling

- Reuse existing Redis service
- Connection pool size: 10
- Timeout: 5 seconds

### 2. Database Query Optimization

- Reuse existing ExpensesService (already optimized)
- No N+1 queries
- Use indexes on frequently queried fields

### 3. Telegram API Rate Limits

- Telegram allows 30 messages/second per bot
- Implement message queue if needed
- Handle 429 (Too Many Requests) gracefully

### 4. Memory Management

- Conversation states expire after 10 minutes
- Authentication sessions expire after 30 days
- Clean up expired sessions periodically (daily cron job)

### 5. Monitoring Metrics

- Track command response time
- Track success/error rates
- Alert on high error rates (>10%)
- Alert on bot downtime

## Future Enhancements

1. **Expense Voiding via Bot**
   - `/void <expense_id>` command
   - Require void reason
   - Send confirmation

2. **Expense History**
   - `/history` command
   - Show last 10 expenses
   - Filter by date range

3. **Balance Inquiry**
   - `/balance` command
   - Show current balance
   - Show income vs expenses

4. **Receipt Upload**
   - Support photo upload
   - Store in cloud storage
   - Link to expense record

5. **Multi-language Support**
   - Detect user language preference
   - Support English and Indonesian
   - Configurable per user

6. **Webhook Mode**
   - Switch from polling to webhook
   - Better performance
   - Requires HTTPS endpoint
