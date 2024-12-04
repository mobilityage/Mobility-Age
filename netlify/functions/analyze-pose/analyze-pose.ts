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
  measurements?: {
    angles?: {
      hip?: number;
      knee?: number;
      ankle?: number;
    };
    distances?: {
      fingerGap?: number;
      wallDistance?: number;
    };
  };
}

const ATHLETE_RANGES = {
  deepSquat: {
    hipFlexion: { min: 110, ideal: 120 },
    kneeFlexion: { min: 140, ideal: 150 },
    ankleDorsiflexion: { min: 40, ideal: 45 }
  },
  forwardFold: {
    hipFlexion: { min: 100, ideal: 110 },
    hamstringFlexibility: { min: 90, ideal: 100 }
  },
  apleyScratch: {
    internalRotation: { min: 80, ideal: 90 },
    externalRotation: { min: 95, ideal: 105 },
    fingerGap: { max: 15, ideal: 5 }
  },
  kneeWall: {
    weightBearing: { min: 40, ideal: 45 },
    distance: { min: 15, ideal: 18 }
  }
};

const CLINICAL_RANGES = {
  deepSquat: {
    hipFlexion: { min: 95, max: 100 },
    kneeFlexion: { min: 130, max: 140 },
    ankleDorsiflexion: { min: 35, max: 38 }
  },
  forwardFold: {
    hipFlexion: { min: 90 },
    hamstringFlexibility: { min: 80 }
  },
  apleyScratch: {
    internalRotation: { min: 70 },
    externalRotation: { min: 90 },
    fingerGap: { max: 20 }
  },
  kneeWall: {
    weightBearing: { min: 35, max: 38 },
    distance: { min: 10, max: 12 }
  }
};

const FORM_MULTIPLIERS = {
  poor: 2.0,
  moderate: 1.5,
  good: 1.0
};

const LIMITATION_FACTORS = {
  severe: 15,
  moderate: 10,
  mild: 5
};

function calculateMobilityAge(
  biologicalAge: number,
  measurements: AnalysisResult['measurements'],
  poseName: string,
  isGoodForm: boolean
): number {
  let ageAdjustment = 0;
  const maxAdjustment = 25;
  const formQuality = isGoodForm ? 'good' : 'poor';
  const formMultiplier = FORM_MULTIPLIERS[formQuality];

  switch (poseName) {
    case 'Deep Squat':
      if (measurements?.angles) {
        const { hip, knee, ankle } = measurements.angles;
        
        if (hip) {
          if (hip < CLINICAL_RANGES.deepSquat.hipFlexion.min) {
            const severity = hip < ATHLETE_RANGES.deepSquat.hipFlexion.min ? 'severe' : 'moderate';
            ageAdjustment += LIMITATION_FACTORS[severity] * formMultiplier;
          }
        }

        if (knee) {
          if (knee < CLINICAL_RANGES.deepSquat.kneeFlexion.min) {
            const severity = knee < ATHLETE_RANGES.deepSquat.kneeFlexion.min ? 'severe' : 'moderate';
            ageAdjustment += LIMITATION_FACTORS[severity] * formMultiplier;
          }
        }

        if (ankle) {
          if (ankle < CLINICAL_RANGES.deepSquat.ankleDorsiflexion.min) {
            const severity = ankle < ATHLETE_RANGES.deepSquat.ankleDorsiflexion.min ? 'severe' : 'moderate';
            ageAdjustment += LIMITATION_FACTORS[severity] * formMultiplier;
          }
        }
      }
      break;

    case 'Forward Fold':
      if (measurements?.angles?.hip) {
        const hipFlexion = measurements.angles.hip;
        if (hipFlexion < CLINICAL_RANGES.forwardFold.hipFlexion.min) {
          const severity = hipFlexion < ATHLETE_RANGES.forwardFold.hipFlexion.min ? 'severe' : 'moderate';
          ageAdjustment += LIMITATION_FACTORS[severity] * formMultiplier;
        }
      }
      break;

    case 'Apley Scratch Test':
      if (measurements?.distances?.fingerGap) {
        const gap = measurements.distances.fingerGap;
        if (gap > CLINICAL_RANGES.apleyScratch.fingerGap.max) {
          const severity = gap > ATHLETE_RANGES.apleyScratch.fingerGap.max + 10 ? 'severe' : 'moderate';
          ageAdjustment += LIMITATION_FACTORS[severity] * formMultiplier;
        }
      }
      break;

    case 'Knee to Wall Test':
      if (measurements?.angles?.ankle) {
        const ankleAngle = measurements.angles.ankle;
        if (ankleAngle < CLINICAL_RANGES.kneeWall.weightBearing.min) {
          const severity = ankleAngle < ATHLETE_RANGES.kneeWall.weightBearing.min ? 'severe' : 'moderate';
          ageAdjustment += LIMITATION_FACTORS[severity] * formMultiplier;
        }
      }
      break;
  }

  if (!isGoodForm) {
    ageAdjustment += LIMITATION_FACTORS.moderate;
  }

  ageAdjustment = Math.min(maxAdjustment, ageAdjustment);
  const adjustedAge = biologicalAge + (ageAdjustment * formMultiplier);
  return Math.max(18, Math.min(100, Math.round(adjustedAge)));
}

