# Implementation Plan: PDF Report Redesign

## Overview

Migrasi sistem PDF generation dari PDFKit ke Puppeteer dengan HTML/CSS template approach untuk menghasilkan laporan keuangan RT yang profesional dan formal. Implementation akan dilakukan secara incremental dengan backward compatibility penuh.

## Tasks

- [x] 1. Setup Puppeteer dan dependencies
  - Install puppeteer package
  - Configure Puppeteer untuk production environment
  - Setup Docker configuration untuk Chromium
  - _Requirements: 1.2, 10.1_

- [ ] 2. Create template system infrastructure
  - [x] 2.1 Create TemplateRenderer service
    - Implement HTML template rendering dengan data injection
    - Implement XSS prevention (escape function)
    - Implement date formatting helpers
    - Implement currency formatting helpers
    - Implement document number generator
    - _Requirements: 11.2, 11.5, 9.1, 9.4, 3.3_
  
  - [ ]* 2.2 Write unit tests for TemplateRenderer
    - Test HTML generation with complete data
    - Test HTML generation with empty transactions
    - Test XSS prevention (special characters escaped)
    - Test currency formatting (no duplicate Rp)
    - Test date formatting consistency
    - Test document number format
    - _Requirements: 9.1, 9.2, 9.4, 11.5_
  
  - [x] 2.3 Create CSS styles file
    - Define base styles (fonts, colors, spacing)
    - Define print media queries
    - Define table styles (horizontal borders only)
    - Define summary box styles
    - Define signature section styles
    - Define page break rules
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3_

- [ ] 3. Create asset management system
  - [x] 3.1 Create AssetManager service
    - Implement logo loading from filesystem
    - Implement image to base64 conversion
    - Implement placeholder logo generation
    - Implement logo caching
    - Implement path validation (prevent path traversal)
    - _Requirements: 12.1, 12.2, 12.3, 12.5_
  
  - [ ]* 3.2 Write unit tests for AssetManager
    - Test logo loading with valid PNG file
    - Test logo loading with valid JPG file
    - Test logo loading with missing file (placeholder)
    - Test logo loading with invalid path (error handling)
    - Test base64 conversion accuracy
    - _Requirements: 12.1, 12.2, 12.5_

- [ ] 4. Implement HTML template sections
  - [x] 4.1 Implement header template
    - Render RT logo(s) with base64 embedding
    - Render RT identity information
    - Render separator line
    - Support dual logo configuration
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 4.2 Implement title section template
    - Render main title with proper styling
    - Render period subtitle with date formatting
    - Render document number
    - Apply spacing
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 4.3 Implement financial summary template
    - Render summary box with modern styling
    - Render opening balance, income, expense
    - Render separator line before closing balance
    - Highlight closing balance
    - Right-align all amounts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 4.4 Implement income transactions table template
    - Render table with horizontal borders
    - Render table headers with gray background
    - Render transaction rows
    - Render total row
    - Handle empty data case
    - Center-align dates, right-align amounts
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.5_
  
  - [x] 4.5 Implement expense transactions table template
    - Render table with horizontal borders
    - Render table headers with gray background
    - Render transaction rows
    - Render total row
    - Handle empty data case
    - Center-align dates, right-align amounts
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.5_
  
  - [x] 4.6 Implement category summary template
    - Render lightweight format with dotted lines
    - Sort categories alphabetically
    - Render total row in bold
    - Handle empty data case (don't display section)
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [x] 4.7 Implement signature section template
    - Render "Mengetahui," header
    - Render three columns (Ketua, Sekretaris, Bendahara)
    - Apply spacing before names
    - Retrieve names from RtInfo
    - _Requirements: 8.3, 8.4, 8.6_
  
  - [x] 4.8 Implement footer template
    - Render print date
    - Render page numbers with format "Halaman X dari Y"
    - _Requirements: 8.1, 8.2_

- [x] 5. Checkpoint - Verify template system
  - Ensure all template sections render correctly
  - Verify XSS prevention works
  - Verify date and currency formatting
  - Ask user if questions arise

- [ ] 6. Refactor PdfGeneratorService
  - [x] 6.1 Implement new generate() method with Puppeteer
    - Launch Puppeteer browser
    - Load logos via AssetManager
    - Render HTML via TemplateRenderer
    - Set HTML content in Puppeteer page
    - Generate PDF with proper settings
    - Implement resource cleanup in finally block
    - _Requirements: 1.2, 10.1, 13.2_
  
  - [x] 6.2 Configure Puppeteer PDF options
    - Set A4 format
    - Set 50px margins on all sides
    - Enable printBackground for styling
    - Configure headerTemplate and footerTemplate
    - Enable displayHeaderFooter
    - _Requirements: 1.3, 2.4, 7.5_
  
  - [x] 6.3 Implement error handling
    - Validate input data before generation
    - Handle Puppeteer launch failures
    - Handle template rendering errors
    - Handle file system errors
    - Return descriptive error messages
    - Log errors with context
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ]* 6.4 Write unit tests for PdfGeneratorService
    - Test PDF generation with valid data
    - Test error handling for Puppeteer failures
    - Test resource cleanup (browser.close called)
    - Test with missing logos (placeholder used)
    - Test with dual logos (both displayed)
    - _Requirements: 12.2, 12.4, 13.2_

