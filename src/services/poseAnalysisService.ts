export interface PoseAnalysis {
  photo: string;
  poseName: string;
  poseDescription: string;
}

export interface AnalysisResult {
  score: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
}

export class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export async function analyzePose(data: PoseAnalysis): Promise<AnalysisResult> {
  try {
    console.log('Starting pose analysis...');
    console.log('Data received:', {
      poseName: data.poseName,
      hasPhoto: !!data.photo
    });

    const response = await fetch('/.netlify/functions/analyze-pose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      
      throw new AnalysisError(
        'Server error during analysis. Please try again.',
        'SERVER_ERROR',
        errorText
      );
    }

    const result = await response.json();
    console.log('Analysis result received');

    if (!isValidAnalysisResult(result)) {
      throw new AnalysisError(
        'Invalid analysis result received',
        'INVALID_RESPONSE'
      );
    }

    return result;
  } catch (error) {
    console.error('Error in analyzePose:', error);
    if (error instanceof AnalysisError) {
      throw error;
    }
    throw new AnalysisError(
      'Failed to complete pose analysis',
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

function isValidAnalysisResult(result: any): result is AnalysisResult {
  return (
    result &&
    typeof result === 'object' &&
    typeof result.score === 'number' &&
    typeof result.feedback === 'string' &&
    Array.isArray(result.recommendations) &&
    typeof result.isGoodForm === 'boolean'
  );
}
