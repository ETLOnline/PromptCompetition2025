// Test script to verify system prompt creation and structure
import { createSystemPrompt } from './utils/judgeLlms.js';

console.log('🧪 Testing System Prompt Creation and Structure\n');

// Test rubric with different criteria
const testRubrics = [
  // Test 1: Standard rubric
  [
    { name: 'Correctness', description: 'How correct the solution is', weight: 0.4 },
    { name: 'Efficiency', description: 'Optimal usage of resources', weight: 0.3 },
    { name: 'Creativity', description: 'Originality and ingenuity of approach', weight: 0.3 }
  ],
  
  // Test 2: Different criteria names
  [
    { name: 'Clarity', description: 'How clearly is the prompt written?', weight: 0.5 },
    { name: 'Completeness', description: 'Does it cover all requirements?', weight: 0.5 }
  ],
  
  // Test 3: Single criterion
  [
    { name: 'Overall Quality', description: 'Overall assessment of the submission', weight: 1.0 }
  ]
];

testRubrics.forEach((rubric, index) => {
  console.log(`\n📋 Test ${index + 1}: Rubric with ${rubric.length} criteria`);
  console.log('='.repeat(80));
  
  try {
    // Generate system prompt
    const systemPrompt = createSystemPrompt(rubric);
    
    // Basic validation
    console.log(`✅ System prompt generated successfully`);
    console.log(`   Length: ${systemPrompt.length} characters`);
    console.log(`   Lines: ${systemPrompt.split('\n').length}`);
    
    // Validate required XML tags
    const requiredTags = [
      '<role>',
      '<evaluation_process>',
      '<scoring_guide>',
      '<critical_instructions>',
      '<output_format>'
    ];
    
    console.log('\n🔍 Validating Required Tags:');
    requiredTags.forEach(tag => {
      if (systemPrompt.includes(tag)) {
        console.log(`   ✅ ${tag}`);
      } else {
        console.log(`   ❌ ${tag} - MISSING`);
      }
    });
    
    // Validate rubric integration
    console.log('\n🔍 Validating Rubric Integration:');
    rubric.forEach(criterion => {
      const hasInJsonSchema = systemPrompt.includes(`"${criterion.name}": <integer 0-100>`);
      if (hasInJsonSchema) {
        console.log(`   ✅ "${criterion.name}" in JSON schema`);
      } else {
        console.log(`   ❌ "${criterion.name}" missing from JSON schema`);
      }
    });
    
    // Validate key content
    console.log('\n🔍 Validating Key Content:');
    const keyContent = [
      'meticulous and impartial AI judge',
      '0-100 (integers only)',
      'JSON object',
      'scoring guide',
      'Excellent',
      'Good',
      'Average',
      'Poor',
      'Failing'
    ];
    
    keyContent.forEach(content => {
      if (systemPrompt.includes(content)) {
        console.log(`   ✅ Contains: "${content}"`);
      } else {
        console.log(`   ❌ Missing: "${content}"`);
      }
    });
    
    // Show prompt preview
    console.log('\n📝 System Prompt Preview (first 300 chars):');
    console.log('-'.repeat(50));
    console.log(systemPrompt.substring(0, 300) + (systemPrompt.length > 300 ? '...' : ''));
    console.log('-'.repeat(50));
    
    // Test JSON schema extraction
    console.log('\n🔍 JSON Schema Validation:');
    const jsonSchemaMatch = systemPrompt.match(/\{[^}]*\}/);
    if (jsonSchemaMatch) {
      console.log('   ✅ JSON schema structure found');
      console.log(`   Schema: ${jsonSchemaMatch[0]}`);
    } else {
      console.log('   ❌ JSON schema structure not found');
    }
    
  } catch (error) {
    console.error(`❌ Error in test ${index + 1}:`, error.message);
  }
});

// Test edge cases
console.log('\n\n🧪 Testing Edge Cases:');
console.log('='.repeat(80));

// Test with empty rubric
try {
  console.log('\n📋 Test: Empty Rubric');
  const emptyPrompt = createSystemPrompt([]);
  console.log(`   Length: ${emptyPrompt.length} characters`);
  console.log(`   Contains JSON schema: ${emptyPrompt.includes('{}')}`);
} catch (error) {
  console.error('   ❌ Error with empty rubric:', error.message);
}

// Test with special characters in criterion names
try {
  console.log('\n📋 Test: Special Characters in Names');
  const specialRubric = [
    { name: 'Test-Criterion', description: 'Test description', weight: 1.0 },
    { name: 'Criterion with "quotes"', description: 'Test description', weight: 1.0 }
  ];
  const specialPrompt = createSystemPrompt(specialRubric);
  console.log(`   Length: ${specialPrompt.length} characters`);
  console.log(`   Handles hyphens: ${specialPrompt.includes('Test-Criterion')}`);
  console.log(`   Handles quotes: ${specialPrompt.includes('Criterion with "quotes"')}`);
} catch (error) {
  console.error('   ❌ Error with special characters:', error.message);
}

console.log('\n\n🎯 Test Summary:');
console.log('='.repeat(80));
console.log('✅ All tests completed');
console.log('📝 Check the output above for any ❌ errors');
console.log('🔍 Verify that all required tags and content are present');
console.log('📊 System prompt should be properly structured for LLM consumption');
