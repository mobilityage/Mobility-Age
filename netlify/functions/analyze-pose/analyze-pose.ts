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
      shoulder?: number;
      elbow?: number;
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
  excellent: 0.7,
  good: 1.0,
  moderate: 1.3,
  poor: 1.8
};

const PERFORMANCE_ADJUSTMENTS = {
  exceptional: -10,
  aboveAverage: -5,
  average: 0,
  belowAverage: 5,
  poor: 10
};

const LIMITATION_FACTORS = {
  severe: 15,
  moderate: 8,
  mild: 3
};

const determinePerformanceLevel = (
  measurements: AnalysisResult['measurements'],
  poseName: string,
  isGoodForm: boolean
): string => {
  let score = 0;

  if (measurements?.angles) {
    Object.entries(measurements.angles).forEach(([joint, angle]) => {
      const idealRange = ATHLETE_RANGES[poseName]?.[`${joint}Flexion`]?.ideal;
      if (idealRange && angle) {
        const difference = Math.abs(angle - idealRange);
        if (difference < 5) score += 2;
        else if (difference < 10) score += 1;
        else if (difference > 20) score -= 1;
      }
    });
  }

  if (isGoodForm) score += 2;

  if (score >= 4) return 'exceptional';
  if (score >= 2) return 'aboveAverage';
  if (score >= 0) return 'average';
  if (score >= -2) return 'belowAverage';
  return 'poor';
};

function calculateMobilityAge(
  biologicalAge: number,
  measurements: AnalysisResult['measurements'],
  poseName: string,
  isGoodForm: boolean
): number {
  let ageAdjustment = 0;
  const maxAdjustment = 20;

  const performanceLevel = determinePerformanceLevel(measurements, poseName, isGoodForm);
  ageAdjustment += PERFORMANCE_ADJUSTMENTS[performanceLevel];

  switch (poseName) {
    case 'Deep Squat':
      if (measurements?.angles) {
        const { hip, knee, ankle } = measurements.angles;

        if (hip) {
          if (hip > ATHLETE_RANGES.deepSquat.hipFlexion.ideal) {
            ageAdjustment -= 3;
          } else if (hip < CLINICAL_RANGES.deepSquat.hipFlexion.min) {
            const severity = hip < ATHLETE_RANGES.deepSquat.hipFlexion.min ? 'severe' : 'moderate';
            ageAdjustment += LIMITATION_FACTORS[severity];
          }
        }

        if (knee) {
          if (knee > ATHLETE_RANGES.deepSquat.kneeFlexion.ideal) {
            ageAdjustment -= 2;
          } else if (knee < CLINICAL_RANGES.deepSquat.kneeFlexion.min) {
            const severity = knee < ATHLETE_RANGES.deepSquat.kneeFlexion.min ? 'severe' : 'moderate';
            ageAdjustment += LIMITATION_FACTORS[severity];
          }
        }

        if (ankle) {
          if (ankle > ATHLETE_RANGES.deepSquat.ankleDorsiflexion.ideal) {
            ageAdjustment -= 2;
          } else if (ankle < CLINICAL_RANGES.deepSquat.ankleDorsiflexion.min) {
            const severity = ankle < ATHLETE_RANGES.deepSquat.ankleDorsiflexion.min ? 'severe' : 'moderate';
            ageAdjustment += LIMITATION_FACTORS[severity];
          }
        }
      }
      break;

    // Similar modifications for other poses...
    case 'Forward Fold':
      if (measurements?.angles?.hip) {
        const hipFlexion = measurements.angles.hip;
        if (hipFlexion > ATHLETE_RANGES.forwardFold.hipFlexion.ideal) {
          ageAdjustment -= 3;
        } else if (hipFlexion < CLINICAL_RANGES.forwardFold.hipFlexion.min) {
          const severity = hipFlexion < ATHLETE_RANGES.forwardFold.hipFlexion.min ? 'severe' : 'moderate';
          ageAdjustment += LIMITATION_FACTORS[severity];
        }
      }
      break;

    case 'Apley Scratch Test':
      if (measurements?.distances?.fingerGap) {
        const gap = measurements.distances.fingerGap;
        if (gap < ATHLETE_RANGES.apleyScratch.fingerGap.ideal) {
          ageAdjustment -= 3;
        } else if (gap > CLINICAL_RANGES.apleyScratch.fingerGap.max) {
          const severity = gap > ATHLETE_RANGES.apleyScratch.fingerGap.max + 10 ? 'severe' : 'moderate';
          ageAdjustment += LIMITATION_FACTORS[severity];
        }
      }
      break;

    case 'Knee to Wall Test':
      if (measurements?.angles?.ankle) {
        const ankleAngle = measurements.angles.ankle;
        if (ankleAngle > ATHLETE_RANGES.kneeWall.weightBearing.ideal) {
          ageAdjustment -= 3;
        } else if (ankleAngle < CLINICAL_RANGES.kneeWall.weightBearing.min) {
          const severity = ankleAngle < ATHLETE_RANGES.kneeWall.weightBearing.min ? 'severe' : 'moderate';
          ageAdjustment += LIMITATION_FACTORS[severity];
        }
      }
      break;
  }

  const formQuality = isGoodForm ? 'good' : 'moderate';
  const formMultiplier = FORM_MULTIPLIERS[formQuality];

  ageAdjustment = Math.min(maxAdjustment, Math.max(-maxAdjustment, ageAdjustment));
  const adjustedAge = biologicalAge + (ageAdjustment * formMultiplier);

  return Math.max(
    biologicalAge - 15,
    Math.min(biologicalAge + 20,
    Math.round(adjustedAge))
  );
}

