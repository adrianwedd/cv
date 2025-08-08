#!/usr/bin/env node

/**
 * Data Validator - Comprehensive CV Data Integrity Checker
 * Ensures all CV data meets quality standards and is verified
 */

import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DataValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);
    this.errors = [];
    this.warnings = [];
    this.validationResults = {};
  }

  loadSchema() {
    try {
      const schemaPath = path.join(__dirname, '../../data/cv-schema.json');
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      this.validate = this.ajv.compile(schema);
      console.log('✅ Schema loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load schema:', error.message);
      return false;
    }
  }

  loadCVData() {
    try {
      const cvPath = path.join(__dirname, '../../data/base-cv.json');
      this.cvData = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
      console.log('✅ CV data loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load CV data:', error.message);
      return false;
    }
  }

  validateSchema() {
    if (!this.validate) {
      this.errors.push('Schema validator not initialized');
      return false;
    }

    const valid = this.validate(this.cvData);
    if (!valid) {
      this.errors.push(...this.validate.errors.map(err => 
        `Schema violation at ${err.instancePath}: ${err.message}`
      ));
      return false;
    }

    console.log('✅ Schema validation passed');
    return true;
  }

  validateVerification() {
    let verificationScore = 0;
    let totalItems = 0;

    // Check experience verification
    if (this.cvData.experience) {
      this.cvData.experience.forEach(exp => {
        totalItems++;
        if (exp.verified === true) {
          verificationScore++;
        } else {
          this.warnings.push(`Unverified experience: ${exp.position} at ${exp.company}`);
        }
      });
    }

    // Check skills verification
    if (this.cvData.skills) {
      this.cvData.skills.forEach(skill => {
        totalItems++;
        if (skill.verified === true) {
          verificationScore++;
        } else {
          this.warnings.push(`Unverified skill: ${skill.name}`);
        }
      });
    }

    // Check projects verification
    if (this.cvData.projects) {
      this.cvData.projects.forEach(project => {
        totalItems++;
        if (project.verified === true) {
          verificationScore++;
        } else {
          this.warnings.push(`Unverified project: ${project.name}`);
        }
      });
    }

    // Check achievements verification
    if (this.cvData.achievements) {
      this.cvData.achievements.forEach(achievement => {
        totalItems++;
        if (achievement.verified === true) {
          verificationScore++;
        } else {
          this.warnings.push(`Unverified achievement: ${achievement.title}`);
        }
      });
    }

    const verificationRate = totalItems > 0 ? (verificationScore / totalItems) * 100 : 0;
    this.validationResults.verificationRate = verificationRate.toFixed(1);
    
    if (verificationRate < 50) {
      this.errors.push(`Critical: Only ${verificationRate.toFixed(1)}% of content is verified`);
      return false;
    }

    console.log(`✅ Verification rate: ${verificationRate.toFixed(1)}%`);
    return true;
  }

  validateContentQuality() {
    const issues = [];

    // Check for hyperbolic language
    const hyperbolicPatterns = [
      /\b\d+%\s+(improvement|increase|reduction|efficiency)/gi,
      /\b(revolutionary|groundbreaking|unprecedented|world-class)\b/gi,
      /\b(10x|100x|1000x)\b/gi,
      /\b(millions?|billions?)\s+of\s+users?\b/gi
    ];

    const checkText = (text, location) => {
      hyperbolicPatterns.forEach(pattern => {
        if (pattern.test(text)) {
          issues.push(`Hyperbolic language in ${location}: ${text.substring(0, 100)}`);
        }
      });
    };

    // Check professional summary
    if (this.cvData.professional_summary) {
      checkText(this.cvData.professional_summary, 'professional_summary');
    }

    // Check experience descriptions
    if (this.cvData.experience) {
      this.cvData.experience.forEach((exp, i) => {
        checkText(exp.description, `experience[${i}].description`);
        if (exp.achievements) {
          exp.achievements.forEach((ach, j) => {
            checkText(ach, `experience[${i}].achievements[${j}]`);
          });
        }
      });
    }

    if (issues.length > 0) {
      this.warnings.push(...issues);
    }

    console.log(`✅ Content quality check: ${issues.length} issues found`);
    return issues.length < 5; // Allow some flexibility
  }

  validateDates() {
    const currentYear = new Date().getFullYear();
    const issues = [];

    if (this.cvData.experience) {
      this.cvData.experience.forEach(exp => {
        if (exp.period) {
          const match = exp.period.match(/(\d{4})\s*-\s*(\d{4}|Present)/);
          if (match) {
            const startYear = parseInt(match[1]);
            const endYear = match[2] === 'Present' ? currentYear : parseInt(match[2]);
            
            if (startYear > currentYear) {
              issues.push(`Future start date in ${exp.position}: ${exp.period}`);
            }
            if (endYear > currentYear && match[2] !== 'Present') {
              issues.push(`Future end date in ${exp.position}: ${exp.period}`);
            }
            if (startYear > endYear) {
              issues.push(`Invalid date range in ${exp.position}: ${exp.period}`);
            }
          }
        }
      });
    }

    if (issues.length > 0) {
      this.errors.push(...issues);
      return false;
    }

    console.log('✅ Date validation passed');
    return true;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      validator_version: '1.0.0',
      overall_status: this.errors.length === 0 ? 'PASSED' : 'FAILED',
      quality_score: this.calculateQualityScore(),
      errors: this.errors,
      warnings: this.warnings,
      validation_results: this.validationResults,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(__dirname, '../../data/validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  calculateQualityScore() {
    let score = 100;
    
    // Deduct for errors (10 points each)
    score -= this.errors.length * 10;
    
    // Deduct for warnings (2 points each)
    score -= this.warnings.length * 2;
    
    // Bonus for high verification rate
    const verificationBonus = parseFloat(this.validationResults.verificationRate || 0) / 10;
    score += verificationBonus;
    
    return Math.max(0, Math.min(100, score));
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.validationResults.verificationRate < 80) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Increase content verification',
        details: 'Verify all skills, projects, and achievements with evidence'
      });
    }
    
    if (this.warnings.length > 10) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Review content quality',
        details: 'Remove hyperbolic language and unverified claims'
      });
    }
    
    if (this.errors.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Fix validation errors',
        details: 'Address all schema and date validation errors immediately'
      });
    }
    
    return recommendations;
  }

  async run() {
    console.log('🔍 Starting CV Data Validation...\n');
    
    // Load schema and data
    if (!this.loadSchema()) return false;
    if (!this.loadCVData()) return false;
    
    // Run validations
    const schemaValid = this.validateSchema();
    const verificationValid = this.validateVerification();
    const contentValid = this.validateContentQuality();
    const datesValid = this.validateDates();
    
    // Generate report
    const report = this.generateReport();
    
    // Output results
    console.log('\n📊 Validation Report:');
    console.log('====================');
    console.log(`Status: ${report.overall_status}`);
    console.log(`Quality Score: ${report.quality_score}/100`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log(`Verification Rate: ${this.validationResults.verificationRate}%`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    if (this.warnings.length > 0 && this.warnings.length <= 10) {
      console.log('\n⚠️ Warnings:');
      this.warnings.slice(0, 10).forEach(warn => console.log(`  - ${warn}`));
      if (this.warnings.length > 10) {
        console.log(`  ... and ${this.warnings.length - 10} more`);
      }
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  [${rec.priority}] ${rec.action}`);
        console.log(`    ${rec.details}`);
      });
    }
    
    console.log('\n✅ Validation complete. Report saved to data/validation-report.json');
    
    return report.overall_status === 'PASSED';
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new DataValidator();
  validator.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default DataValidator;