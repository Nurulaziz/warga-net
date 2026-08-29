# Implementation Plan: Telegram Expense Integration

## Overview

Implementasi Telegram bot untuk WargaNet yang memungkinkan admin mencatat pengeluaran melalui Telegram. Bot menggunakan `node-telegram-bot-api` dengan long-polling strategy, Redis untuk session management, dan mengintegrasikan dengan existing ExpensesService untuk business logic consistency.

**Key Implementation Points:**
- Bot berjalan sebagai NestJS module dengan lifecycle management
- Authentication state disimpan di Redis dengan TTL 30 hari
- Conversation state untuk multi-step interactions (TTL 10 menit)
- Receipt upload dengan validasi format dan size
- File storage: local filesystem (dev), cloud storage (production)
- Rate limiting: 10 commands per minute per user
- Reuse existing ExpensesService untuk consistency

## Tasks

- [x] 1. Setup Telegram Bot Module and Dependencies
  - Install `node-telegram-bot-api` dan `@types/node-telegram-bot-api`
  - Install `fast-check` untuk property-based testing
  - Create module structure: `src/telegram/`
  - Setup environment variables untuk bot token
  - Create TelegramModule dengan imports dan providers
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 2. Implement Core Bot Service
  - [x] 2.1 Create TelegramBotService dengan lifecycle hooks
    - Implement `onModuleInit()` untuk bot initialization
    - Implement `onModuleDestroy()` untuk graceful shutdown
    - Setup long-polling dengan error handling
    - Implement health status tracking (isRunning, lastPollTime, metrics)
    - _Requirements: 1.5, 10.2, 10.3_

  - [ ]* 2.2 Write unit tests for TelegramBotService
    - Test bot initialization success and failure scenarios
    - Test graceful shutdown
    - Test health status reporting
    - _Requirements: 1.5, 10.1_

  - [x] 2.3 Create message sending utilities
    - Implement `sendMessage()` dengan Markdown/HTML support
    - Implement `sendInlineKeyboard()` untuk interactive buttons
    - Add error handling untuk Telegram API failures
    - _Requirements: 3.2, 3.3_

  - [ ]* 2.4 Write unit tests for message utilities
    - Test message sending with various formats
    - Test inline keyboard generation
    - Test error handling for API failures
    - _Requirements: 3.2, 3.3_

- [x] 3. Implement Authentication Service
  - [x] 3.1 Create TelegramAuthService
    - Implement `startAuthentication()` untuk initiate auth flow
    - Implement `verifyPhoneNumber()` dengan database lookup
    - Implement `getAuthenticatedUser()` untuk retrieve user from Redis
    - Implement `logout()` untuk remove authentication
    - Implement `isAuthenticated()` check
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [ ]* 3.2 Write property test for authentication consistency
    - **Property 1: Authentication State Consistency**
    - **Validates: Requirements 2.4, 2.5**
    - Generate random Telegram IDs and user data
    - Verify authentication persists until logout
    - _Requirements: 2.4, 2.5_

  - [ ]* 3.3 Write property test for authorization enforcement
    - **Property 2: Authorization Enforcement**
    - **Validates: Requirements 2.3, 3.1**
    - Generate users with various roles
    - Verify only admin roles can access commands
    - _Requirements: 2.3, 3.1_

  - [x] 3.4 Implement session management
    - Implement `refreshSession()` untuk update lastActivityAt
    - Implement `cleanupInactiveSessions()` untuk auto-expiry
    - Setup Redis keys dengan TTL 30 hari
    - _Requirements: 2.5, 8.6_

  - [ ]* 3.5 Write unit tests for session management
    - Test session expiry after 30 days
    - Test session refresh on activity
    - Test cleanup of inactive sessions
    - _Requirements: 2.5, 8.6_

  - [ ]* 3.6 Write property test for session auto-expiry
    - **Property 9: Session Auto-Expiry**
    - **Validates: Requirements 8.6**
    - Verify sessions expire after 30 days inactivity
    - _Requirements: 8.6_

