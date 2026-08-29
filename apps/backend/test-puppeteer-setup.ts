/**
 * Test script untuk verify Puppeteer installation
 * Run: npx tsx test-puppeteer-setup.ts
 */

import puppeteer from 'puppeteer';

async function testPuppeteerSetup() {
  console.log('🚀 Testing Puppeteer setup...\n');

  let browser = null;

  try {
    // Test 1: Launch browser
    console.log('1️⃣ Launching browser...');
    const startTime = Date.now();

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const launchTime = Date.now() - startTime;
    console.log(`✅ Browser launched successfully in ${launchTime}ms\n`);

    // Test 2: Create page
    console.log('2️⃣ Creating new page...');
    const page = await browser.newPage();
    console.log('✅ Page created successfully\n');

    // Test 3: Set HTML content
    console.log('3️⃣ Setting HTML content...');
    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Test PDF</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
          }
          h1 {
            color: #0284c7;
          }
          .box {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <h1>Puppeteer Setup Test</h1>
        <div class="box">
          <p><strong>Status:</strong> Puppeteer is working correctly!</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('id-ID')}</p>
        </div>
        <p>This is a test document to verify Puppeteer can generate PDFs.</p>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    console.log('✅ HTML content set successfully\n');

    // Test 4: Generate PDF
    console.log('4️⃣ Generating PDF...');
    const pdfStartTime = Date.now();

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '50px',
        right: '50px',
        bottom: '50px',
        left: '50px',
      },
    });

    const pdfTime = Date.now() - pdfStartTime;
    console.log(`✅ PDF generated successfully in ${pdfTime}ms`);
    console.log(`📄 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);

    // Test 5: Close browser
    console.log('5️⃣ Closing browser...');
    await browser.close();
    console.log('✅ Browser closed successfully\n');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log(`Total time: ${Date.now() - startTime}ms`);
    console.log(`Browser launch: ${launchTime}ms`);
    console.log(`PDF generation: ${pdfTime}ms`);
    console.log('');
    console.log('Puppeteer is ready for production use! 🎉');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
}

// Run test
testPuppeteerSetup();
