import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Note: In production, use a server-side proxy
});

export const generateMeetingMinutes = async (
  meetingTranscript: string,
  agendaItems: any[]
): Promise<string> => {
  try {
    const prompt = `
Generate professional meeting minutes from the following transcript and agenda:

AGENDA ITEMS:
${agendaItems.map(item => `- ${item.title}: ${item.description}`).join('\n')}

TRANSCRIPT:
${meetingTranscript}

Please format the minutes in a professional structure including:
1. Meeting overview
2. Attendees
3. Key discussions for each agenda item
4. Decisions made
5. Action items with responsible parties
6. Next steps

Format in clean, professional language suitable for board records.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.3
    });

    return completion.choices[0]?.message?.content || 'Unable to generate minutes';
  } catch (error) {
    console.error('Error generating meeting minutes:', error);
    throw error;
  }
};

export const analyzeDocument = async (
  documentText: string,
  analysisType: 'summary' | 'compliance' | 'risk' | 'financial'
): Promise<string> => {
  try {
    const prompts = {
      summary: 'Provide a concise executive summary of this document, highlighting key points and recommendations.',
      compliance: 'Analyze this document for compliance issues, regulatory requirements, and potential legal concerns.',
      risk: 'Identify potential risks, threats, and mitigation strategies mentioned in this document.',
      financial: 'Analyze the financial implications, budget impacts, and monetary considerations in this document.'
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a professional business analyst specializing in board governance and corporate documents." 
        },
        { 
          role: "user", 
          content: `${prompts[analysisType]}\n\nDocument content:\n${documentText}` 
        }
      ],
      max_tokens: 1500,
      temperature: 0.2
    });

    return completion.choices[0]?.message?.content || 'Unable to analyze document';
  } catch (error) {
    console.error('Error analyzing document:', error);
    throw error;
  }
};

export const generateAgendaSuggestions = async (
  meetingType: string,
  previousMinutes?: string,
  upcomingDeadlines?: string[]
): Promise<string[]> => {
  try {
    const prompt = `
Generate agenda item suggestions for a ${meetingType} board meeting.

${previousMinutes ? `Previous meeting minutes: ${previousMinutes}` : ''}
${upcomingDeadlines ? `Upcoming deadlines: ${upcomingDeadlines.join(', ')}` : ''}

Provide 5-8 relevant agenda items that would be appropriate for this type of board meeting.
Format as a simple list of agenda item titles.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.5
    });

    const content = completion.choices[0]?.message?.content || '';
    return content.split('\n').filter(line => line.trim()).map(line => line.replace(/^[-*]\s*/, ''));
  } catch (error) {
    console.error('Error generating agenda suggestions:', error);
    return [];
  }
};

export const generateActionItems = async (
  meetingMinutes: string
): Promise<Array<{title: string, assignee: string, dueDate: string}>> => {
  try {
    const prompt = `
Extract action items from the following meeting minutes:

${meetingMinutes}

Return a JSON array of action items with the following structure:
[
  {
    "title": "Action item description",
    "assignee": "Person responsible",
    "dueDate": "YYYY-MM-DD or 'TBD'"
  }
]

Only return the JSON array, no additional text.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.1
    });

    const content = completion.choices[0]?.message?.content || '[]';
    try {
      return JSON.parse(content);
    } catch {
      return [];
    }
  } catch (error) {
    console.error('Error generating action items:', error);
    return [];
  }
}; 