- [x] 4. Implement Conversation State Management
  - [x] 4.1 Create TelegramConversationService
    - Implement `startConversation()` dengan conversation type
    - Implement `getConversationState()` dari Redis
    - Implement `updateConversationState()` untuk state transitions
    - Implement `endConversation()` untuk cleanup
    - Implement `isInConversation()` check
    - Setup Redis keys dengan TTL 10 menit
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.2 Write property test for conversation state isolation
    - **Property 5: Conversation State Isolation**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - Generate concurrent users in conversation
    - Verify state updates don't interfere
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.3 Write unit tests for conversation service
    - Test conversation lifecycle (start, update, end)
    - Test state expiry after 10 minutes
    - Test concurrent conversation handling
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Implement File Storage Service
  - [x] 5.1 Create TelegramFileService
    - Implement `downloadFile()` dari Telegram servers
    - Implement `uploadToStorage()` ke local filesystem
    - Implement `getFileUrl()` untuk generate access URL
    - Implement `deleteFile()` untuk cleanup
    - Implement `validateImageFile()` untuk format dan size validation
    - Setup storage directory: `apps/backend/uploads/receipts/`
    - _Requirements: 3A.2, 3A.3, 3A.4, 3A.6, 3A.7, 3A.8_

  - [ ]* 5.2 Write property test for receipt file validation
    - **Property 13: Receipt File Validation**
    - **Validates: Requirements 3A.3, 3A.4, 3A.5**
    - Generate files with various formats and sizes
    - Verify only valid files are accepted
    - _Requirements: 3A.3, 3A.4, 3A.5_

  - [ ]* 5.3 Write unit tests for file service
    - Test file download from Telegram
    - Test file upload to storage
    - Test file validation (format, size)
    - Test file URL generation
    - Test error handling for upload failures
    - _Requirements: 3A.2, 3A.3, 3A.4, 3A.6, 3A.7, 3A.8_

  - [ ]* 5.4 Write property test for receipt upload integrity
    - **Property 11: Receipt Upload Integrity**
    - **Validates: Requirements 3A.6, 3A.7, 3A.8, 3A.9, 3A.11**
    - Upload random files and verify content matches
    - _Requirements: 3A.6, 3A.7, 3A.8, 3A.9, 3A.11_

- [x] 6. Add Receipt URL Column to Database
  - [x] 6.1 Create Prisma migration untuk receiptUrl column
    - Add `receiptUrl String? @map("receipt_url") @db.VarChar(500)` to Expense model
    - Generate migration file
    - Run migration on development database
    - _Requirements: 3A.8, 3A.9_

  - [x] 6.2 Update ExpensesService untuk receipt handling
    - Add `updateExpenseReceipt()` method
    - Update expense DTOs jika perlu
    - _Requirements: 3A.9, 3A.11_

- [x] 7. Implement Command Handlers
  - [x] 7.1 Create StartHandler
    - Handle /start command
    - Check if user already authenticated
    - Initiate authentication flow untuk new users
    - Send welcome message dengan instructions
    - _Requirements: 2.1, 7.1, 7.3_

  - [ ]* 7.2 Write unit tests for StartHandler
    - Test authenticated user scenario
    - Test unauthenticated user scenario
    - Test error handling
    - _Requirements: 2.1, 7.1, 7.3_

  - [x] 7.3 Create HelpHandler
    - Handle /help command
    - Display available commands based on auth status
    - Provide usage examples
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 7.4 Write unit tests for HelpHandler
    - Test help message for authenticated users
    - Test help message for unauthenticated users
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 7.5 Create LogoutHandler
    - Handle /logout command
    - Remove authentication mapping
    - Send confirmation message
    - _Requirements: 2.6_

  - [ ]* 7.6 Write unit tests for LogoutHandler
    - Test successful logout
    - Test logout when not authenticated
    - _Requirements: 2.6_

  - [x] 7.7 Create CategoriesHandler
    - Handle /categories command
    - Fetch active expense categories
    - Display category list dengan descriptions
    - Handle empty categories scenario
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 7.8 Write unit tests for CategoriesHandler
    - Test category display with data
    - Test empty categories scenario
    - Test unauthenticated user
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Checkpoint - Verify basic bot functionality
  - Test bot initialization and connection
  - Test authentication flow (/start, phone verification, /logout)
  - Test help and categories commands
  - Ensure all tests pass
  - Ask user if questions arise

- [x] 9. Implement Expense Recording Handler - Part 1 (Category Selection)
  - [x] 9.1 Create ExpenseHandler dengan initial flow
    - Handle /expense command
    - Check authentication and authorization
    - Start expense recording conversation
    - Fetch and display expense categories as inline keyboard
    - Handle empty categories scenario
    - _Requirements: 3.1, 3.2, 4.1_

  - [x] 9.2 Implement category selection callback
    - Handle category button clicks
    - Update conversation state dengan categoryId
    - Prompt for amount input
    - _Requirements: 3.2, 3.3_

  - [ ]* 9.3 Write unit tests for category selection
    - Test category display
    - Test category selection
    - Test unauthorized user rejection
    - Test empty categories handling
    - _Requirements: 3.1, 3.2, 4.1_

