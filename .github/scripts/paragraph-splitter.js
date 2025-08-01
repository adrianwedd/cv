#!/usr/bin/env node

/**
 * Paragraph Splitter & Content Formatter
 * 
 * Improves CV readability by breaking down long paragraphs into digestible chunks,
 * removing AI meta-commentary, and optimizing content structure for better UX.
 * 
 * Features:
 * - Intelligent paragraph splitting based on sentence structure
 * - AI meta-commentary removal (Claude-specific patterns)
 * - Bullet point extraction and formatting
 * - Sentence length optimization
 * - ATS-friendly formatting preservation
 * 
 * Usage: node paragraph-splitter.js [--input file.json] [--test]
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Advanced Content Formatter for CV Readability
 */
class ParagraphSplitter {
    constructor() {
        this.maxParagraphLength = 400; // Maximum characters per paragraph
        this.maxSentenceLength = 120;  // Maximum characters per sentence
        this.targetSentencesPerParagraph = 3; // Optimal sentences per paragraph
        
        // AI meta-commentary patterns to remove
        this.metaCommentaryPatterns = [
            /^Here's an enhanced.*?:/i,
            /^\*\*Enhanced.*?\*\*\s*/,
            /\n\nThis enhancement:\s*$/,
            /The enhancement:\s*$/,
            /This enhancement:[\s\S]*?(?=\n\n[A-Z]|$)/g,
            /The numbers provided are placeholders[\s\S]*$/i,
            /- Opens with.*$/gm,
            /- Incorporates.*$/gm,
            /- Includes.*$/gm,
            /- Maintains.*$/gm,
            /- Uses.*$/gm,
            /- Focuses.*$/gm,
            /- Emphasizes.*$/gm,
            /- Concludes.*$/gm,
            /but the structure effectively[\s\S]*$/i
        ];
        
        // Sentence splitting patterns
        this.sentenceEnders = /[.!?]+(?:\s+|$)/g;
        this.listPatterns = /(?:^|\n)[-•*]\s+/gm;
    }

    /**
     * Main content processing pipeline
     */
    async processContent(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }

        console.log('📝 Processing content for readability...');
        
        // Step 1: Remove AI meta-commentary
        let cleaned = this.removeMetaCommentary(content);
        
        // Step 2: Extract and preserve any existing bullet points
        const { text: withoutBullets, bullets } = this.extractBulletPoints(cleaned);
        
        // Step 3: Split long paragraphs
        const splitParagraphs = this.splitLongParagraphs(withoutBullets);
        
        // Step 4: Optimize sentence length
        const optimizedSentences = this.optimizeSentenceLength(splitParagraphs);
        
        // Step 5: Reintegrate bullet points if any
        const final = bullets.length > 0 ? this.reintegrateBullets(optimizedSentences, bullets) : optimizedSentences;
        
        // Step 6: Final cleanup
        const result = this.finalCleanup(final);
        
