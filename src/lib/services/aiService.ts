import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';

export interface AIProvider {
  name: 'groq' | 'local';
  models: string[];
  endpoint?: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
}

export interface AIRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  context?: string;
  documentId?: string;
  meetingId?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed: number;
  responseTime: number;
  confidence?: number;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentAnalysis {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  risks: string[];
  recommendations: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  confidentialityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  compliance: {
    hipaa: boolean;
    gdpr: boolean;
    iso27001: boolean;
    issues: string[];
  };
}

export interface MeetingSummary {
  summary: string;
  keyDecisions: string[];
  actionItems: Array<{
    task: string;
    assignee: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  nextSteps: string[];
  attendeeInsights: Array<{
    name: string;
    participation: 'high' | 'medium' | 'low';
    keyContributions: string[];
  }>;
  followUpRequired: boolean;
  riskFactors: string[];
  compliance: string[];
}

class AIService {
  private groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private localEndpoint = 'http://localhost:11434/api/generate';

  // Get available providers based on system settings
  async getAvailableProviders(): Promise<AIProvider[]> {
    const providers: AIProvider[] = [];

    try {
      const response = await fetch('/api/ai/providers', {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (response.ok) {
        const settings = await response.json();
        
        if (settings.groq?.enabled) {
          providers.push({
            name: 'groq',
            models: settings.groq.models,
            apiKey: settings.groq.apiKey,
            maxTokens: settings.groq.maxTokens,
            temperature: settings.groq.temperature
          });
        }

        if (settings.local?.enabled) {
          providers.push({
            name: 'local',
            models: settings.local.models,
            endpoint: settings.local.endpoint,
            maxTokens: settings.local.maxTokens,
            temperature: settings.local.temperature
          });
        }
      }
    } catch (error) {
      console.error('Error fetching AI providers:', error);
    }

    return providers;
  }

  // Send request to AI provider
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const userProfile = get(authStore.userProfile);
    if (!userProfile) throw new Error('User not authenticated');

    const provider = userProfile.preferences.aiProvider;
    const model = request.model || userProfile.preferences.aiModel;

    const startTime = Date.now();

    try {
      let response: Response;
      let responseData: any;

      if (provider === 'groq') {
        response = await this.sendGroqRequest(request, model);
        responseData = await response.json();
      } else if (provider === 'local') {
        response = await this.sendLocalRequest(request, model);
        responseData = await response.json();
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`);
      }

      const responseTime = Date.now() - startTime;

      // Log AI usage for audit and billing
      await this.logAIUsage(provider, model, request, responseTime);

      return {
        content: this.extractContent(responseData, provider),
        model,
        provider,
        tokensUsed: this.extractTokenUsage(responseData, provider),
        responseTime,
        confidence: this.extractConfidence(responseData, provider),
        suggestions: this.extractSuggestions(responseData, provider),
        metadata: {
          requestId: this.generateRequestId(),
          userId: userProfile.uid,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('AI request failed:', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  // Document analysis
  async analyzeDocument(documentId: string, content: string, documentType?: string): Promise<DocumentAnalysis> {
    const systemPrompt = `You are an AI assistant specialized in healthcare governance and document analysis for board meetings. 
    Analyze the provided document and provide a comprehensive analysis focusing on:
    1. Executive summary
    2. Key strategic points
    3. Action items and decisions required
    4. Risk assessment
    5. Compliance considerations (HIPAA, GDPR, ISO 27001)
    6. Recommendations for board consideration
    
    Be precise, professional, and focus on healthcare governance context.`;

    const prompt = `Document Type: ${documentType || 'Board Document'}
    
    Document Content:
    ${content}
    
    Please provide a detailed analysis of this document in JSON format with the following structure:
    {
      "summary": "Executive summary",
      "keyPoints": ["point1", "point2", ...],
      "actionItems": ["action1", "action2", ...],
      "risks": ["risk1", "risk2", ...],
      "recommendations": ["rec1", "rec2", ...],
      "sentiment": "positive|neutral|negative",
      "confidentialityLevel": "public|internal|confidential|restricted",
      "compliance": {
        "hipaa": true|false,
        "gdpr": true|false,
        "iso27001": true|false,
        "issues": ["issue1", "issue2", ...]
      }
    }`;

    try {
      const response = await this.sendRequest({
        prompt,
        systemPrompt,
        documentId,
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxTokens: 2048
      });

      // Parse JSON response
      const analysis = JSON.parse(response.content);
      
      // Store analysis in database
      await this.storeDocumentAnalysis(documentId, analysis);

      return analysis;
    } catch (error) {
      console.error('Document analysis failed:', error);
      throw new Error('Failed to analyze document');
    }
  }

  // Meeting transcription and summary
  async generateMeetingSummary(meetingId: string, transcript: string, agenda?: string[]): Promise<MeetingSummary> {
    const systemPrompt = `You are an AI assistant specialized in healthcare board meeting analysis. 
    Generate a comprehensive meeting summary focusing on:
    1. Key decisions made
    2. Action items with clear assignments
    3. Strategic insights and next steps
    4. Risk factors and compliance considerations
    5. Attendee participation analysis
    
    Maintain professional healthcare governance context and ensure accuracy.`;

    const prompt = `Meeting Transcript:
    ${transcript}
    
    ${agenda ? `Meeting Agenda: ${agenda.join(', ')}` : ''}
    
    Please provide a detailed meeting summary in JSON format:
    {
      "summary": "Overall meeting summary",
      "keyDecisions": ["decision1", "decision2", ...],
      "actionItems": [
        {
          "task": "task description",
          "assignee": "person name",
          "dueDate": "YYYY-MM-DD",
          "priority": "high|medium|low"
        }
      ],
      "nextSteps": ["step1", "step2", ...],
      "attendeeInsights": [
        {
          "name": "attendee name",
          "participation": "high|medium|low",
          "keyContributions": ["contribution1", ...]
        }
      ],
      "followUpRequired": true|false,
      "riskFactors": ["risk1", "risk2", ...],
      "compliance": ["compliance note1", ...]
    }`;

    try {
      const response = await this.sendRequest({
        prompt,
        systemPrompt,
        meetingId,
        temperature: 0.2,
        maxTokens: 3072
      });

      const summary = JSON.parse(response.content);
      
      // Store summary in database
      await this.storeMeetingSummary(meetingId, summary);

      return summary;
    } catch (error) {
      console.error('Meeting summary generation failed:', error);
      throw new Error('Failed to generate meeting summary');
    }
  }

  // Decision support and recommendations
  async getDecisionSupport(context: string, options: string[], criteria?: string[]): Promise<{
    recommendation: string;
    analysis: Array<{
      option: string;
      pros: string[];
      cons: string[];
      riskLevel: 'low' | 'medium' | 'high';
      score: number;
    }>;
    rationale: string;
    nextSteps: string[];
  }> {
    const systemPrompt = `You are an AI advisor for healthcare board governance. 
    Provide data-driven decision support with:
    1. Objective analysis of each option
    2. Risk assessment
    3. Strategic alignment
    4. Compliance considerations
    5. Clear recommendations with rationale
    
    Focus on healthcare industry best practices and regulatory requirements.`;

    const prompt = `Decision Context:
    ${context}
    
    Available Options:
    ${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}
    
    ${criteria ? `Decision Criteria: ${criteria.join(', ')}` : ''}
    
    Please provide decision support analysis in JSON format:
    {
      "recommendation": "recommended option with brief justification",
      "analysis": [
        {
          "option": "option name",
          "pros": ["pro1", "pro2", ...],
          "cons": ["con1", "con2", ...],
          "riskLevel": "low|medium|high",
          "score": 0-100
        }
      ],
      "rationale": "detailed explanation of recommendation",
      "nextSteps": ["step1", "step2", ...]
    }`;

    try {
      const response = await this.sendRequest({
        prompt,
        systemPrompt,
        temperature: 0.4,
        maxTokens: 2560
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error('Decision support failed:', error);
      throw new Error('Failed to generate decision support');
    }
  }

  // Chat assistant for board members
  async chatWithAI(message: string, conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>): Promise<AIResponse> {
    const userProfile = get(authStore.userProfile);
    const systemPrompt = `You are an AI assistant for Board Governance AI. 
    You have expertise in:
    - Healthcare governance and compliance
    - Strategic planning and decision making
    - Risk management and quality assurance
    - Financial analysis for healthcare organizations
    - Pediatric healthcare and research
    - Qatar healthcare regulations
    
    Provide helpful, accurate, and professional responses. Always consider the healthcare context and board governance responsibilities.
    
    Current user: ${userProfile?.displayName} (${userProfile?.position})`;

    const conversationContext = conversationHistory 
      ? conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      : '';

    const fullPrompt = conversationContext 
      ? `${conversationContext}\nuser: ${message}`
      : message;

    return await this.sendRequest({
      prompt: fullPrompt,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 1024
    });
  }

  // Risk analysis
  async analyzeRisks(scenario: string, category?: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    risks: Array<{
      risk: string;
      probability: number;
      impact: number;
      mitigation: string;
      category: string;
    }>;
    recommendations: string[];
    monitoringPoints: string[];
  }> {
    const systemPrompt = `You are a risk management expert for healthcare organizations. 
    Analyze the provided scenario for potential risks including:
    - Clinical risks
    - Financial risks
    - Regulatory compliance risks
    - Operational risks
    - Reputational risks
    - Strategic risks
    
    Provide quantitative assessment where possible and practical mitigation strategies.`;

    const prompt = `Risk Analysis Scenario:
    ${scenario}
    
    ${category ? `Focus Category: ${category}` : ''}
    
    Please provide risk analysis in JSON format:
    {
      "riskLevel": "low|medium|high|critical",
      "risks": [
        {
          "risk": "risk description",
          "probability": 0-100,
          "impact": 0-100,
          "mitigation": "mitigation strategy",
          "category": "clinical|financial|regulatory|operational|reputational|strategic"
        }
      ],
      "recommendations": ["rec1", "rec2", ...],
      "monitoringPoints": ["monitor1", "monitor2", ...]
    }`;

    try {
      const response = await this.sendRequest({
        prompt,
        systemPrompt,
        temperature: 0.3,
        maxTokens: 2048
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error('Risk analysis failed:', error);
      throw new Error('Failed to analyze risks');
    }
  }

  // Private methods for provider-specific requests
  private async sendGroqRequest(request: AIRequest, model: string): Promise<Response> {
    const providers = await this.getAvailableProviders();
    const groqProvider = providers.find(p => p.name === 'groq');
    
    if (!groqProvider) {
      throw new Error('Groq provider not available');
    }

    return fetch(this.groqEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqProvider.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature || groqProvider.temperature,
        max_tokens: request.maxTokens || groqProvider.maxTokens,
        stream: false
      })
    });
  }

  private async sendLocalRequest(request: AIRequest, model: string): Promise<Response> {
    const providers = await this.getAvailableProviders();
    const localProvider = providers.find(p => p.name === 'local');
    
    if (!localProvider) {
      throw new Error('Local LLM provider not available');
    }

    const endpoint = localProvider.endpoint || this.localEndpoint;

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: request.systemPrompt ? `${request.systemPrompt}\n\n${request.prompt}` : request.prompt,
        temperature: request.temperature || localProvider.temperature,
        max_tokens: request.maxTokens || localProvider.maxTokens,
        stream: false
      })
    });
  }

  // Utility methods
  private extractContent(responseData: any, provider: string): string {
    if (provider === 'groq') {
      return responseData.choices?.[0]?.message?.content || '';
    } else if (provider === 'local') {
      return responseData.response || '';
    }
    return '';
  }

  private extractTokenUsage(responseData: any, provider: string): number {
    if (provider === 'groq') {
      return responseData.usage?.total_tokens || 0;
    } else if (provider === 'local') {
      return responseData.eval_count || 0;
    }
    return 0;
  }

  private extractConfidence(responseData: any, provider: string): number | undefined {
    // Implementation depends on provider response format
    return undefined;
  }

  private extractSuggestions(responseData: any, provider: string): string[] | undefined {
    // Implementation depends on provider response format
    return undefined;
  }

  private async getAuthToken(): Promise<string> {
    const user = get(authStore.user);
    if (!user) throw new Error('User not authenticated');
    return await user.getIdToken();
  }

  private generateRequestId(): string {
    return `ai-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logAIUsage(provider: string, model: string, request: AIRequest, responseTime: number): Promise<void> {
    try {
      await fetch('/api/ai/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          provider,
          model,
          tokensUsed: request.maxTokens || 0,
          responseTime,
          requestType: request.documentId ? 'document_analysis' : request.meetingId ? 'meeting_summary' : 'chat',
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging AI usage:', error);
    }
  }

  private async storeDocumentAnalysis(documentId: string, analysis: DocumentAnalysis): Promise<void> {
    try {
      await fetch('/api/documents/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          documentId,
          analysis,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error storing document analysis:', error);
    }
  }

  private async storeMeetingSummary(meetingId: string, summary: MeetingSummary): Promise<void> {
    try {
      await fetch('/api/meetings/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          meetingId,
          summary,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error storing meeting summary:', error);
    }
  }
}

export const aiService = new AIService(); 