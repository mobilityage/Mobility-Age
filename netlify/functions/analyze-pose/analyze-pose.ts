import { Handler } from '@netlify/functions';
import OpenAI from "openai";

// Type definitions remain the same
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

// Define pose-specific assessment criteria
const poseGuidelines = {
  "Deep Squat": {
    keyPoints: [
      "Hip crease should be below knee level",
      "Feet flat on ground, toes pointed slightly outward",
      "Knees tracking over toes",
      "Chest upright, spine neutral",
      "Arms overhead, shoulders stable"
    ],
    idealAngles: {
      ankle: "30-45 degrees dorsiflexion",
      knee: ">120 degrees flexion",
      hip: ">120 degrees flexion",
      spine: "45-60 degrees to ground"
    },
    commonIssues: [
      "Heels lifting",
      "Knees caving in",
      "Forward lean",
      "Limited depth",
      "Poor arm position"
    ]
  },
  "Forward Fold": {
    keyPoints: [
      "Straight legs (slight bend okay)",
      "Hips hinging backward",
      "Spine elongated",
      "Hands reaching toward ground",
      "Weight evenly distributed"
    ],
    idealAngles: {
      hip: ">90 degrees flexion",
      knee: "<10 degrees flexion",
      spine: "Parallel to ground initially"
    },
    commonIssues: [
      "Excessive knee bend",
      "Rounded spine",
      "Limited hamstring flexibility",
      "Poor hip hinge",
      "Uneven weight distribution"
    ]
  },
  "Knee to Wall": {
    keyPoints: [
      "Foot flat on ground",
      "Knee touching or nearly touching wall",
      "Heel maintaining ground contact",
      "Vertical shin angle",
      "Hip and ankle aligned"
    ],
    idealAngles: {
      ankle: ">40 degrees dorsiflexion",
      knee: "Vertical tibia",
      hip: "Neutral alignment"
    },
    commonIssues: [
      "Heel lifting",
      "Knee not reaching wall",
      "Foot too close/far from wall",
      "Poor ankle mobility",
      "Compensating with lean"
    ]
  },
  "Apley Scratch": {
    keyPoints: [
      "One arm reaching over shoulder",
      "Other arm reaching up from lower back",
      "Fingers attempting to touch",
      "Minimal trunk rotation",
      "Shoulders level"
    ],
    idealAngles: {
      shoulder: "180 degrees flexion (top arm)",
      "internal rotation": ">70 degrees",
      "external rotation": ">90 degrees"
    },
    commonIssues: [
      "Limited shoulder mobility",
      "Excessive trunk rotation",
      "Shoulder elevation",
      "Poor scapular control",
      "Asymmetry between sides"
    ]
  }
};

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

    const poseGuide = poseGuidelines[poseName as keyof typeof poseGuidelines] || {
      keyPoints: [],
      idealAngles: {},
      commonIssues: []
    };

    console.log('Making OpenAI request for:', poseName);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an elite physiotherapist specializing in mobility assessment, with over 20 years of experience evaluating athletes and regular clients. You have developed a particular expertise in analyzing movement patterns and determining a person's 'mobility age' - a measure of how their mobility compares to optimal human movement capabilities.

When analyzing poses, you focus on:
- Joint angles and positions
- Movement compensation patterns
- Bilateral symmetry
- Stability and control
- Range of motion limitations

For this specific ${poseName}, you'll be evaluating against these ideal standards:

Key Points to Assess:
${poseGuide.keyPoints.map(point => `- ${point}`).join('\n')}

Ideal Joint Angles:
${Object.entries(poseGuide.idealAngles).map(([joint, angle]) => `- ${joint}: ${angle}`).join('\n')}

Common Issues to Look For:
${poseGuide.commonIssues.map(issue => `- ${issue}`).join('\n')}

Provide confident, specific feedback while maintaining professional accuracy.`
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this ${poseName} pose against the provided standards and provide a detailed mobility assessment.

Required Response Format:

1. Form Analysis:
- Provide specific observations about joint positions and angles
- Compare against the ideal standards listed above
- Note any visible compensations or limitations
- Score the overall form quality relative to optimal standards

2. Mobility Age Determination:
- Assign a mobility age (20-80 years) based on:
  * Proximity to ideal joint angles
  * Quality of movement control
  * Presence/absence of compensations
  * Overall movement efficiency
- Explain the key factors influencing your age assessment

3. Improvement Recommendations:
- Provide two specific corrective exercises
- Include clear instructions, sets, reps, and progression criteria
- Target the most significant limitations observed

Focus on being specific and actionable in your analysis. Highlight both positive aspects and areas for improvement.`
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

    // Response parsing logic remains the same
    const content = completion.choices[0].message.content || '';
    
    const mobilitySection = content.split('Mobility Age')[1]?.split('Improvement')[0] || '';
    const ageMatch = mobilitySection.match(/\b([2-8][0-9]|20)\b/);
    const mobilityAge = ageMatch ? parseInt(ageMatch[0]) : 35;
    
    const formSection = content.split('Form Analysis')[1]?.split('Mobility Age')[0] || '';
    const feedback = formSection.split('.')[0] + '.';

    const recommendationsSection = content.split('Improvement Recommendations:')[1] || '';
    const recommendations = recommendationsSection
      .split(/\d+\.|\n-/)
      .map(s => s.trim())
      .filter(s => s.length > 15 && s.length < 150)
      .slice(0, 2);

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