        console.log(`✅ Content processed: ${content.length} → ${result.length} chars`);
        return result;
    }

    /**
     * Remove AI meta-commentary and explanation text
     */
    removeMetaCommentary(text) {
        let cleaned = text;
        
        for (const pattern of this.metaCommentaryPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }
        
        // Remove multiple consecutive newlines
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        
        // Remove trailing/leading whitespace
        return cleaned.trim();
    }

    /**
     * Extract bullet points for preservation
     */
    extractBulletPoints(text) {
        const bullets = [];
        const bulletMatches = text.match(/(?:^|\n)([-•*]\s+.*?)(?=\n|$)/gm);
        
        if (bulletMatches) {
            bullets.push(...bulletMatches.map(match => match.trim()));
        }
        
        // Remove bullets from main text (we'll add them back later)
        const textWithoutBullets = text.replace(/(?:^|\n)[-•*]\s+.*?(?=\n|$)/gm, '');
        
        return { text: textWithoutBullets, bullets };
    }

    /**
     * Split paragraphs that are too long
     */
    splitLongParagraphs(text) {
        const paragraphs = text.split(/\n\s*\n/);
        const splitParagraphs = [];
        
        for (const paragraph of paragraphs) {
            if (paragraph.trim().length <= this.maxParagraphLength) {
                splitParagraphs.push(paragraph.trim());
                continue;
            }
            
            // Split long paragraph by sentences
            const sentences = this.splitIntoSentences(paragraph);
            const newParagraphs = this.groupSentencesIntoParagraphs(sentences);
            splitParagraphs.push(...newParagraphs);
        }
        
        return splitParagraphs.filter(p => p.trim().length > 0).join('\n\n');
    }

    /**
     * Split text into individual sentences
     */
    splitIntoSentences(text) {
        // Handle common abbreviations that shouldn't be split
        const abbreviations = ['Mr.', 'Mrs.', 'Dr.', 'Prof.', 'vs.', 'etc.', 'e.g.', 'i.e.'];
        let processed = text;
        
        // Temporarily replace abbreviations
        const placeholders = {};
        abbreviations.forEach((abbr, index) => {
            const placeholder = `__ABBR_${index}__`;
            placeholders[placeholder] = abbr;
            processed = processed.replace(new RegExp(abbr.replace('.', '\\.'), 'g'), placeholder);
        });
        
        // Split by sentence endings - improved regex
        const sentences = processed.split(/[.!?]+\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        // Restore abbreviations
        return sentences.map(sentence => {
            let restored = sentence;
            Object.entries(placeholders).forEach(([placeholder, abbr]) => {
                restored = restored.replace(new RegExp(placeholder, 'g'), abbr);
            });
            return restored;
        });
    }

    /**
     * Group sentences into optimally-sized paragraphs
     */
    groupSentencesIntoParagraphs(sentences) {
        const paragraphs = [];
        let currentParagraph = [];
        let currentLength = 0;
        
        for (const sentence of sentences) {
            const sentenceLength = sentence.length;
            
            // Check if adding this sentence would exceed limits
            if (currentParagraph.length >= this.targetSentencesPerParagraph || 
                (currentLength + sentenceLength > this.maxParagraphLength && currentParagraph.length > 0)) {
                
                // Finalize current paragraph
                paragraphs.push(currentParagraph.join('. ') + '.');
                currentParagraph = [sentence];
                currentLength = sentenceLength;
            } else {
                currentParagraph.push(sentence);
                currentLength += sentenceLength;
            }
        }
        
        // Add final paragraph if any sentences remain
        if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join('. ') + '.');
        }
        
        return paragraphs;
    }

    /**
     * Optimize sentence length by splitting overly long sentences
     */
    optimizeSentenceLength(text) {
        const paragraphs = text.split(/\n\s*\n/);
        const optimizedParagraphs = [];
        
        for (const paragraph of paragraphs) {
            const sentences = this.splitIntoSentences(paragraph);
            const optimizedSentences = [];
            
            for (const sentence of sentences) {
                if (sentence.length <= this.maxSentenceLength) {
                    optimizedSentences.push(sentence);
                } else {
                    // Split long sentence at natural break points
                    const splitSentences = this.splitLongSentence(sentence);
                    optimizedSentences.push(...splitSentences);
                }
            }
            
            optimizedParagraphs.push(optimizedSentences.join('. ') + '.');
        }
        
        return optimizedParagraphs.join('\n\n');
    }

    /**
     * Split overly long sentence at natural break points
     */
    splitLongSentence(sentence) {
        const breakPoints = [
            ', and ',
            ', but ',
            ', while ',
            ', with ',
            ' that ',
            ' which ',
            ' where '
        ];
        
        // Find the best break point near the middle
        const midPoint = sentence.length / 2;
        let bestBreak = -1;
        let bestDistance = Infinity;
        
        for (const breakPoint of breakPoints) {
            const index = sentence.indexOf(breakPoint, Math.max(0, midPoint - 50));
            if (index !== -1 && Math.abs(index - midPoint) < bestDistance) {
                bestBreak = index + breakPoint.length;
                bestDistance = Math.abs(index - midPoint);
            }
        }
        
        if (bestBreak > 0) {
            const part1 = sentence.substring(0, bestBreak).trim();
            const part2 = sentence.substring(bestBreak).trim();
            
            // Capitalize the second part if it doesn't start with a capital
            const capitalizedPart2 = part2.charAt(0).toUpperCase() + part2.slice(1);
            
            return [part1, capitalizedPart2];
        }
        
        // If no good break point found, return original sentence
        return [sentence];
    }

    /**
     * Reintegrate preserved bullet points
     */
    reintegrateBullets(text, bullets) {
        if (bullets.length === 0) return text;
        
        // Add bullets at the end (could be made smarter)
        return text + '\n\n' + bullets.join('\n');
    }

    /**
     * Final cleanup and formatting
     */
    finalCleanup(text) {
        return text
            .replace(/\n{3,}/g, '\n\n')  // Normalize paragraph spacing
            .replace(/\s+/g, ' ')        // Normalize whitespace within lines
            .replace(/\n /g, '\n')       // Remove spaces at line starts
            .trim();
    }

    /**
     * Process AI enhancements file
     */
    async processAIEnhancements(filePath) {
        console.log('🔄 Processing AI enhancements file...');
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            
            let modified = false;
            
            // Process professional summary
            if (data.professionalSummary?.enhanced) {
                const original = data.professionalSummary.enhanced;
                const processed = await this.processContent(original);
                
                if (processed !== original) {
                    data.professionalSummary.enhanced = processed;
                    data.professionalSummary.readabilityOptimized = true;
                    data.professionalSummary.optimizationTimestamp = new Date().toISOString();
                    modified = true;
                    console.log('✅ Professional summary optimized');
                }
            }
            
            // Process any other enhanced content sections
            // (Can be extended for experience descriptions, etc.)
            
            if (modified) {
                // Create backup
                const backupPath = filePath + '.backup';
                await fs.copyFile(filePath, backupPath);
                
                // Save optimized version
                await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
                console.log(`💾 Optimized content saved to: ${filePath}`);
                console.log(`💾 Backup created at: ${backupPath}`);
            } else {
                console.log('ℹ️ No optimization needed - content already in good format');
            }
            
            return data;
            
        } catch (error) {
            console.error('❌ Failed to process AI enhancements:', error.message);
            throw error;
        }
    }

    /**
     * Test the splitter with sample content
     */
    async runTests() {
        console.log('🧪 Running paragraph splitter tests...');
        
        const testCases = [
            {
                name: 'AI Meta-Commentary Removal',
                input: "Here's an enhanced professional summary:\n\n**Enhanced Summary:**\nThis is the actual content.\n\nThis enhancement:\n- Opens with strong impact\n- Uses active language\n\nThe structure effectively positions the candidate.",
                expected: "This is the actual content."
            },
            {
                name: 'Long Paragraph Splitting',
                input: "This is a very long paragraph that contains multiple sentences and should be split into smaller, more digestible chunks for better readability. It has many ideas that could be separated. The content continues with even more information that makes it hard to scan quickly.",
                expectedPattern: /\n\n/ // Should contain paragraph breaks
            },
            {
                name: 'Sentence Length Optimization',
                input: "This is an extremely long sentence that contains way too much information and multiple clauses that make it very difficult to read and understand, which is exactly the kind of sentence that should be split into multiple shorter sentences for better readability and comprehension.",
                expectedPattern: /\.\s+[A-Z]/ // Should contain sentence breaks
            }
        ];
        
        let passed = 0;
        let failed = 0;
        
        for (const testCase of testCases) {
            try {
                const result = await this.processContent(testCase.input);
                
                let success = false;
                if (testCase.expected) {
                    success = result.includes(testCase.expected);
                } else if (testCase.expectedPattern) {
                    success = testCase.expectedPattern.test(result);
                }
                
                if (success) {
                    console.log(`✅ ${testCase.name}: PASSED`);
                    passed++;
                } else {
                    console.log(`❌ ${testCase.name}: FAILED`);
                    console.log(`   Input: ${testCase.input}`);
                    console.log(`   Output: ${result}`);
                    failed++;
                }
            } catch (error) {
                console.log(`❌ ${testCase.name}: ERROR - ${error.message}`);
                failed++;
            }
        }
        
        console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
        return { passed, failed };
    }
}

/**
 * Main execution function
 */
async function main() {
    const args = process.argv.slice(2);
    const splitter = new ParagraphSplitter();
    
    if (args.includes('--test')) {
        await splitter.runTests();
        return;
    }
    
    const inputFile = args.find(arg => arg.startsWith('--input='))?.replace('--input=', '') || 
                      path.join(__dirname, '../../data/ai-enhancements.json');
    
    try {
        await splitter.processAIEnhancements(inputFile);
        console.log('\n✅ **PARAGRAPH OPTIMIZATION COMPLETE**');
        console.log('🔄 Run CV generator to see the improved readability');
    } catch (error) {
        console.error('❌ Optimization failed:', error.message);
        process.exit(1);
    }
}

// Execute if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ParagraphSplitter };