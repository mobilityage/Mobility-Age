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
    const ageMatch = content.match(/Age:\s*(\d+)/i);
    if (!ageMatch) {
      console.log('Failed to find age in:', content);
      return {
        mobilityAge: 30,
        feedback: "I couldn't determine your mobility age from the image. Please ensure your entire body is visible and well-lit.",
        recommendations: [
          "Make sure to capture the full pose in a well-lit area.",
          "Try to keep the camera steady and at eye level.",
          "If possible, use a plain background to avoid distractions."
        ],
        isGoodForm: false,
        exercises: [{
          name: 'Basic Form Practice',
          description: 'Practice the basic movement pattern',
          difficulty: 'beginner',
          steps: ['Practice proper form'],
          frequency: '3 times per week',
          targetMuscles: ['full body']
        }],
        poseName
      };
    }

    const mobilityAge = parseInt(ageMatch[1]);

    // Extract form assessment
    const isGoodForm = content.toLowerCase().includes('form: good') || 
    content.toLowerCase().includes('good form');

    // Extract feedback
    const feedbackMatch = content.match(/Feedback:\s*([^]*?)(?=\n\s*(?:Recommendations:|$))/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Form assessment needed. Please ensure your pose is clear and visible.';

    // Extract recommendations
    const recommendationsMatch = content.match(/Recommendations:\s*([^]*?)(?=\n\s*(?:$|Exercise))/i);
    const recommendations = recommendationsMatch 
      ? recommendationsMatch[1]
          .split('\n')
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0)
      : ['Practice proper form'];

    // Extract exercises if available
    const exercisesSection = content.match(/Exercise\s+\d+:\s*([^]*?)(?=\n\s*(?:Exercise\s+\d+:|$))/gi);
    let exercises = exercisesSection ? exercisesSection.map(section => {
      const nameMatch = section.match(/Name:\s*([^\n]+)/i);
      const descMatch = section.match(/Description:\s*([^\n]+)/i);
      const difficultyMatch = section.match(/Difficulty:\s*(beginner|intermediate|advanced)/i);
      const setsMatch = section.match(/Sets:\s*(\d+)/i);
      const repsMatch = section.match(/Reps:\s*(\d+)/i);
      const stepsMatch = section.match(/Steps:\s*([^]*?)(?=\n\s*(?:Target|Frequency|$))/i);
      const frequencyMatch = section.match(/Frequency:\s*([^\n]+)/i);
      const musclesMatch = section.match(/Target Muscles:\s*([^\n]+)/i);
      const progressionMatch = section.match(/Progression Metrics:\s*([^\n]+)/i);

      return {
        name: nameMatch ? nameMatch[1].trim() : 'Form Practice',
        description: descMatch ? descMatch[1].trim() : 'Practice the movement with proper form',
        difficulty: (difficultyMatch ? difficultyMatch[1].toLowerCase() : 'beginner') as 'beginner' | 'intermediate' | 'advanced',
        sets: setsMatch ? parseInt(setsMatch[1]) : undefined,
        reps: repsMatch ? parseInt(repsMatch[1]) : undefined,
        steps: stepsMatch 
          ? stepsMatch[1].split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(s => s)
          : ['Practice proper form'],
        frequency: frequencyMatch ? frequencyMatch[1].trim() : '3 times per week',
        targetMuscles: musclesMatch 
          ? musclesMatch[1].split(',').map(m => m.trim())
          : ['full body'],
        progressionMetrics: progressionMatch ? progressionMatch[1].trim() : undefined
      };
    }) : [];

    // Add default exercise if none found
    if (exercises.length === 0) {
      exercises = [{
        name: 'Form Practice',
        description: 'Practice the movement with proper form',
        difficulty: 'beginner',
        steps: ['Practice proper form'],
        frequency: '3 times per week',
        targetMuscles: ['full body']
      }];
    }

    // Add comparative age analysis if biological age provided
    let comparativeAge;
    if (biologicalAge !== undefined) {
      const difference = mobilityAge - biologicalAge;
      const assessment = difference <= -5 
        ? "Your mobility is notably better than your biological age - keep up the great work!" 
        : difference <= 0 
          ? "Your mobility matches or slightly exceeds your biological age." 
          : difference <= 5 
            ? "Your mobility shows room for improvement compared to your biological age." 
            : "Your mobility needs attention to better align with your biological age.";

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
    console.error('Raw content:', content);
    // Return default values instead of throwing
    return {
      mobilityAge: 30,
      feedback: "Unable to analyze the pose properly. Please ensure your entire body is visible and well-lit.",
      recommendations: [
        "Make sure to capture the full pose in a well-lit area.",
        "Try to keep the camera steady and at eye level.",
        "If possible, use a plain background to avoid distractions."
      ],
      isGoodForm: false,
      exercises: [{
        name: 'Basic Form Practice',
        description: 'Practice the basic movement pattern',
        difficulty: 'beginner',
        steps: ['Practice proper form'],
        frequency: '3 times per week',
        targetMuscles: ['full body']
      }],
      poseName,
      comparativeAge: biologicalAge ? {
        difference: 30 - biologicalAge,
        assessment: "Unable to accurately assess mobility age comparison."
      } : undefined
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
    let { photo, poseName, biologicalAge } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new AnalysisError('Missing required fields: photo or poseName');
    }

    // Add logging for photo data check
    console.log('Photo data check:', {
      originalLength: photo.length,
      hasPrefix: photo.startsWith('data:image'),
      prefixType: photo.startsWith('data:image/jpeg;base64,') ? 'jpeg' : 
      photo.startsWith('data:image/png;base64,') ? 'png' : 'other'
    });

    // Remove data:image prefix if it exists
    if (photo.startsWith('data:image')) {
      photo = photo.split(',')[1];
    }

    console.log('Starting analysis for:', poseName);

    const systemPrompt = `You are a physiotherapist analyzing a mobility pose. Respond EXACTLY in this format:

Age: [number between 20-80]
Form: [good/needs improvement]
Feedback: [2-3 sentences about their form]
Recommendations:
- [improvement 1]
- [improvement 2]
- [improvement 3]

Exercise 1:
Name: [specific exercise name]
Description: [1-2 sentences]
Difficulty: [beginner/intermediate/advanced]
Sets: [number]
Reps: [number]
Steps:
- [step 1]
- [step 2]
- [step 3]
Target Muscles: [main muscle groups]
Frequency: [how often to perform]
Progression Metrics: [how to progress]`;

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
      max_tokens: 1000
    });

    console.log('Received response from OpenAI');

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AnalysisError('No content received from API');
    }

    console.log('Raw API response:', content);
    console.log('Response structure check:', {
      hasAge: content.match(/Age:\s*(\d+)/i) !== null,
      hasForm: content.toLowerCase().includes('form:'),
      hasFeedback: content.toLowerCase().includes('feedback:'),
      hasRecommendations: content.toLowerCase().includes('recommendations:'),
      hasExercises: content.toLowerCase().includes('exercise 1:')
    });

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
