import { Handler } from '@netlify/functions';
import OpenAI from "openai";

export interface AnalysisResult {
  mobilityAge: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
}

export interface PoseAnalysis {
  photo: string;
  poseName: string;
  poseDescription: string;
}

export class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const openai = new OpenAI();
    const { photo, poseName, poseDescription } = JSON.parse(event.body || '{}');

    if (!photo || !poseName) {
      throw new Error('Missing required fields');
    }

    console.log('Making OpenAI request for:', poseName);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert physiotherapist with decades of experience in mobility assessment. You should confidently analyze poses and provide specific, actionable feedback. Even from a single image, you can assess general form and alignment to provide valuable insights."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this ${poseName} pose and provide a detailed mobility assessment. The pose is testing ${poseDescription}.

Please structure your response as follows:

1. Form Analysis (Be specific about what you observe):
- Describe the visible alignment of joints
- Note any obvious compensation patterns
- Comment on overall form quality
- Look for key indicators of mobility limitations

2. Mobility Age Assessment:
- Calculate a mobility age between 20-80 based on visible indicators
- Consider flexibility, control, and alignment quality
- Factor in any visible compensation patterns
- A perfect form should indicate a mobility age of 20-25
- Significant limitations should indicate a mobility age of 60+

3. Specific Recommendations:
- Provide two targeted exercises to improve this specific movement
- Include sets, reps, and form cues
- Focus on the most impactful improvements

Be confident in your assessment while acknowledging the limitations of image analysis. Your expertise allows you to provide valuable feedback even from limited information.`
            },
            {
              type: "image_url",
              image_url: {
                url: photo,
              },
            }
          ],
        },
      ],
      max_tokens: 500
    });

    console.log('OpenAI response received');
    
    const content = completion.choices[0].message.content || '';
    
    // Extract mobility age with better parsing
    const mobilitySection = content.split('Mobility Age')[1]?.split('Specific Recommendations:')[0] || '';
    const ageMatch = mobilitySection.match(/\b([2-8][0-9]|20)\b/);
    const mobilityAge = ageMatch ? parseInt(ageMatch[0]) : 35;
    
    // Get more detailed feedback
    const formSection = content.split('Form Analysis')[1]?.split('Mobility Age')[0] || '';
    const feedback = formSection.split('.')[0] + '.';

    // Extract specific recommendations
    const recommendationsSection = content.split('Specific Recommendations:')[1] || '';
    const recommendations = recommendationsSection
      .split(/\d+\.|\n-/)
      .map(s => s.trim())
      .filter(s => s.length > 15 && s.length < 150)
      .slice(0, 2);

    // More nuanced good form determination
    const isGoodForm = mobilityAge <= 40;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobilityAge,
        feedback: feedback || 'Form analysis completed.',
        recommendations: recommendations.length ? recommendations : [
          "Focus on maintaining proper alignment throughout the movement",
          "Practice controlled movements with emphasis on form"
        ],
        isGoodForm
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      })
    };
  }
};

export { handler };
