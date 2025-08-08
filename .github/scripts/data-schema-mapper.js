#!/usr/bin/env node

/**
 * Data Schema Mapper - Intelligent CV Data Structure Alignment
 * 
 * Maps between different CV data structures and provides validation
 * with automatic migration capabilities.
 * 
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

class DataSchemaMapper {
  constructor() {
    this.mappings = {
      // Map current structure to expected schema
      'expertise': 'skills',
      'career.positions': 'experience',
      'portfolio': 'projects',
      'recognition': 'achievements',
      'credentials': 'education'
    };
  }

  async mapCVStructure() {
    console.log('🔄 Mapping CV Data Structure\n');

    const cvPath = path.join(ROOT_DIR, 'data', 'base-cv.json');
    const cvData = JSON.parse(await fs.readFile(cvPath, 'utf-8'));

    // Create mapped structure
    const mappedData = {
      ...cvData,
      // Map expertise to skills
      skills: this.mapSkills(cvData.expertise),
      // Map career.positions to experience
      experience: this.mapExperience(cvData.career?.positions || []),
      // Keep existing fields
      projects: cvData.portfolio?.projects || [],
      achievements: this.extractAchievements(cvData),
      education: this.mapEducation(cvData.credentials)
    };

    // Ensure career.positions have required fields
    if (mappedData.career?.positions) {
      mappedData.career.positions = mappedData.career.positions.map(pos => ({
        title: pos.role || pos.title || 'Position',
        company: pos.organization || pos.company || 'Organization',
        start_date: pos.period?.start || pos.start_date || '2020-01-01',
        end_date: pos.period?.end || pos.end_date || null,
        current: pos.current || false,
        description: pos.focus?.join('. ') || pos.description || '',
        achievements: pos.achievements || []
      }));
    }

    return mappedData;
  }

  mapSkills(expertise) {
    if (!expertise) return { technical: [], soft: [], certifications: [] };

    return {
      technical: [
        ...(expertise.technologies || []),
        ...(expertise.programming_languages || []),
        ...(expertise.frameworks || [])
      ],
      soft: expertise.soft_skills || [],
      certifications: expertise.certifications || []
    };
  }

  mapExperience(positions) {
    if (!positions || !Array.isArray(positions)) return [];

    return positions.map(pos => ({
      title: pos.role || pos.title || 'Position',
      organization: pos.organization || pos.company || 'Organization',
      start_date: pos.period?.start || pos.start_date || '2020-01-01',
      end_date: pos.period?.end || pos.end_date || null,
      current: pos.current || pos.period?.end === 'Present',
      description: Array.isArray(pos.focus) ? pos.focus.join('. ') : (pos.description || ''),
      protected: pos.protected || false,
      verified: pos.verified || false,
      achievements: this.mapAchievements(pos.achievements || pos.accomplishments || [])
    }));
  }

  mapAchievements(achievements) {
    if (!achievements || !Array.isArray(achievements)) return [];

    return achievements.map(ach => {
      if (typeof ach === 'string') {
        return {
          description: ach,
          protected: false,
          verified: false
        };
      }
      return {
        description: ach.description || ach.text || ach,
        protected: ach.protected || false,
        verified: ach.verified || false
      };
    });
  }

  extractAchievements(cvData) {
    const achievements = [];

    // Extract from recognition
    if (cvData.recognition?.awards) {
      achievements.push(...cvData.recognition.awards.map(award => ({
        title: award.title || award.name,
        description: award.description || award.details,
        date: award.date || award.year,
        verified: award.verified || false
      })));
    }

    // Extract from career highlights
    if (cvData.career?.highlights) {
      achievements.push(...cvData.career.highlights.map(highlight => ({
        description: highlight,
        verified: true
      })));
    }

    return achievements;
  }

  mapEducation(credentials) {
    if (!credentials) return [];

    const education = [];

    if (credentials.degrees) {
      education.push(...credentials.degrees.map(degree => ({
        degree: degree.title || degree.degree,
        institution: degree.institution || degree.school,
        year: degree.year || degree.graduation_date,
        field: degree.field || degree.major
      })));
    }

    if (credentials.certifications) {
      education.push(...credentials.certifications.map(cert => ({
        degree: cert.name || cert.title,
        institution: cert.issuer || cert.organization,
        year: cert.date || cert.year,
        type: 'certification'
      })));
    }

    return education;
  }

  async createActivitySummary() {
    console.log('📊 Creating Activity Summary\n');

    // Find the most recent activity file
    const activityDir = path.join(ROOT_DIR, 'data', 'activity');
    const files = await fs.readdir(activityDir);
    
    const activityFiles = files
      .filter(f => f.startsWith('github-activity') && f.endsWith('.json.gz'))
      .sort()
      .reverse();

    if (activityFiles.length === 0) {
      console.log('No compressed activity files found');
      return null;
    }

    // Read and decompress the most recent file
    const zlib = await import('zlib');
    const { promisify } = await import('util');
    const gunzip = promisify(zlib.gunzip);

    const latestFile = path.join(activityDir, activityFiles[0]);
    const compressed = await fs.readFile(latestFile);
    const decompressed = await gunzip(compressed);
    const activityData = JSON.parse(decompressed.toString());

    // Create summary in expected format
    const summary = {
      timestamp: new Date().toISOString(),
      analysis_period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      repositories: activityData.repositories?.slice(0, 10).map(repo => ({
        name: repo.name,
        commits: repo.recent_commits || 0,
        language: repo.language || 'Unknown',
        stars: repo.stars || 0,
        forks: repo.forks || 0
      })) || [],
      github_stats: {
        total_commits: activityData.total_commits || 0,
        total_repos: activityData.repositories?.length || 0,
        total_stars: activityData.repositories?.reduce((sum, r) => sum + (r.stars || 0), 0) || 0,
        languages: activityData.language_distribution || {}
      }
    };

    // Save activity summary
    const summaryPath = path.join(ROOT_DIR, 'data', 'activity-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

    console.log('✅ Activity summary created');
    return summary;
  }

  async updateCVWithMappedStructure() {
    console.log('🔧 Updating CV with Mapped Structure\n');

    const mappedData = await this.mapCVStructure();
    
    // Update metadata
    mappedData.metadata = {
      ...mappedData.metadata,
      last_mapped: new Date().toISOString(),
      mapping_version: '1.0.0'
    };

    // Save mapped version
    const mappedPath = path.join(ROOT_DIR, 'data', 'base-cv-mapped.json');
    await fs.writeFile(mappedPath, JSON.stringify(mappedData, null, 2));

    console.log('✅ Mapped CV structure saved to base-cv-mapped.json');
    return mappedData;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const mapper = new DataSchemaMapper();
  
  (async () => {
    try {
      await mapper.updateCVWithMappedStructure();
      await mapper.createActivitySummary();
      console.log('\n✅ Schema mapping complete');
    } catch (error) {
      console.error('❌ Mapping error:', error.message);
      process.exit(1);
    }
  })();
}

export default DataSchemaMapper;