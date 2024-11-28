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
    steps: string[];
    frequency: string;
    targetMuscles: string[];
    progressionMetrics?: string;
  }[];
  poseName: string;
  comparativeAge?: {
    difference: number;
    assessment: string;
  };
}

class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

const parseContent = (content: string, poseName: string, biologicalAge?: number): AnalysisResult => {
  console.log('Starting to parse content:', content);

  try {
    // Extract mobility age
    const ageMatch = content.match(/Mobility Age:\s*(\d+)/i);
    if (!ageMatch) {
      throw new AnalysisError('Could not determine mobility age from analysis');
    }

    const mobilityAge = parseInt(ageMatch[1]);

    // Extract form assessment
    const isGoodForm = content.toLowerCase().includes('form: good') || 
                      content.toLowerCase().includes('good form');

    // Extract detailed feedback
    const feedbackMatch = content.match(/Form Analysis:\s*([^]*?)(?=\n\s*(?:Specific Recommendations:|$))/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Form assessment needed';

    // Extract recommendations
    const recommendationsMatch = content.match(/Specific Recommendations:\s*([^]*?)(?=\n\s*(?:Improvement Exercises:|$))/i);
    const recommendations = recommendationsMatch 
      ? recommendationsMatch[1]
          .split('\n')
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0)
      : ['Practice proper form'];

    // Extract exercises
    const exercisesSection = content.match(/Improvement Exercises:\s*([^]*?)(?=\n\s*(?:$|Progress Tracking:))/i);
    const exerciseBlocks = exercisesSection ? exercisesSection[1].split(/Exercise \d+:/g).filter(Boolean) : [];
    
    const exercises = exerciseBlocks.map(block => {
      const nameMatch = block.match(/Name:\s*([^\n]+)/);
      const descriptionMatch = block.match(/Description:\s*([^\n]+)/);
      const difficultyMatch = block.match(/Difficulty:\s*(beginner|intermediate|advanced)/i);
      const setsMatch = block.match(/Sets:\s*(\d+)/);
      const repsMatch = block.match(/Reps:\s*(\d+)/);
      const frequencyMatch = block.match(/Frequency:\s*([^\n]+)/);
      const stepsMatch = block.match(/Steps:\s*([^]*?)(?=\n\s*(?:Target Muscles:|Frequency:|$))/i);
      const targetMusclesMatch = block.match(/Target Muscles:\s*([^\n]+)/);
      const progressionMatch = block.match(/Progression Metrics:\s*([^\n]+)/);

      return {
        name: nameMatch ? nameMatch[1].trim() : 'Form Exercise',
        description: descriptionMatch ? descriptionMatch[1].trim() : 'Practice proper form',
        difficulty: (difficultyMatch ? difficultyMatch[1].toLowerCase() : 'beginner') as 'beginner' | 'intermediate' | 'advanced',
        sets: setsMatch ? parseInt(setsMatch[1]) : undefined,
        reps: repsMatch ? parseInt(repsMatch[1]) : undefined,
        steps: stepsMatch 
          ? stepsMatch[1]
              .split('\n')
              .map(step => step.replace(/^[-•*]\s*/, '').trim())
              .filter(step => step.length > 0)
          : ['Practice the basic movement'],
        frequency: frequencyMatch ? frequencyMatch[1].trim() : '3 times per week',
        targetMuscles: targetMusclesMatch 
          ? targetMusclesMatch[1].split(',').map(muscle => muscle.trim())
          : ['full body'],
        progressionMetrics: progressionMatch ? progressionMatch[1].trim() : undefined
      };
    });

    // If no exercises were parsed, provide a default exercise
    if (exercises.length === 0) {
      exercises.push({
        name: 'Basic Form Practice',
        description: 'Practice the basic movement pattern',
        difficulty: 'beginner',
        steps: ['Practice the basic movement with proper form'],
        frequency: '3 times per week',
        targetMuscles: ['full body']
      });
    }

    // Add comparative age analysis if biological age is provided
    let comparativeAge;
    if (biologicalAge !== undefined) {
      const difference = mobilityAge - biologicalAge;
      const assessment = difference <= -5 
        ? "Your mobility is notably better than your biological age - keep up the great work!" 
        : difference <= 0 
          ? "Your mobility matches or slightly exceeds your biological age" 
          : difference <= 5 
            ? "Your mobility shows room for improvement compared to your biological age" 
            : "Your mobility needs attention to better align with your biological age";
      
      comparativeAge = { difference, assessment };
    }

    return {
      mobilityAge,
      feedback,
      recommendations,
      isGoodForm,
      exercises,
      poseName,
      comparativeAge
    };
  } catch (error) {
    console.error('Parse error:', error);
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

    // Remove data:image prefix if it exists
    if (photo.startsWith('data:image')) {
      photo = photo.split(',')[1];
    }

    console.log('Starting analysis for:', poseName);

    const systemPrompt = `You are an expert physiotherapist analyzing a mobility pose. Include ALL of the following sections in your response:

Mobility Age: [number between 20-80 based on form quality]
Form: [good/needs improvement]

Form Analysis: [3-4 detailed sentences about their form, including specific observations about alignment, balance, and range of motion]

Specific Recommendations:
- [3-5 detailed, actionable improvements]

Improvement Exercises:
Exercise 1:
Name: [specific exercise name]
Description: [1-2 sentences]
Difficulty: [beginner/intermediate/advanced]
Sets: [number]
Reps: [number]
Steps:
- [detailed step 1]
- [detailed step 2]
- [detailed step 3]
Target Muscles: [primary muscles targeted]
Frequency: [how often to perform]
Progression Metrics: [how to know when to increase difficulty]

Exercise 2:
[same format as above]

Progress Tracking:
[2-3 sentences about what improvements to look for over time]`;

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
              text: `Analyze this ${poseName} pose.${biologicalAge ? ` The person's biological age is ${biologicalAge}.` : ''}`
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
      max_tokens: 1500
    });

    console.log('Received response from OpenAI');

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AnalysisError('No content received from API');
    }

    console.log('Raw API response:', content);

    const result = parseContent(content, poseName, biologicalAge);

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