- [x] 10. Implement Expense Recording Handler - Part 2 (Amount and Description)
  - [x] 10.1 Implement amount input handler
    - Parse and validate amount (positive number)
    - Validate balance sufficiency
    - Update conversation state dengan amount
    - Prompt for description input
    - Handle validation errors dengan clear messages
    - _Requirements: 3.4, 3.9, 3.10, 6.2, 6.4_

  - [ ]* 10.2 Write property test for balance validation
    - **Property 4: Balance Validation Integrity**
    - **Validates: Requirements 3.9, 3.10**
    - Generate random balances and amounts
    - Verify rejection when amount > balance
    - _Requirements: 3.9, 3.10_

  - [ ]* 10.3 Write unit tests for amount validation
    - Test valid amount input
    - Test invalid amount formats
    - Test insufficient balance scenario
    - Test error messages
    - _Requirements: 3.4, 3.9, 3.10, 6.2, 6.4_

  - [x] 10.4 Implement description input handler
    - Validate description not empty
    - Update conversation state dengan description
    - Prompt for receipt upload dengan inline keyboard
    - _Requirements: 3.5, 3A.1_

  - [ ]* 10.5 Write unit tests for description input
    - Test valid description
    - Test empty description rejection
    - _Requirements: 3.5_

- [x] 11. Implement Expense Recording Handler - Part 3 (Receipt Upload)
  - [x] 11.1 Implement receipt upload choice handler
    - Handle "Upload Receipt" button
    - Handle "Skip" button
    - Prompt for photo upload atau proceed without receipt
    - _Requirements: 3.6, 3A.1_

  - [x] 11.2 Implement receipt photo handler
    - Handle photo messages (JPG, PNG)
    - Handle document messages (PDF)
    - Validate file format and size
    - Download file from Telegram
    - Handle validation errors dengan retry option
    - _Requirements: 3.7, 3A.2, 3A.3, 3A.4, 3A.5, 3A.6_

  - [ ]* 11.3 Write property test for receipt upload optional
    - **Property 12: Receipt Upload Optional**
    - **Validates: Requirements 3.6, 3A.1, 3A.10**
    - Verify expenses can be recorded without receipt
    - _Requirements: 3.6, 3A.1, 3A.10_

  - [ ]* 11.4 Write unit tests for receipt handling
    - Test photo upload success
    - Test PDF upload success
    - Test invalid file format rejection
    - Test file size limit enforcement
    - Test skip receipt option
    - _Requirements: 3.6, 3.7, 3A.1, 3A.2, 3A.3, 3A.4, 3A.5_

- [x] 12. Implement Expense Recording Handler - Part 4 (Final Recording)
  - [x] 12.1 Implement expense recording logic
    - Call ExpensesService.recordExpense()
    - Upload receipt file jika ada
    - Update expense dengan receiptUrl
    - Handle upload failures gracefully
    - Send confirmation message dengan expense details
    - End conversation
    - _Requirements: 3.8, 3.11, 3A.7, 3A.8, 3A.9, 3A.10, 5.1, 9.1, 9.2_

  - [ ]* 12.2 Write property test for expense recording consistency
    - **Property 3: Expense Recording Consistency**
    - **Validates: Requirements 9.6**
    - Generate random expense data
    - Record via Telegram
    - Verify data matches in database
    - _Requirements: 9.6_

  - [ ]* 12.3 Write unit tests for expense recording
    - Test successful recording with receipt
    - Test successful recording without receipt
    - Test receipt upload failure handling
    - Test confirmation message format
    - _Requirements: 3.8, 3.11, 3A.7, 3A.8, 3A.9, 3A.10, 5.1_

- [x] 13. Implement Security Features
  - [x] 13.1 Implement rate limiting
    - Create rate limit tracking in Redis
    - Implement 10 commands per minute limit
    - Send rate limit error messages
    - _Requirements: 8.1, 8.2_

  - [ ]* 13.2 Write property test for rate limiting
    - **Property 7: Rate Limiting Enforcement**
    - **Validates: Requirements 8.1, 8.2**
    - Generate rapid command sequences
    - Verify rejection after limit
    - _Requirements: 8.1, 8.2_

  - [x] 13.3 Implement input sanitization
    - Sanitize expense descriptions
    - Prevent SQL injection patterns
    - Prevent XSS patterns
    - _Requirements: 8.3, 8.4_

  - [ ]* 13.4 Write property test for input sanitization
    - **Property 6: Input Sanitization**
    - **Validates: Requirements 8.3, 8.4**
    - Generate strings with injection patterns
    - Verify sanitization
    - _Requirements: 8.3, 8.4_

  - [x] 13.5 Implement audit logging
    - Log all bot interactions
    - Include Telegram user metadata
    - Mark source as "TELEGRAM_BOT"
    - Include receipt upload status
    - _Requirements: 5.2, 5.3, 5.4, 8.5_

  - [ ]* 13.6 Write property test for audit trail completeness
    - **Property 8: Audit Trail Completeness**
    - **Validates: Requirements 5.2, 5.3**
    - Verify audit log exists for each expense
    - _Requirements: 5.2, 5.3_

