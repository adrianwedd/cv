#!/usr/bin/env node

/**
 * Asset Versioning & Cache Busting System
 * Implements proper asset versioning with hash-based cache busting
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../');

class AssetVersioningSystem {
    constructor() {
        this.assetMap = new Map();
        this.versionedAssets = new Map();
        this.manifestPath = path.join(repoRoot, 'assets/asset-manifest.json');
    }

    async implementVersioning() {
        console.log('🔄 Asset Versioning & Cache Busting System');
        console.log('==========================================\n');

        try {
            // Generate asset hashes and versions
            await this.generateAssetVersions();
            
            // Create versioned asset files
            await this.createVersionedAssets();
            
            // Generate asset manifest
            await this.generateAssetManifest();
            
            // Update HTML references
            await this.updateHTMLReferences();
            
            // Create cache-busting service worker
            await this.createCacheBustingServiceWorker();
            
            console.log('✅ Asset versioning system implemented successfully\n');
            
        } catch (error) {
            console.error('❌ Asset versioning failed:', error);
            throw error;
        }
    }

    async generateAssetVersions() {
        console.log('📦 Generating asset versions and hashes...');
        
        const consolidatedDir = path.join(repoRoot, 'assets/consolidated');
        const assetFiles = await this.getAssetFiles(consolidatedDir);
        
        for (const file of assetFiles) {
            const content = await fs.readFile(file, 'utf8');
            const hash = this.generateContentHash(content);
            const shortHash = hash.substring(0, 8);
            
            const filename = path.basename(file);
            const extension = path.extname(filename);
            const basename = path.basename(filename, extension);
            
            const versionedName = `${basename}-${shortHash}${extension}`;
            
            this.assetMap.set(filename, {
                original: file,
                hash: hash,
                shortHash: shortHash,
                versionedName: versionedName,
                size: content.length,
                lastModified: (await fs.stat(file)).mtime
            });
        }
        
        console.log(`   ✅ Generated versions for ${assetFiles.length} assets\n`);
    }

    async createVersionedAssets() {
        console.log('🏗️  Creating versioned asset files...');
        
        const versionedDir = path.join(repoRoot, 'assets/versioned');
        await fs.mkdir(versionedDir, { recursive: true });
        
        for (const [filename, assetInfo] of this.assetMap.entries()) {
            const sourcePath = assetInfo.original;
            const versionedPath = path.join(versionedDir, assetInfo.versionedName);
            
            // Copy original to versioned location
            await fs.copyFile(sourcePath, versionedPath);
            
            // Add cache headers as comment
            const content = await fs.readFile(sourcePath, 'utf8');
            const extension = path.extname(filename);
            let versionedContent = content;
            
            if (extension === '.css') {
                versionedContent = `/* Asset Version: ${assetInfo.shortHash} | Generated: ${new Date().toISOString()} */\n${content}`;
            } else if (extension === '.js') {
                versionedContent = `/* Asset Version: ${assetInfo.shortHash} | Generated: ${new Date().toISOString()} */\n${content}`;
            }
            
            await fs.writeFile(versionedPath, versionedContent);
        }
        
        console.log(`   ✅ Created ${this.assetMap.size} versioned assets\n`);
    }

    async generateAssetManifest() {
        console.log('📋 Generating asset manifest...');
        
        const manifest = {
            version: '1.0.0',
            generated: new Date().toISOString(),
            assets: {},
            integrity: {},
            cacheBusting: {
                strategy: 'hash-based',
                maxAge: 31536000, // 1 year in seconds
                immutable: true
            }
        };
        
        for (const [filename, assetInfo] of this.assetMap.entries()) {
            manifest.assets[filename] = {
                versioned: assetInfo.versionedName,
                hash: assetInfo.shortHash,
                size: assetInfo.size,
                lastModified: assetInfo.lastModified.toISOString(),
                path: `/assets/versioned/${assetInfo.versionedName}`
            };
            
            // Generate SRI hash for security
            manifest.integrity[assetInfo.versionedName] = `sha256-${assetInfo.hash}`;
        }
        
        await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2));
        
        console.log(`   ✅ Asset manifest generated: ${this.manifestPath}\n`);
    }

    async updateHTMLReferences() {
        console.log('🔗 Updating HTML asset references...');
        
        const htmlFiles = [
            path.join(repoRoot, 'index.html'),
            path.join(repoRoot, 'dashboards.html'),
            // Add other HTML files as needed
        ];
        
        const manifest = JSON.parse(await fs.readFile(this.manifestPath, 'utf8'));
        
        for (const htmlFile of htmlFiles) {
            try {
                let content = await fs.readFile(htmlFile, 'utf8');
                let updated = false;
                
                // Update CSS references
                for (const [original, assetInfo] of Object.entries(manifest.assets)) {
                    if (original.endsWith('.css')) {
                        const oldRef = `assets/consolidated/${original}`;
                        const newRef = `assets/versioned/${assetInfo.versioned}`;
                        const integrity = manifest.integrity[assetInfo.versioned];
                        
                        if (content.includes(oldRef)) {
                            // Update link tag with versioned asset and integrity
                            content = content.replace(
                                new RegExp(`<link[^>]*href=["'][^"']*${original}["'][^>]*>`, 'g'),
                                `<link rel="stylesheet" href="${newRef}" integrity="${integrity}" crossorigin="anonymous">`
                            );
                            updated = true;
                        }
                    }
                }
                
                // Update JS references
                for (const [original, assetInfo] of Object.entries(manifest.assets)) {
                    if (original.endsWith('.js')) {
                        const oldRef = `assets/consolidated/${original}`;
                        const newRef = `assets/versioned/${assetInfo.versioned}`;
                        const integrity = manifest.integrity[assetInfo.versioned];
                        
                        if (content.includes(oldRef)) {
                            // Update script tag with versioned asset and integrity
                            content = content.replace(
                                new RegExp(`<script[^>]*src=["'][^"']*${original}["'][^>]*>`, 'g'),
                                `<script src="${newRef}" integrity="${integrity}" crossorigin="anonymous">`
                            );
                            updated = true;
                        }
                    }
                }
                
                if (updated) {
                    await fs.writeFile(htmlFile, content);
                    console.log(`   ✅ Updated references in: ${path.basename(htmlFile)}`);
                }
                
            } catch (error) {
                console.warn(`   ⚠️  Could not update: ${path.basename(htmlFile)}`);
            }
        }
        
        console.log();
    }

    async createCacheBustingServiceWorker() {
        console.log('⚙️  Creating cache-busting service worker...');
        
        const manifest = JSON.parse(await fs.readFile(this.manifestPath, 'utf8'));
        
        const serviceWorkerContent = `
