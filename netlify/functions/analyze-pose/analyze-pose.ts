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
  poor: 3.0,
  moderate: 1.5,
  good: 1.0
};

const LIMITATION_FACTORS = {
  severe: 20,
  moderate: 10,
  mild: 5
};

const calculateHybridMobilityAge = (
  biologicalAge: number,
  measurements: AnalysisResult['measurements'],
  assessment: string,
  poseName: string,
  isGoodForm: boolean
): number => {
  let ageAdjustment = 0;
  const maxPositiveAdjustment = 25;
  const maxNegativeAdjustment = -15; // Allow for better than biological age
  let useAngularMeasurements = false;

  // Check if we have valid measurements for this pose
  if (measurements?.angles) {
    switch (poseName) {
      case 'Deep Squat':
        useAngularMeasurements = !!(measurements.angles.hip || measurements.angles.knee || measurements.angles.ankle);
        break;
      case 'Forward Fold':
        useAngularMeasurements = !!measurements.angles.hip;
        break;
      case 'Apley Scratch Test':
        useAngularMeasurements = !!(measurements.distances?.fingerGap);
        break;
      case 'Knee to Wall Test':
        useAngularMeasurements = !!measurements.angles.ankle;
        break;
    }
  }

  if (useAngularMeasurements) {
    switch (poseName) {
      case 'Deep Squat':
        if (measurements?.angles) {
          const { hip, knee, ankle } = measurements.angles;
          let squatScore = 0;
          
          if (hip) {
            if (hip >= ATHLETE_RANGES.deepSquat.hipFlexion.ideal) {
              squatScore -= 5; // Better than ideal
            } else if (hip >= ATHLETE_RANGES.deepSquat.hipFlexion.min) {
              squatScore -= 2; // Meeting athletic standards
            } else if (hip < CLINICAL_RANGES.deepSquat.hipFlexion.min) {
              squatScore += hip < ATHLETE_RANGES.deepSquat.hipFlexion.min ? 8 : 4;
            }
          }
          
          if (knee) {
            if (knee >= ATHLETE_RANGES.deepSquat.kneeFlexion.ideal) {
              squatScore -= 5;
            } else if (knee >= ATHLETE_RANGES.deepSquat.kneeFlexion.min) {
              squatScore -= 2;
            } else if (knee < CLINICAL_RANGES.deepSquat.kneeFlexion.min) {
              squatScore += knee < ATHLETE_RANGES.deepSquat.kneeFlexion.min ? 8 : 4;
            }
          }
          
          if (ankle) {
            if (ankle >= ATHLETE_RANGES.deepSquat.ankleDorsiflexion.ideal) {
              squatScore -= 5;
            } else if (ankle >= ATHLETE_RANGES.deepSquat.ankleDorsiflexion.min) {
              squatScore -= 2;
            } else if (ankle < CLINICAL_RANGES.deepSquat.ankleDorsiflexion.min) {
              squatScore += ankle < ATHLETE_RANGES.deepSquat.ankleDorsiflexion.min ? 8 : 4;
            }
          }
          
          ageAdjustment = squatScore;
        }
        break;
      case 'Forward Fold':
        if (measurements?.angles?.hip) {
          const hipFlexion = measurements.angles.hip;
          if (hipFlexion >= ATHLETE_RANGES.forwardFold.hipFlexion.ideal) {
            ageAdjustment -= 10;
          } else if (hipFlexion >= ATHLETE_RANGES.forwardFold.hipFlexion.min) {
            ageAdjustment -= 5;
          } else if (hipFlexion < CLINICAL_RANGES.forwardFold.hipFlexion.min) {
            ageAdjustment += hipFlexion < ATHLETE_RANGES.forwardFold.hipFlexion.min ? 15 : 8;
          }
        }
        break;
      case 'Apley Scratch Test':
        if (measurements?.distances?.fingerGap) {
          const gap = measurements.distances.fingerGap;
          if (gap <= ATHLETE_RANGES.apleyScratch.fingerGap.ideal) {
            ageAdjustment -= 10;
          } else if (gap <= ATHLETE_RANGES.apleyScratch.fingerGap.max) {
            ageAdjustment -= 5;
          } else if (gap > CLINICAL_RANGES.apleyScratch.fingerGap.max) {
            ageAdjustment += gap > ATHLETE_RANGES.apleyScratch.fingerGap.max + 10 ? 15 : 8;
          }
        }
        break;
      case 'Knee to Wall Test':
        if (measurements?.angles?.ankle) {
          const ankleAngle = measurements.angles.ankle;
          if (ankleAngle >= ATHLETE_RANGES.kneeWall.weightBearing.ideal) {
            ageAdjustment -= 10;
          } else if (ankleAngle >= ATHLETE_RANGES.kneeWall.weightBearing.min) {
            ageAdjustment -= 5;
          } else if (ankleAngle < CLINICAL_RANGES.kneeWall.weightBearing.min) {
            ageAdjustment += ankleAngle < ATHLETE_RANGES.kneeWall.weightBearing.min ? 15 : 8;
          }
        }
        break;
    }
  } else {
    const limitationIndicators = [
      { pattern: /limited|restricted|difficulty|stiff/i, weight: 5 },
      { pattern: /severe|significant|major|substantial/i, weight: 8 },
      { pattern: /mild|slight|minor/i, weight: 3 },
      { pattern: /imbalance|asymmetry/i, weight: 4 },
      { pattern: /compensation|compensating/i, weight: 6 },
      { pattern: /excellent|perfect|ideal/i, weight: -8 },
      { pattern: /good|proper|well/i, weight: -5 },
      { pattern: /above average|exceptional/i, weight: -6 },
      { pattern: /flexible|fluid|smooth/i, weight: -4 }
    ];

    for (const indicator of limitationIndicators) {
      if (indicator.pattern.test(assessment)) {
        ageAdjustment += indicator.weight;
      }
    }
  }

  // Form quality adjustment with potential for improvement
  if (isGoodForm) {
    ageAdjustment -= 5;
  } else {
    ageAdjustment += 8;
  }

  // Apply age-based scaling
  const ageFactor = Math.max(0.8, (biologicalAge - 20) / 30);
  ageAdjustment *= ageFactor;

  // Ensure adjustment stays within bounds
  ageAdjustment = Math.min(maxPositiveAdjustment, Math.max(maxNegativeAdjustment, ageAdjustment));
  
  return Math.max(18, Math.round(biologicalAge + ageAdjustment));
};

