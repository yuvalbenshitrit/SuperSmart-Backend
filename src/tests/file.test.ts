import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import fileRoutes from '../routes/file_routes';

// Mock environment variables
process.env.DOMAIN_BASE = 'http://localhost:3000';

// Create Express app for testing
const app = express();
app.use('/files', fileRoutes);

// Create test directory if it doesn't exist
beforeAll(() => {
  // Ensure public directory exists for uploads
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
});

// Clean up test files after each test
afterEach(() => {
  // Remove any test files created during tests
  const publicDir = path.join(process.cwd(), 'public');
  const files = fs.readdirSync(publicDir);

  // Only remove test files created by our tests
  files.forEach(file => {
    if (file.startsWith('test-') || file.includes('test-file')) {
      fs.unlinkSync(path.join(publicDir, file));
    }
  });
});

describe('File Routes', () => {
  describe('POST /files', () => {
    it('should upload a file successfully', async () => {
      // Create a test file
      const testFilePath = path.join(process.cwd(), 'test-file.txt');
      fs.writeFileSync(testFilePath, 'This is a test file');

      const response = await request(app)
        .post('/files')
        .attach('file', testFilePath);

      // Clean up the test file
      fs.unlinkSync(testFilePath);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toMatch(/^http:\/\/localhost:3000\/public\/\d+\.txt$/);
    });

    
   

    it('should handle image file uploads', async () => {
      // For this test, we'll create a small binary file that mimics an image
      const testFilePath = path.join(process.cwd(), 'test-image.png');

      // Create a simple binary file (not a real image, but enough for testing)
      const buffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        // ... more binary data would go here in a real PNG
      ]);
      fs.writeFileSync(testFilePath, buffer);

      const response = await request(app)
        .post('/files')
        .attach('file', testFilePath);

      // Clean up the test file
      fs.unlinkSync(testFilePath);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toMatch(/^http:\/\/localhost:3000\/public\/\d+\.png$/);
    });
  });
});