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

  console.log('Function started');
  
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

    console.log('Making OpenAI request...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Act as an experienced physiotherapist analyzing a patient performing the ${poseName} pose. 
              
1. Form Analysis: 
- Evaluate the patient's posture, alignment, and technique
- Note any visible limitations in flexibility or mobility
- Be specific about joint angles and positions

2. Mobility Age Assessment: 
- Provide a specific mobility age (as a number)
- Explain what aspects influenced this age assessment
- Note which elements suggest younger or older mobility patterns

3. Improvement Plan:
- Suggest 2 specific exercises or stretches that could improve their mobility age
- Include clear instructions for performing each exercise
- Specify repetitions or duration for optimal results

Ensure the mobility age is clearly stated as a number. Be precise, objective, and actionable in your analysis.`
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
    
    // Extract mobility age - look for numbers in the Mobility Age section
    const mobilitySection = content.split('Mobility Age Assessment:')[1]?.split('Improvement Plan:')[0] || '';
    const ageMatch = mobilitySection.match(/\d+(?:\.\d+)?/);
    const mobilityAge = ageMatch ? Math.min(parseInt(ageMatch[0]), 100) : 30;
    
    // Extract main feedback - first relevant sentence from Form Analysis
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    const formAnalysisSentences = sentences.filter(s => 
      !s.includes('Mobility Age') && 
      !s.includes('exercise') && 
      !s.includes('stretch')
    );
    const feedback = formAnalysisSentences[0] || 'Analysis completed.';

    // Extract recommendations from Improvement Plan section
    const improvementSection = content.split('Improvement Plan:')[1] || '';
    const recommendations = improvementSection
      .split(/\d+\.|\n-/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 100)
      .slice(0, 2);

    // Determine if form is good based on mobility age comparison with actual age
    const isGoodForm = mobilityAge <= 30;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobilityAge,
        feedback,
        recommendations: recommendations.length ? recommendations : ["Perform mobility exercises regularly"],
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