const systemPrompt = `You are an expert physiotherapist assessing mobility. Analyze the image and provide feedback in this EXACT format:

Measurements:
[List specific numerical measurements only when clearly visible]
- Joint angles in degrees (e.g., "Shoulder angle: 180")
- Distances in cm (e.g., "Finger gap: 5")
Do not use words like "typically" or "approximately"
Skip measurements if not clearly visible

Form: good/poor relative to age
[One clear sentence explaining form quality]

Assessment:
[2-3 sentences describing observed movement patterns, limitations, and capabilities]

Recommendations:
- [Specific improvement point 1]
- [Specific improvement point 2]
- [Specific improvement point 3]

Exercise 1:
Name: [exercise name]
Description: [1 sentence]
Difficulty: beginner/intermediate/advanced
Sets: [number]
Reps: [number]
Target Muscles: [specific muscles]

Exercise 2:
[Same format as Exercise 1]

IMPORTANT:
- Provide only specific numerical measurements when clearly visible
- Skip measurements if not clearly visible
- Do not use markdown formatting
- Do not use approximations`;

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
      mobilityAge: calculateHybridMobilityAge(biologicalAge, measurements, feedback, poseName, isGoodForm),
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

  let requestBody;
  try {
    requestBody = JSON.parse(event.body || '{}');
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
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
              text: `Analyze this ${poseName} pose. Focus on overall form quality and movement patterns.`
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
