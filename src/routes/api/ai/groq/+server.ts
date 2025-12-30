import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { message, model = 'mixtral-8x7b-32768', context = 'general' } = await request.json();

    if (!message) {
      return json({ error: 'Message is required' }, { status: 400 });
    }

    const GROQ_API_KEY = env.VITE_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      return json({ error: 'AI service not configured' }, { status: 503 });
    }

    const startTime = Date.now();

    // Create system prompt based on context
    const systemPrompt = getSystemPrompt(context);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', errorData);
      return json({ error: 'AI service temporarily unavailable' }, { status: 503 });
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    return json({
      response: data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.',
      model: model,
      usage: data.usage,
      responseTime: responseTime
    });

  } catch (error) {
    console.error('AI service error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

function getSystemPrompt(context: string): string {
  const basePrompt = `You are an AI assistant for Board Governance AI. You are knowledgeable about board governance, board operations, and administration. You should be professional, helpful, and focused on board-related matters.`;

  switch (context) {
    case 'board_governance':
      return `${basePrompt}

You specialize in:
- Board governance best practices
- Meeting management and procedures
- Document management and compliance
- Strategic planning and oversight
- Risk management and audit
- Healthcare regulatory compliance
- Financial oversight and budgeting
- Quality and patient safety governance

Always provide accurate, professional advice that supports effective board governance and decision-making. If asked about specific medical treatments or patient care, redirect to appropriate clinical resources.`;

    case 'documents':
      return `${basePrompt}

You specialize in document management for healthcare boards:
- Document classification and confidentiality levels
- Version control and approval workflows
- Compliance documentation requirements
- Board meeting materials preparation
- Policy and procedure documentation
- Audit trail and record keeping

Help users understand document management best practices and compliance requirements.`;

    case 'meetings':
      return `${basePrompt}

You specialize in board meeting management:
- Meeting planning and scheduling
- Agenda preparation and management
- Minutes taking and approval processes
- Action item tracking and follow-up
- Quorum requirements and voting procedures
- Virtual meeting best practices
- Meeting effectiveness and evaluation

Provide guidance on efficient and compliant board meeting operations.`;

    case 'reports':
      return `${basePrompt}

You specialize in board reporting and analytics:
- Key performance indicators for healthcare boards
- Financial reporting and analysis
- Quality and safety metrics
- Compliance reporting requirements
- Dashboard and visualization best practices
- Trend analysis and insights

Help users understand and interpret board-level reports and metrics.`;

    default:
      return basePrompt;
  }
} 