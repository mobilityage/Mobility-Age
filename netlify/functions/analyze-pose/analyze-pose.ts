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
      return {
        mobilityAge: 30,
        feedback: "Unable to determine specific feedback from the pose.",
        recommendations: ["Consult with a physiotherapist for proper form assessment"],
        isGoodForm: false,
        exercises: [{
          name: 'Basic Form Practice',
          description: 'Practice the basic movement pattern',
          difficulty: 'beginner',
          targetMuscles: ['full body']
        }],
        poseName
      };
    }

    const mobilityAge = parseInt(ageMatch[1]);

    const isGoodForm = content.toLowerCase().includes('form: good') || 
                      content.toLowerCase().includes('good form');

    // Look for both Assessment and Feedback sections
    const feedbackMatch = content.match(/(?:Assessment|Feedback):\s*([^]*?)(?=\n\s*(?:Recommendations:|Specific Exercises:|$))/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Form assessment needed';

    const recommendationsMatch = content.match(/Recommendations:\s*([^]*?)(?=\n\s*(?:Specific Exercises:|$))/i);
    const recommendations = recommendationsMatch 
      ? recommendationsMatch[1]
          .split('\n')
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0)
      : ['Practice proper form'];

    // Extract exercises from the content
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

    // If no exercises were found, provide a default
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
    return {
      mobilityAge: 30,
      feedback: "Unable to analyze the pose properly.",
      recommendations: ["Consult with a physiotherapist for proper form assessment"],
      isGoodForm: false,
      exercises: [{
        name: 'Basic Form Practice',
        description: 'Practice the basic movement pattern',
        difficulty: 'beginner',
        targetMuscles: ['full body']
      }],
      poseName
    };
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
    let { photo, poseName } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new AnalysisError('Missing required fields: photo or poseName');
    }

    if (photo.startsWith('data:image')) {
      photo = photo.split(',')[1];
    }

    console.log('Starting analysis for:', poseName);

    const systemPrompt = `You are an expert physiotherapist analyzing a mobility pose. Provide a detailed clinical assessment in EXACTLY this format:

Age: [mobility age between 20-80 based on form quality]
Form: [good/needs improvement]

Assessment: [3-4 detailed sentences analyzing their form, joint angles, muscle engagement, and overall mobility]

Recommendations:
- [specific improvement 1 with clear guidance]
- [specific improvement 2 with clear guidance]
- [specific improvement 3 with clear guidance]

Specific Exercises:

Exercise 1:
Name: [specific exercise name]
Description: [detailed description of exercise purpose and execution]
Difficulty: [beginner/intermediate/advanced]
Sets: [number]
Reps: [number]
Target Muscles: [primary and secondary muscles targeted]

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

    console.log('Received response from OpenAI');

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AnalysisError('No content received from API');
    }

    console.log('Raw API response:', content);

    const result = parseContent(content, poseName);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    const errorResponse = {
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error instanceof Error ? error.stack : undefined,
      originalError: process.env.NODE_ENV === 'development' ? error : undefined
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};

export { handler };
