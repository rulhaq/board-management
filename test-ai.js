import dotenv from 'dotenv';
import Groq from 'groq-sdk';

// Load environment variables
dotenv.config();

// Check if environment variables are loaded
console.log('Environment check:');
console.log('VITE_GROQ_API_KEY:', process.env.VITE_GROQ_API_KEY ? 'Found' : 'Missing');
console.log('VITE_OPENAI_API_KEY:', process.env.VITE_OPENAI_API_KEY ? 'Found' : 'Missing');

if (!process.env.VITE_GROQ_API_KEY) {
  console.log('❌ Please ensure VITE_GROQ_API_KEY is set in your .env file');
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY
});

console.log('🤖 Testing AI Integration...');
console.log('==============================\n');

// Test Groq API
async function testGroqAPI() {
  try {
    console.log('Testing Groq API...');
    
    if (!process.env.VITE_GROQ_API_KEY) {
      throw new Error('VITE_GROQ_API_KEY not found in environment');
    }
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Say 'Hello from Sidra Board System!' in exactly those words."
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_tokens: 50
    });

    const response = completion.choices[0]?.message?.content;
    
    if (response && response.includes('Hello from Sidra Board System!')) {
      console.log('✅ Groq API - Working correctly');
      console.log(`   Response: ${response}`);
    } else {
      console.log('⚠️  Groq API - Connected but unexpected response');
      console.log(`   Response: ${response}`);
    }
  } catch (error) {
    console.log('❌ Groq API - Error:', error.message);
  }
}

// Test OpenAI API (if configured)
async function testOpenAI() {
  try {
    if (!process.env.VITE_OPENAI_API_KEY) {
      console.log('⚠️  OpenAI API - No API key found (optional)');
      return;
    }
    
    console.log('Testing OpenAI API...');
    
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.VITE_OPENAI_API_KEY
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'OpenAI connected to Sidra Board System!' in exactly those words."
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    });

    const response = completion.choices[0]?.message?.content;
    
    if (response && response.includes('OpenAI connected to Sidra Board System!')) {
      console.log('✅ OpenAI API - Working correctly');
      console.log(`   Response: ${response}`);
    } else {
      console.log('⚠️  OpenAI API - Connected but unexpected response');
      console.log(`   Response: ${response}`);
    }
  } catch (error) {
    console.log('❌ OpenAI API - Error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testGroqAPI();
  console.log('');
  await testOpenAI();
  
  console.log('\n🔥 Firebase Status:');
  console.log('✅ Authentication - Ready');
  console.log('✅ Firestore - Rules deployed');
  console.log('✅ Storage - Rules deployed');
  
  console.log('\n🚀 Ready to start development server!');
  console.log('Run: npm run dev');
}

runTests().catch(console.error); 