class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

const systemPrompt = `You are an expert physiotherapist assessing mobility. Provide detailed analysis based on what you observe:

Key measurements (when clearly visible):
- Joint angles (hips, knees, shoulders, ankles) in degrees
- Relevant distances (floor reach, finger gaps, wall) in cm
- Range of motion limitations
- Compensation patterns
- Movement quality
- Body alignment

Assessment should:
- Focus on observed capabilities
- Compare to clinical standards
- Note movement patterns and compensations
- Consider age-appropriate norms
- Identify specific limitations

Format:

Measurements:
[Observed angles and distances]

Form: [good/poor with rationale]

Assessment:
[Detailed analysis of observed movement]

Recommendations:
[Specific improvements based on findings]

Specific Exercises:

Exercise 1:
Name: [name]
Description: [clear instruction]
Difficulty: [beginner/intermediate/advanced]
Sets: [number]
Reps: [number]
Target Muscles: [specific muscles]

Exercise 2: [same format]

Provide most accurate assessment possible based on visible evidence.`;

const parseContent = (content: string, poseName: string, biologicalAge: number): AnalysisResult => {
  try {
    const measurementsMatch = content.match(/Measurements:\s*([^]*?)(?=\n\s*(?:Assessment:|Feedback:|$))/i);
    const measurements: AnalysisResult['measurements'] = {};
    
    if (measurementsMatch) {
      const measurementText = measurementsMatch[1];
      const angles: { [key: string]: number } = {};
      const distances: { [key: string]: number } = {};

      const angleMatches = measurementText.matchAll(/(\w+)\s+angle:\s*(\d+(?:\.\d+)?)/gi);
      for (const match of angleMatches) {
        angles[match[1].toLowerCase()] = parseFloat(match[2]);
      }

      const distanceMatches = measurementText.matchAll(/(\w+)\s+distance:\s*(\d+(?:\.\d+)?)/gi);
      for (const match of distanceMatches) {
        distances[match[1].toLowerCase()] = parseFloat(match[2]);
      }

      if (Object.keys(angles).length > 0) measurements.angles = angles;
      if (Object.keys(distances).length > 0) measurements.distances = distances;
    }

    const isGoodForm = content.toLowerCase().includes('form: good');
    const mobilityAge = calculateMobilityAge(biologicalAge, measurements, poseName, isGoodForm);

    const feedbackMatch = content.match(/(?:Assessment|Feedback):\s*([^]*?)(?=\n\s*(?:Recommendations:|Specific Exercises:|$))/i);
    const feedback = feedbackMatch && Object.keys(measurements).length > 0 
      ? feedbackMatch[1].trim() 
      : 'Detailed assessment of movement form and joint angles required';

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
      poseName,
      measurements
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
              text: `Analyze this ${poseName} pose. Measure and report all relevant joint angles and distances precisely.`
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

    const result = parseContent(content, poseName, biologicalAge);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function error:', error);
    
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
