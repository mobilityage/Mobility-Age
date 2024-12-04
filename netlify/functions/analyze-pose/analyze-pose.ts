import { Handler } from '@netlify/functions';
import { OpenAI } from "openai";

interface AnalysisResult {
  mobilityAge: number;
  physiotherapistEstimate: number;
  estimateConfidence: number;
  measurementReliability: number;
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
  poor: 2.0,
  moderate: 1.5,
  good: 1.0
};

const LIMITATION_FACTORS = {
  severe: 15,
  moderate: 10,
  mild: 5
};

function calculateMeasurementReliability(measurements: AnalysisResult['measurements'], poseName: string): number {
  if (!measurements) return 0;

  let expectedMeasurements = 0;
  let foundMeasurements = 0;

  switch (poseName) {
    case 'Deep Squat':
      expectedMeasurements = 3; // hip, knee, ankle
      foundMeasurements = Object.keys(measurements.angles || {}).length;
      break;
    case 'Forward Fold':
      expectedMeasurements = 1; // hip
      foundMeasurements = measurements.angles?.hip ? 1 : 0;
      break;
    case 'Apley Scratch Test':
      expectedMeasurements = 1; // fingerGap
      foundMeasurements = measurements.distances?.fingerGap ? 1 : 0;
      break;
    case 'Knee to Wall Test':
      expectedMeasurements = 2; // ankle angle and wall distance
      foundMeasurements = (measurements.angles?.ankle ? 1 : 0) + 
                         (measurements.distances?.wallDistance ? 1 : 0);
      break;
  }

  return expectedMeasurements > 0 ? foundMeasurements / expectedMeasurements : 0;
}

function calculateMobilityAge(
  biologicalAge: number,
  measurements: AnalysisResult['measurements'],
  poseName: string,
  isGoodForm: boolean,
  physiotherapistEstimate: number,
  estimateConfidence: number
): { mobilityAge: number; measurementReliability: number } {
  let measurementBasedAge = biologicalAge;
  let ageAdjustment = 0;
  const maxAdjustment = 25;
  const formQuality = isGoodForm ? 'good' : 'poor';
  const formMultiplier = FORM_MULTIPLIERS[formQuality];

  // Calculate measurement-based adjustments
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

    // ... [Previous cases remain the same]
  }

  if (!isGoodForm) {
    ageAdjustment += LIMITATION_FACTORS.moderate;
  }

  ageAdjustment = Math.min(maxAdjustment, ageAdjustment);
  measurementBasedAge = biologicalAge + (ageAdjustment * formMultiplier);

  // Calculate measurement reliability
  const measurementReliability = calculateMeasurementReliability(measurements, poseName);

  // Blend measurements and physiotherapist estimate based on confidence and reliability
  const measurementWeight = 0.4 * measurementReliability;
  const physiotherapistWeight = 0.6 * estimateConfidence;
  const totalWeight = measurementWeight + physiotherapistWeight;

  const normalizedMeasurementWeight = measurementWeight / totalWeight;
  const normalizedPhysiotherapistWeight = physiotherapistWeight / totalWeight;

  const blendedAge = (measurementBasedAge * normalizedMeasurementWeight) + 
                    (physiotherapistEstimate * normalizedPhysiotherapistWeight);

  return {
    mobilityAge: Math.max(18, Math.min(100, Math.round(blendedAge))),
    measurementReliability
  };
}

class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

const systemPrompt = `You are an expert physiotherapist assessing mobility. Analyze the image and provide feedback in this EXACT format:

Measurements:
[List specific numerical measurements only when clearly visible]
- Joint angles in degrees (e.g., "Shoulder angle: 180")
- Distances in cm (e.g., "Finger gap: 5")
Do not use words like "typically" or "approximately"
Skip measurements if not clearly visible

Mobility Assessment:
Estimated Mobility Age: [number between 18-100]
Confidence Level: [number between 0-1, e.g., 0.8]
[1-2 sentences explaining the age estimate based on overall movement quality, compensation patterns, and visible limitations]

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
    const measurementsMatch = content.match(/Measurements:\s*([^]*?)(?=\n\s*(?:Mobility Assessment:|$))/i);
    const measurements: AnalysisResult['measurements'] = {};

    if (measurementsMatch) {
      // ... [Previous measurement parsing remains the same]
    }

    // Parse physiotherapist estimate and confidence
    const mobilityAssessmentMatch = content.match(/Estimated Mobility Age:\s*(\d+)/i);
    const confidenceMatch = content.match(/Confidence Level:\s*(0\.\d+|1\.0|1)/i);

    const physiotherapistEstimate = mobilityAssessmentMatch 
      ? parseInt(mobilityAssessmentMatch[1])
      : biologicalAge;

    const estimateConfidence = confidenceMatch
      ? parseFloat(confidenceMatch[1])
      : 0.5;

    const formMatch = content.match(/Form:\s*(good|poor)(?:\s*\n([^\n]+))?/i);
    const isGoodForm = formMatch ? formMatch[1].toLowerCase() === 'good' : false;

    const { mobilityAge, measurementReliability } = calculateMobilityAge(
      biologicalAge,
      measurements,
      poseName,
      isGoodForm,
      physiotherapistEstimate,
      estimateConfidence
    );

    // ... [Rest of parsing remains the same]

    return {
      mobilityAge,
      physiotherapistEstimate,
      estimateConfidence,
      measurementReliability,
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
      model: "gpt-4-vision-preview",
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
