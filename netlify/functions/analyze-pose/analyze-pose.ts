// netlify/functions/analyze-pose.ts

import { Handler } from '@netlify/functions';
import { OpenAI } from "openai";

interface AnalysisResult {
  mobilityAge: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
  exercises: {
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    sets?: number;
    reps?: number;
    targetMuscles: string[];
  }[];
  poseName: string;
}

class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

const parseContent = (content: string, poseName: string): AnalysisResult => {
  console.log('Starting to parse content:', content);

  try {
    const ageMatch = content.match(/Age:\s*(\d+)/i);
    if (!ageMatch) {
      console.log('Failed to find age in:', content);
      throw new AnalysisError('Unable to analyze the pose properly. Please try again with a clearer image.');
    }

    const mobilityAge = parseInt(ageMatch[1]);

    const isGoodForm = content.toLowerCase().includes('form: good') || 
                      content.toLowerCase().includes('good form');

    const feedbackMatch = content.match(/(?:Assessment|Feedback):\s*([^]*?)(?=\n\s*(?:Recommendations:|Specific Exercises:|$))/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Form assessment needed';

    const recommendationsMatch = content.match(/Recommendations:\s*([^]*?)(?=\n\s*(?:Specific Exercises:|$))/i);
    const recommendations = recommendationsMatch 
      ? recommendationsMatch[1]
          .split('\n')
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0)
      : ['Practice proper form'];

    const exerciseMatches = content.matchAll(/Exercise \d+:\s*([^]*?)(?=Exercise \d+:|$)/gs);
    const exercises = Array.from(exerciseMatches).map(match => {
      const exerciseContent = match[1];
      const nameMatch = exerciseContent.match(/Name:\s*([^\n]+)/i);
      const descMatch = exerciseContent.match(/Description:\s*([^\n]+)/i);
      const difficultyMatch = exerciseContent.match(/Difficulty:\s*(beginner|intermediate|advanced)/i);
      const setsMatch = exerciseContent.match(/Sets:\s*(\d+)/i);
      const repsMatch = exerciseContent.match(/Reps:\s*(\d+)/i);
      const musclesMatch = exerciseContent.match(/Target Muscles:\s*([^\n]+)/i);

      return {
        name: nameMatch ? nameMatch[1].trim() : 'Form Practice',
        description: descMatch ? descMatch[1].trim() : 'Practice the movement with proper form',
        difficulty: (difficultyMatch ? difficultyMatch[1].toLowerCase() : 'beginner') as 'beginner' | 'intermediate' | 'advanced',
        sets: setsMatch ? parseInt(setsMatch[1]) : undefined,
        reps: repsMatch ? parseInt(repsMatch[1]) : undefined,
        targetMuscles: musclesMatch 
          ? musclesMatch[1].split(',').map(m => m.trim())
          : ['full body']
      };
    });

    if (exercises.length === 0) {
      exercises.push({
        name: 'Form Practice',
        description: 'Practice the movement with proper form',
        difficulty: 'beginner',
        targetMuscles: ['full body']
      });
    }

    return {
      mobilityAge,
      feedback,
      recommendations,
      isGoodForm,
      exercises,
      poseName
    };
  } catch (error) {
    console.error('Parse error:', error);
    console.error('Raw content:', content);
    throw error;
  }
};

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AnalysisError('API key not configured');
    }

    const openai = new OpenAI({ apiKey });
    let { photo, poseName, biologicalAge } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new AnalysisError('Missing required fields: photo or poseName');
    }

    if (photo.startsWith('data:image')) {
      photo = photo.split(',')[1];
    }

    console.log('Starting analysis for:', poseName);

    const systemPrompt = `You are an expert physiotherapist analyzing a mobility pose. Be strict with the assessment considering the person's biological age of ${biologicalAge}. If you cannot clearly see the pose, respond with RETRY: followed by specific guidance. Otherwise provide your analysis in this format:

Age: [mobility age]
Form: [good/needs improvement]

Assessment: [3-4 sentences analyzing form]

Recommendations:
- [specific improvement 1]
- [specific improvement 2]
- [specific improvement 3]

Specific Exercises:

Exercise 1:
Name: [exercise name]
Description: [description]
Difficulty: [beginner/intermediate/advanced]
Sets: [number]
Reps: [number]
Target Muscles: [muscles]

Exercise 2:
[same format as Exercise 1]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${poseName} pose.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${photo}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AnalysisError('No content received from API');
    }

    console.log('Raw API response:', content);

    // Check for retry request
    if (content.trim().toUpperCase().startsWith('RETRY:')) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          needsRetry: true,
          message: content.substring(6).trim(),
          detailedMessage: content.substring(6).trim()
        })
      };
    }

    const result = parseContent(content, poseName);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    
    // If the error message suggests the image needs to be retaken
    if (error instanceof Error && (
      error.message.toLowerCase().includes('clearer image') ||
      error.message.toLowerCase().includes('try again') ||
      error.message.toLowerCase().includes('unable to analyze')
    )) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          needsRetry: true,
          message: "Please ensure your full body is visible and the image is clear. Try adjusting your position or lighting.",
          detailedMessage: error.message
        })
      };
    }

    // For actual errors
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
};

export { handler };
