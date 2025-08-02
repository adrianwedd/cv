/**
 * Bulletproof Test Server Management
 * Handles server lifecycle with proper cleanup and error recovery
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestServer {
  constructor(port = 8002, rootDir = null) {
    this.port = port;
    this.rootDir = rootDir || path.resolve(__dirname, '..');
    this.server = null;
    this.process = null;
    this.isRunning = false;
  }

  // Start server with bulletproof error handling
  async start() {
    if (this.isRunning) {
      console.log(`✅ Server already running on port ${this.port}`);
      return;
    }

    try {
      // Method 1: Try Node.js HTTP server (more reliable in CI)
      await this.startNodeServer();
    } catch (nodeError) {
      console.warn(`⚠️ Node server failed, trying Python: ${nodeError.message}`);
      try {
        // Method 2: Fallback to Python HTTP server
        await this.startPythonServer();
      } catch (pythonError) {
        throw new Error(`❌ Both server methods failed. Node: ${nodeError.message}, Python: ${pythonError.message}`);
      }
    }

    // Wait for server to be ready
    await this.waitForReady();
    console.log(`✅ Test server running on http://localhost:${this.port}`);
  }

  // Start Node.js HTTP server (preferred method)
  async startNodeServer() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const filePath = this.getFilePath(req.url);
        
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }

          const contentType = this.getContentType(filePath);
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        });
      });

      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} is already in use`));
        } else {
          reject(err);
        }
      });

      this.server.listen(this.port, () => {
        this.isRunning = true;
        resolve();
      });
    });
  }

  // Start Python HTTP server (fallback method)
  async startPythonServer() {
    return new Promise((resolve, reject) => {
      this.process = spawn('python', ['-m', 'http.server', this.port.toString()], {
        cwd: this.rootDir,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let startupComplete = false;

      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Serving HTTP') && !startupComplete) {
          startupComplete = true;
          this.isRunning = true;
          resolve();
        }
      });

      this.process.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Address already in use') && !startupComplete) {
          reject(new Error(`Port ${this.port} is already in use`));
        }
      });

      this.process.on('error', (err) => {
        if (!startupComplete) {
          reject(new Error(`Failed to start Python server: ${err.message}`));
        }
      });

      // Timeout if server doesn't start
      setTimeout(() => {
        if (!startupComplete) {
          this.stop();
          reject(new Error('Server startup timeout'));
        }
      }, 10000);
    });
  }

  // Get appropriate file path
  getFilePath(url) {
    // Security: Sanitize URL input to prevent path traversal attacks
    if (!url || typeof url !== 'string') {
      return path.join(this.rootDir, 'index.html');
    }
    
    // Remove query parameters and decode URI components safely
    const cleanUrl = url.split('?')[0];
    
    // Default to index.html for root path
    const requestedPath = cleanUrl === '/' ? 'index.html' : cleanUrl;
    
    // Security: Normalize and resolve the path to prevent directory traversal
    const resolvedPath = path.resolve(this.rootDir, requestedPath);
    
    // Security: Ensure the resolved path is within the root directory
    const normalizedRoot = path.resolve(this.rootDir);
    if (!resolvedPath.startsWith(normalizedRoot + path.sep) && resolvedPath !== normalizedRoot) {
      console.warn(`⚠️ Path traversal attempt blocked: ${url}`);
      return path.join(this.rootDir, 'index.html');
    }

    return resolvedPath;
  }

  // Get content type for file
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    return types[ext] || 'text/plain';
  }

  // Wait for server to be ready
  async waitForReady(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await this.checkHealth();
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error(`Server not ready after ${timeout}ms`);
  }

  // Health check with bulletproof error handling
  async checkHealth() {
    try {
      const fetch = require('node-fetch');
      return await fetch(`http://localhost:${this.port}/`, {
        timeout: 2000
      });
    } catch (error) {
      // If node-fetch import fails, use curl fallback
      const { spawn } = require('child_process');
      return new Promise((resolve) => {
        const curl = spawn('curl', ['-f', `http://localhost:${this.port}/`], {
          stdio: 'ignore'
        });
        
        curl.on('exit', (code) => {
          resolve({ ok: code === 0, status: code === 0 ? 200 : 500 });
        });
        
        curl.on('error', () => {
          resolve({ ok: false, status: 500 });
        });
      });
    }
  }

  // Stop server with proper cleanup
  async stop() {
    if (!this.isRunning) {
      return;
    }

    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        this.server = null;
      }

      if (this.process) {
        this.process.kill('SIGTERM');
        
        // Wait for graceful shutdown
        await new Promise((resolve) => {
          this.process.on('exit', resolve);
          setTimeout(() => {
            this.process.kill('SIGKILL');
            resolve();
          }, 5000);
        });
        
        this.process = null;
      }

      this.isRunning = false;
      console.log(`✅ Test server stopped`);
    } catch (error) {
      console.warn(`⚠️ Error stopping server: ${error.message}`);
    }
  }

  // Make HTTP request to test server
  async makeRequest(path) {
    const http = require('http');
    return new Promise((resolve, reject) => {
      const url = `http://localhost:${this.port}${path}`;
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: async () => data
          });
        });
      }).on('error', reject);
    });
  }

  // Get server URL
  getUrl() {
    return `http://localhost:${this.port}`;
  }
}

// Export for use in tests
module.exports = TestServer;