- [ ] 7. Implement multi-page support
  - [x] 7.1 Configure CSS for page breaks
    - Set thead to display: table-header-group (repeat headers)
    - Set tr to page-break-inside: avoid
    - Set section to page-break-inside: avoid
    - _Requirements: 5.6, 7.3_
  
  - [x] 7.2 Test multi-page generation
    - Generate report with 100+ transactions
    - Verify headers repeat on all pages
    - Verify footers appear on all pages
    - Verify page numbers are correct
    - Verify rows don't break in middle
    - _Requirements: 2.4, 5.6, 7.1, 7.2, 7.3, 7.5_

- [x] 8. Checkpoint - Verify PDF generation
  - Generate sample PDFs with various data
  - Verify visual quality
  - Verify multi-page handling
  - Ask user if questions arise

- [ ] 9. Write integration tests
  - [ ]* 9.1 Write end-to-end PDF generation test
    - Test complete flow from ReportData to PDF Buffer
    - Test with realistic data (100+ transactions)
    - Test multi-page document generation
    - Test with dual logos configuration
    - Test with single logo configuration
    - Test with no logos (placeholder)
    - _Requirements: 10.2, 10.3, 10.4_
  
  - [ ]* 9.2 Write API endpoint tests
    - Test /api/v1/reports/pdf endpoint
    - Test response headers (Content-Type: application/pdf)
    - Test response status codes
    - Test error responses
    - Test backward compatibility
    - _Requirements: 10.2, 10.5_

- [ ] 10. Write property-based tests
  - [ ]* 10.1 Write property test for HTML validity
    - **Property 1: HTML Template Generation**
    - **Validates: Requirements 1.1, 11.2**
  
  - [ ]* 10.2 Write property test for currency formatting
    - **Property 2: Currency Formatting Consistency**
    - **Validates: Requirements 9.1, 9.2**
  
  - [ ]* 10.3 Write property test for date formatting
    - **Property 3: Date Formatting Consistency**
    - **Validates: Requirements 9.4**
  
  - [ ]* 10.4 Write property test for XSS prevention
    - **Property 4: XSS Prevention**
    - **Validates: Requirements 11.5**
  
  - [ ]* 10.5 Write property test for logo loading resilience
    - **Property 5: Logo Loading Resilience**
    - **Validates: Requirements 12.2, 12.5**
  
  - [ ]* 10.6 Write property test for resource cleanup
    - **Property 6: Resource Cleanup**
    - **Validates: Requirements 13.2, 13.5**
  
  - [ ]* 10.7 Write property test for empty data handling
    - **Property 7: Empty Data Handling**
    - **Validates: Requirements 9.5, 6.4**
  
  - [ ]* 10.8 Write property test for API backward compatibility
    - **Property 8: API Backward Compatibility**
    - **Validates: Requirements 10.2, 10.4, 10.5**
  
  - [ ]* 10.9 Write property test for dual logo support
    - **Property 9: Dual Logo Support**
    - **Validates: Requirements 2.5, 10.3, 12.4**
  
  - [ ]* 10.10 Write property test for document number format
    - **Property 10: Document Number Format**
    - **Validates: Requirements 3.3**
  
  - [ ]* 10.11 Write property test for multi-page header consistency
    - **Property 11: Multi-Page Header Consistency**
    - **Validates: Requirements 2.4, 7.1**
  
  - [ ]* 10.12 Write property test for multi-page footer consistency
    - **Property 12: Multi-Page Footer Consistency**
    - **Validates: Requirements 7.2, 7.5, 8.2**
  
  - [ ]* 10.13 Write property test for table header repetition
    - **Property 13: Table Header Repetition**
    - **Validates: Requirements 5.6, 7.3**
  
  - [ ]* 10.14 Write property test for performance requirement
    - **Property 14: Performance Requirement**
    - **Validates: Requirements 13.1**
  
  - [ ]* 10.15 Write property test for error handling
    - **Property 15: Error Handling**
    - **Validates: Requirements 14.2, 14.3, 14.4, 14.5**

- [ ] 11. Performance optimization
  - [x] 11.1 Implement logo caching
    - Cache base64-encoded logos in memory
    - Implement cache invalidation strategy
    - _Requirements: 13.1_
  
  - [x] 11.2 Add performance logging
    - Log PDF generation time
    - Log browser launch time
    - Log template rendering time
    - _Requirements: 13.1_
  
  - [ ]* 11.3 Run performance tests
    - Test with 500 transactions (should complete < 10 seconds)
    - Test concurrent requests (5 simultaneous)
    - Test memory usage (no leaks after 100 generations)
    - _Requirements: 13.1, 13.3_

- [x] 12. Final checkpoint - Comprehensive testing
  - Run all unit tests
  - Run all integration tests
  - Run all property tests
  - Run performance tests
  - Manual visual inspection of generated PDFs
  - Verify backward compatibility
  - Ask user if questions arise

- [ ] 13. Documentation and deployment preparation
  - [x] 13.1 Update API documentation
    - Document any new error responses
    - Document performance characteristics
    - _Requirements: 14.2_
  
  - [x] 13.2 Create deployment guide
    - Document Docker configuration
    - Document environment variables
    - Document system requirements
    - Document monitoring setup
  
  - [x] 13.3 Create migration guide
    - Document migration steps
    - Document rollback procedure
    - Document testing checklist

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation maintains full backward compatibility with existing API
- No breaking changes to ReportService or ReportController
- Puppeteer browser instances are properly cleaned up to prevent memory leaks
- All user input is escaped to prevent XSS vulnerabilities
- Logo loading is resilient with placeholder fallback
- Multi-page documents are properly handled with repeated headers/footers