const parseContent = (content: string, poseName: string, biologicalAge: number): AnalysisResult => {
  try {
    const measurementsMatch = content.match(/Measurements:\s*([^]*?)(?=\n\s*(?:Form:|$))/i);
    const measurements: AnalysisResult['measurements'] = {};

    if (measurementsMatch) {
      const measurementText = measurementsMatch[1];
      const angles: { [key: string]: number } = {};
      const distances: { [key: string]: number } = {};

      const angleMatches = measurementText.matchAll(/(\w+)\s+angle:\s*(\d+(?:\.\d+)?)/gi);
      for (const match of angleMatches) {
        angles[match[1].toLowerCase()] = parseFloat(match[2]);
      }

      const distanceMatches = measurementText.matchAll(/(\w+)\s+(?:distance|gap):\s*(\d+(?:\.\d+)?)/gi);
      for (const match of distanceMatches) {
        distances[match[1].toLowerCase()] = parseFloat(match[2]);
      }

      if (Object.keys(angles).length > 0) measurements.angles = angles;
      if (Object.keys(distances).length > 0) measurements.distances = distances;
    }

    const formMatch = content.match(/Form:\s*(good|poor)(?:\s*\n([^\n]+))?/i);
    const isGoodForm = formMatch ? formMatch[1].toLowerCase() === 'good' : false;

    const mobilityAge = calculateMobilityAge(biologicalAge, measurements, poseName, isGoodForm);

    const assessmentMatch = content.match(/Assessment:\s*([^]*?)(?=\n\s*(?:Recommendations:|$))/i);
    const feedback = assessmentMatch ? assessmentMatch[1].trim() : '';

    const recommendationsMatch = content.match(/Recommendations:\s*([^]*?)(?=\n\s*(?:Exercise 1:|$))/i);
    const recommendations = recommendationsMatch 
      ? recommendationsMatch[1]
          .split('\n')
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0)
      : [];

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

  const rawBody = event.body || '{}';
  let requestBody;

  try {
    requestBody = JSON.parse(rawBody);
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON in request body' })
    };
  }

  const { photo, poseName, biologicalAge } = requestBody;

  if (!photo || !poseName) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields: photo or poseName' })
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const openai = new OpenAI({ apiKey });
    const base64Image = photo.startsWith('data:image') ? photo.split(',')[1] : photo;

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
              text: `Analyze this ${poseName} pose. Provide specific measurements only when clearly visible.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from API');
    }

    console.log('Raw API response:', content);

    if (content.trim().toUpperCase().startsWith('RETRY:')) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          needsRetry: true,
          message: content.substring(6).trim()
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
    console.error('Analysis error:', error);

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