- [x] 14. Implement Error Handling
  - [x] 14.1 Create TelegramErrorHandler
    - Handle authentication errors
    - Handle authorization errors
    - Handle validation errors
    - Handle system errors
    - Handle rate limit errors
    - Send user-friendly error messages
    - Log technical details
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 14.2 Write property test for error message clarity
    - **Property 10: Error Message Clarity**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
    - Generate various error conditions
    - Verify user-friendly messages
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 14.3 Write unit tests for error handler
    - Test each error type produces correct message
    - Test technical details are logged
    - Test no sensitive data in user messages
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 15. Integrate with Health Check System
  - [x] 15.1 Add bot health check to HealthService
    - Implement `checkTelegramBot()` method
    - Check bot running status
    - Check error rate threshold
    - Check last poll time
    - Return health indicator result
    - _Requirements: 10.1, 10.4_

  - [ ]* 15.2 Write unit tests for health check
    - Test healthy bot status
    - Test unhealthy bot status (high error rate)
    - Test unhealthy bot status (not polling)
    - _Requirements: 10.1, 10.4_

- [x] 16. Implement Cache Invalidation
  - [x] 16.1 Invalidate dashboard cache after expense recording
    - Call cache invalidation after successful expense
    - Ensure web app shows updated data immediately
    - _Requirements: 5.5, 9.6_

  - [ ]* 16.2 Write integration test for cache invalidation
    - Record expense via Telegram
    - Query dashboard via web API
    - Verify updated data is returned
    - _Requirements: 5.5, 9.6_

- [x] 17. Checkpoint - Verify complete expense recording flow
  - Test full expense recording flow with receipt
  - Test full expense recording flow without receipt
  - Test error scenarios (invalid input, insufficient balance)
  - Test rate limiting
  - Test audit logging
  - Ensure all tests pass
  - Ask user if questions arise

- [ ] 18. Integration Testing
  - [ ]* 18.1 Write integration test for full authentication flow
    - Send /start command
    - Provide phone number
    - Verify authentication success
    - Verify Redis state
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 18.2 Write integration test for full expense recording flow
    - Authenticate user
    - Send /expense command
    - Select category
    - Enter amount
    - Enter description
    - Upload receipt
    - Verify expense in database
    - Verify audit log entry
    - Verify receipt file exists
    - _Requirements: 3.1-3.11, 3A.1-3A.11, 5.1-5.5_

  - [ ]* 18.3 Write integration test for error recovery
    - Start expense recording
    - Provide invalid amount
    - Provide valid amount
    - Complete successfully
    - _Requirements: 6.2, 6.4_

  - [ ]* 18.4 Write integration test for concurrent users
    - Two users start expense recording simultaneously
    - Verify states don't interfere
    - Both complete successfully
    - _Requirements: 3.1-3.5_

  - [ ]* 18.5 Write integration test for session expiry
    - Authenticate user
    - Wait for session expiry (mock time)
    - Verify authentication is revoked
    - _Requirements: 8.6_

- [x] 19. Documentation
  - [x] 19.1 Create bot setup guide
    - Document how to create Telegram bot via BotFather
    - Document environment variable configuration
    - Document bot token security best practices
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 19.2 Create user guide for admins
    - Document authentication process
    - Document available commands dengan examples
    - Document expense recording flow
    - Document receipt upload guidelines
    - Document error messages dan troubleshooting
    - _Requirements: 7.1, 7.2_

  - [x] 19.3 Create API documentation
    - Document TelegramBotService interface
    - Document TelegramAuthService interface
    - Document TelegramConversationService interface
    - Document TelegramFileService interface
    - Document command handlers
    - _Requirements: All_

  - [x] 19.4 Update main README
    - Add Telegram integration section
    - Link to bot setup guide
    - Link to user guide
    - _Requirements: All_

- [x] 20. Final Checkpoint - Complete system verification
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Test bot in development environment
  - Verify health check integration
  - Verify audit logging
  - Verify cache invalidation
  - Review documentation completeness
  - Ask user if ready for production deployment

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- Checkpoints ensure incremental validation at key milestones
- Bot token sudah tersedia: `8366745143:AAFJ66J1rtS2gHXJgJa2cEtBhv0WXz6sd90`
- Receipt upload feature adalah optional - expense dapat dicatat tanpa receipt
- File storage menggunakan local filesystem untuk development
- Rate limiting: 10 commands per minute per user
- Session TTL: 30 hari, Conversation TTL: 10 menit
