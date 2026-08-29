# Requirements Document - Telegram Expense Integration

## Introduction

Fitur integrasi Telegram untuk WargaNet memungkinkan admin (khususnya ADMIN_BENDAHARA) untuk mencatat pengeluaran RT/RW melalui Telegram bot. Integrasi ini menyediakan cara alternatif yang lebih cepat dan praktis untuk input pengeluaran tanpa harus membuka web application, sambil tetap menjaga keamanan dan integritas data.

## Glossary

- **Telegram_Bot**: Bot Telegram yang sudah dibuat oleh user dan akan diintegrasikan dengan WargaNet backend
- **Admin_User**: User dengan role ADMIN_BENDAHARA, ADMIN_RT, atau SUPER_ADMIN yang memiliki izin untuk mencatat pengeluaran
- **Expense_Record**: Data pengeluaran yang dicatat melalui Telegram bot
- **Bot_Command**: Perintah yang dikirim user ke Telegram bot untuk melakukan aksi tertentu
- **User_Authentication**: Proses verifikasi bahwa user Telegram adalah admin yang authorized
- **Expense_Category**: Kategori pengeluaran yang sudah terdaftar di sistem WargaNet
- **Balance_Validation**: Validasi bahwa saldo kas mencukupi untuk pengeluaran yang akan dicatat

## Requirements

### Requirement 1: Bot Configuration and Setup

**User Story:** As a system administrator, I want to configure Telegram bot credentials in the backend, so that the system can connect to Telegram API securely.

#### Acceptance Criteria

1. THE System SHALL store Telegram bot token securely in environment variables
2. THE System SHALL validate bot token format before attempting connection
3. WHEN bot configuration is invalid, THE System SHALL log descriptive error messages
4. THE System SHALL support bot token rotation without requiring code changes
5. THE System SHALL initialize Telegram bot connection on application startup

### Requirement 2: User Authentication and Authorization

**User Story:** As an admin, I want to link my Telegram account to my WargaNet account, so that I can use the bot to record expenses securely.

#### Acceptance Criteria

1. WHEN an admin sends /start command, THE Telegram_Bot SHALL request phone number for verification
2. WHEN phone number is provided, THE System SHALL validate that the phone number belongs to an authorized admin user
3. IF phone number is not found or user is not admin, THEN THE Telegram_Bot SHALL reject the authentication and inform the user
4. WHEN authentication succeeds, THE System SHALL store the mapping between Telegram user ID and WargaNet user ID
5. THE System SHALL persist authentication state across bot restarts
6. WHEN an authenticated user sends /logout command, THE System SHALL remove the authentication mapping

### Requirement 3: Expense Recording via Bot Commands

**User Story:** As an authenticated admin, I want to record expenses through Telegram bot commands, so that I can quickly log expenses without opening the web app.

#### Acceptance Criteria

1. WHEN an authenticated admin sends /expense command, THE Telegram_Bot SHALL prompt for expense details (category, amount, description)
2. THE Telegram_Bot SHALL display available expense categories as inline keyboard buttons
3. WHEN user selects a category, THE Telegram_Bot SHALL prompt for amount input
4. WHEN user provides amount, THE Telegram_Bot SHALL validate that amount is a positive number
5. WHEN user provides description, THE Telegram_Bot SHALL prompt for receipt/invoice photo upload
6. THE Telegram_Bot SHALL allow user to skip receipt upload if not available
7. WHEN user uploads receipt photo, THE System SHALL validate file format (JPG, PNG, PDF) and size (max 5MB)
8. THE System SHALL store receipt image and link it to the expense record
9. THE System SHALL validate expense amount against current balance before recording
10. IF balance is insufficient, THEN THE Telegram_Bot SHALL inform user and cancel the operation
11. WHEN expense is successfully recorded, THE Telegram_Bot SHALL send confirmation message with expense details and receipt status

### Requirement 3A: Receipt Image Upload and Storage

**User Story:** As an admin, I want to upload receipt/invoice photos when recording expenses via Telegram, so that I have proof of transactions for audit purposes.

#### Acceptance Criteria

1. WHEN user is prompted for receipt upload, THE Telegram_Bot SHALL provide two options: "Upload Receipt" and "Skip"
2. WHEN user chooses to upload, THE Telegram_Bot SHALL accept photo messages or document files (PDF)
3. THE System SHALL validate uploaded file format (only JPG, JPEG, PNG, PDF allowed)
4. THE System SHALL validate file size (maximum 5MB)
5. IF file validation fails, THEN THE Telegram_Bot SHALL inform user of the error and allow retry or skip
6. WHEN file is valid, THE System SHALL download file from Telegram servers
7. THE System SHALL store file in designated storage location (local filesystem for dev, cloud storage for production)
8. THE System SHALL generate unique filename using pattern: `{expenseId}_{timestamp}_{random}.{ext}`
9. THE System SHALL update expense record with receipt file URL/path
10. WHEN receipt upload fails, THE System SHALL still record the expense without receipt and inform user
11. THE System SHALL make receipt accessible through web application for viewing and download

