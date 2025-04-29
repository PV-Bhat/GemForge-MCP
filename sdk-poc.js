/**
 * Proof of Concept for @google/generative-ai SDK
 * 
 * This file demonstrates basic usage of the SDK to understand:
 * - Authentication
 * - Request formats
 * - Response handling
 * - Error handling
 * 
 * Run with: node sdk-poc.js
 * Requires API key in environment variable: GEMINI_API_KEY
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

// Get API key from environment
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable not set. Please set it before running this script.');
  process.exit(1);
}

// Initialize the SDK
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Basic text generation example
 */
async function testBasicTextGeneration() {
  try {
    console.log('\n=== Testing Basic Text Generation ===');
    
    // Get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Generate content with a simple text prompt
    const prompt = 'Write a short poem about programming.';
    console.log(`Prompt: "${prompt}"`);
    
    const result = await model.generateContent(prompt);
    
    // Extract and display the response text
    console.log('\nResponse:');
    console.log(result.response.text());
    
    // Examine the full response object structure
    console.log('\nFull Response Structure:');
    console.log(JSON.stringify(result, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error in basic text generation:', error);
    return false;
  }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  try {
    console.log('\n=== Testing Error Handling ===');
    
    // Attempt to use a non-existent model
    const invalidModel = genAI.getGenerativeModel({ model: 'non-existent-model' });
    
    const prompt = 'This should fail.';
    console.log(`Using invalid model name with prompt: "${prompt}"`);
    
    await invalidModel.generateContent(prompt);
    
    // If we get here, the request didn't fail as expected
    console.log('Error: Request with invalid model did not fail as expected');
    return false;
  } catch (error) {
    // This is expected - we're testing error handling
    console.log('\nExpected Error:');
    console.log(`Error type: ${error.constructor.name}`);
    console.log(`Error message: ${error.message}`);
    
    // See if there are other properties on the error object
    console.log('\nError properties:');
    const errorProps = Object.getOwnPropertyNames(error);
    for (const prop of errorProps) {
      if (prop !== 'stack') {
        console.log(`- ${prop}: ${JSON.stringify(error[prop])}`);
      }
    }
    
    return true;
  }
}

/**
 * Test more complex request with parameters
 */
async function testComplexRequest() {
  try {
    console.log('\n=== Testing Complex Request with Parameters ===');
    
    // Get the model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 200,
      }
    });
    
    // Build a more complex prompt with structured content
    const requestContent = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Write exactly 3 facts about space exploration.' }
          ]
        }
      ]
    };
    
    console.log('Request content:', JSON.stringify(requestContent, null, 2));
    
    const result = await model.generateContent(requestContent);
    
    console.log('\nResponse:');
    console.log(result.response.text());
    
    return true;
  } catch (error) {
    console.error('Error in complex request:', error);
    return false;
  }
}

/**
 * Test streaming response
 */
async function testStreamingResponse() {
  try {
    console.log('\n=== Testing Streaming Response ===');
    
    // Get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Generate content with a simple text prompt
    const prompt = 'Count from 1 to 5, with a brief pause between each number.';
    console.log(`Prompt: "${prompt}"`);
    
    // Generate streaming response
    const result = await model.generateContentStream(prompt);
    
    console.log('\nStreaming Response:');
    
    // Process the stream
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      console.log(`Chunk received: "${chunkText}"`);
    }
    
    // Get the full response at the end
    console.log('\nFull Response:');
    console.log(await result.response.text());
    
    return true;
  } catch (error) {
    console.error('Error in streaming response:', error);
    return false;
  }
}

/**
 * Run all tests and report results
 */
async function runTests() {
  const testResults = {
    basicTextGeneration: false,
    errorHandling: false,
    complexRequest: false,
    streamingResponse: false
  };
  
  // Run the tests
  testResults.basicTextGeneration = await testBasicTextGeneration();
  testResults.errorHandling = await testErrorHandling();
  testResults.complexRequest = await testComplexRequest();
  testResults.streamingResponse = await testStreamingResponse();
  
  // Report summary
  console.log('\n=== Test Results Summary ===');
  for (const [test, result] of Object.entries(testResults)) {
    console.log(`${test}: ${result ? '✅ PASSED' : '❌ FAILED'}`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});
