// src/services/poseAnalysisService.ts

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

export async function analyzePose(data: PoseAnalysis): Promise<AnalysisResult> {
  try {
    // Log the attempt
    console.log('Starting pose analysis for:', data.poseName);

    // Verify photo data exists and is in correct format
    if (!data.photo) {
      throw new AnalysisError('No photo data provided');
    }

    const response = await fetch('/.netlify/functions/analyze-pose', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photo: data.photo,
        poseName: data.poseName,
        poseDescription: data.poseDescription
      })
    });

    // Log response status
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new AnalysisError(`Server error: ${errorText}`);
    }

    const result = await response.json();
    console.log('Received analysis result');

    if (!isValidAnalysisResult(result)) {
      console.error('Invalid result structure:', result);
      throw new AnalysisError('Invalid response format from server');
    }

    return result;
  } catch (error) {
    console.error('Analysis error:', error);
    if (error instanceof AnalysisError) {
      throw error;
    }
    throw new AnalysisError('Failed to analyze pose. Please try again.');
  }
}

function isValidAnalysisResult(result: any): result is AnalysisResult {
  const isValid = result &&
    typeof result === 'object' &&
    typeof result.mobilityAge === 'number' &&
    typeof result.feedback === 'string' &&
    Array.isArray(result.recommendations) &&
    typeof result.isGoodForm === 'boolean';

  if (!isValid) {
    console.log('Invalid result structure:', {
      hasMobilityAge: typeof result?.mobilityAge === 'number',
      hasFeedback: typeof result?.feedback === 'string',
      hasRecommendations: Array.isArray(result?.recommendations),
      hasIsGoodForm: typeof result?.isGoodForm === 'boolean'
    });
  }

  return isValid;
}