### Requirement 4: Expense Category Management

**User Story:** As an admin, I want to view available expense categories through the bot, so that I know which categories I can use for recording expenses.

#### Acceptance Criteria

1. WHEN an authenticated admin sends /categories command, THE Telegram_Bot SHALL display list of active expense categories
2. THE System SHALL fetch expense categories from the same database used by web application
3. THE Telegram_Bot SHALL display category name and description for each category
4. WHEN no active categories exist, THE Telegram_Bot SHALL inform user and suggest using web app to create categories

### Requirement 5: Expense Confirmation and Audit Trail

**User Story:** As an admin, I want to receive confirmation after recording an expense, so that I can verify the expense was recorded correctly.

#### Acceptance Criteria

1. WHEN expense is successfully recorded, THE Telegram_Bot SHALL send confirmation message containing expense ID, category, amount, description, receipt status, and timestamp
2. THE System SHALL log expense creation to audit log with source indicator "TELEGRAM_BOT"
3. THE System SHALL include Telegram user ID and username in audit log metadata
4. THE System SHALL include receipt upload status in audit log
5. THE System SHALL invalidate dashboard cache after expense is recorded
6. THE Telegram_Bot SHALL provide expense ID that can be used to void the expense if needed

### Requirement 6: Error Handling and User Feedback

**User Story:** As an admin using the bot, I want to receive clear error messages when something goes wrong, so that I understand what happened and how to fix it.

#### Acceptance Criteria

1. WHEN user is not authenticated, THE Telegram_Bot SHALL respond with authentication instructions
2. WHEN user provides invalid input format, THE Telegram_Bot SHALL explain the correct format with examples
3. WHEN expense category is not found or inactive, THE Telegram_Bot SHALL inform user and show available categories
4. WHEN balance validation fails, THE Telegram_Bot SHALL show current balance and required amount
5. WHEN system error occurs, THE Telegram_Bot SHALL send user-friendly error message and log technical details
6. THE System SHALL handle Telegram API rate limits gracefully without crashing

### Requirement 7: Bot Command Help and Documentation

**User Story:** As an admin, I want to see available bot commands and their usage, so that I can use the bot effectively.

#### Acceptance Criteria

1. WHEN user sends /help command, THE Telegram_Bot SHALL display list of available commands with descriptions
2. THE Telegram_Bot SHALL provide usage examples for each command
3. THE Telegram_Bot SHALL explain authentication process for unauthenticated users
4. THE Telegram_Bot SHALL display different command lists based on user authentication status

### Requirement 8: Security and Rate Limiting

**User Story:** As a system administrator, I want the bot to have security measures and rate limiting, so that the system is protected from abuse.

#### Acceptance Criteria

1. THE System SHALL implement rate limiting for bot commands (max 10 commands per minute per user)
2. WHEN rate limit is exceeded, THE Telegram_Bot SHALL inform user to wait before sending more commands
3. THE System SHALL validate all user inputs to prevent injection attacks
4. THE System SHALL sanitize expense descriptions before storing to database
5. THE System SHALL log all bot interactions for security audit purposes
6. THE System SHALL automatically revoke authentication after 30 days of inactivity

### Requirement 9: Integration with Existing Expense Module

**User Story:** As a developer, I want the Telegram bot to use existing expense service, so that business logic remains consistent across all interfaces.

#### Acceptance Criteria

1. THE System SHALL use ExpensesService.recordExpense() method for creating expenses
2. THE System SHALL use ExpensesService.getExpenseCategories() method for fetching categories
3. THE System SHALL use ExpensesService.validateExpenseAmount() method for balance validation
4. THE System SHALL respect all existing expense validation rules from web application
5. THE System SHALL trigger same audit logging and cache invalidation as web application
6. WHEN expense is recorded via Telegram, THE System SHALL make it visible in web application immediately

### Requirement 10: Bot Status and Health Monitoring

**User Story:** As a system administrator, I want to monitor bot health and status, so that I can detect and fix issues quickly.

#### Acceptance Criteria

1. THE System SHALL expose bot health status through existing health check endpoint
2. THE System SHALL log bot startup and shutdown events
3. WHEN bot connection fails, THE System SHALL log error details and attempt reconnection
4. THE System SHALL track bot command usage metrics (total commands, success rate, error rate)
5. THE System SHALL alert administrators when bot error rate exceeds threshold