// Cache-Busting Service Worker
// Generated: ${new Date().toISOString()}
// Asset Version: ${manifest.version}

const CACHE_NAME = 'cv-assets-v${manifest.version}';
const ASSET_MANIFEST = ${JSON.stringify(manifest, null, 2)};

// Assets to cache with versioning
const VERSIONED_ASSETS = [
  ${Object.values(manifest.assets).map(asset => `'${asset.path}'`).join(',\n  ')}
];

// Install event - cache versioned assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching versioned assets:', VERSIONED_ASSETS);
        return cache.addAll(VERSIONED_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('cv-assets-') && cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve cached assets with cache busting
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle versioned assets
  if (url.pathname.includes('/assets/versioned/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            // Add immutable cache headers
            const headers = new Headers(response.headers);
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: headers
            });
          }
          
          // If not in cache, fetch with cache-busting headers
          return fetch(event.request, {
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
        })
    );
  }
  
  // Handle non-versioned assets with cache busting
  else if (url.pathname.includes('/assets/')) {
    event.respondWith(
      fetch(event.request, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
    );
  }
});

// Message event for manual cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_ASSETS') {
    // Force update of cached assets
    caches.delete(CACHE_NAME)
      .then(() => {
        return caches.open(CACHE_NAME);
      })
      .then(cache => {
        return cache.addAll(VERSIONED_ASSETS);
      });
  }
});
`;

        const swPath = path.join(repoRoot, 'sw-versioned.js');
        await fs.writeFile(swPath, serviceWorkerContent);
        
        console.log(`   ✅ Service worker created: ${swPath}\n`);
    }

    async getAssetFiles(dir) {
        try {
            const files = [];
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                if (item.isFile() && (item.name.endsWith('.css') || item.name.endsWith('.js'))) {
                    files.push(path.join(dir, item.name));
                }
            }
            
            return files;
        } catch (error) {
            return [];
        }
    }

    generateContentHash(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const versioningSystem = new AssetVersioningSystem();
    versioningSystem.implementVersioning().catch(error => {
        console.error('❌ Asset versioning failed:', error);
        process.exit(1);
    });
}

export { AssetVersioningSystem };