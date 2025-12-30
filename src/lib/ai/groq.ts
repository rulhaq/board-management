import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true // Note: In production, use a server-side proxy
});

export const quickDocumentSummary = async (documentText: string): Promise<string> => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise summaries of board documents. Keep summaries under 200 words and focus on key decisions, actions, and implications."
        },
        {
          role: "user",
          content: `Please provide a concise summary of this document:\n\n${documentText}`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_tokens: 300
    });

    return completion.choices[0]?.message?.content || 'Unable to generate summary';
  } catch (error) {
    console.error('Error generating quick summary:', error);
    throw error;
  }
};

export const realTimeTranscription = async (audioText: string): Promise<string> => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional meeting transcription assistant. Clean up and format the provided speech-to-text output into professional meeting notes."
        },
        {
          role: "user",
          content: `Please clean up and format this meeting transcript:\n\n${audioText}`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_tokens: 1000
    });

    return completion.choices[0]?.message?.content || 'Unable to process transcription';
  } catch (error) {
    console.error('Error processing transcription:', error);
    throw error;
  }
};

export const generateVoteAnalysis = async (
  voteResults: any[],
  voteDescription: string
): Promise<string> => {
  try {
    const resultsText = voteResults.map(result => 
      `${result.userName}: ${result.optionText}`
    ).join('\n');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a governance analyst. Analyze voting results and provide insights on consensus, dissent, and implications."
        },
        {
          role: "user",
          content: `Analyze these voting results for: ${voteDescription}\n\nResults:\n${resultsText}\n\nProvide a brief analysis of the outcome and its implications.`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.2,
      max_tokens: 400
    });

    return completion.choices[0]?.message?.content || 'Unable to analyze vote results';
  } catch (error) {
    console.error('Error analyzing vote results:', error);
    throw error;
  }
};

export const chatAssistant = async (
  userMessage: string,
  context?: string
): Promise<string> => {
  try {
    const systemMessage = `You are an AI assistant for a board document management system. 
You help board members with:
- Finding documents and information
- Understanding meeting procedures
- Explaining governance topics
- Providing quick answers about board activities

${context ? `Current context: ${context}` : ''}

Keep responses concise and professional.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 500
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I cannot process your request at this time.';
  } catch (error) {
    console.error('Error with chat assistant:', error);
    throw error;
  }
}; 