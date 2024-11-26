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
    const response = await fetch('/.netlify/functions/analyze-pose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photo: data.photo,
        poseName: data.poseName,
        poseDescription: data.poseDescription
      })
    });

    if (!response.ok) {
      if (response.status === 500) {
        throw new AnalysisError(
          'Server error during analysis. Please try again.',
          'SERVER_ERROR',
          await response.text()
        );
      }
      throw new AnalysisError(
        'Failed to analyze pose.',
        'API_ERROR',
        await response.text()
      );
    }

    const result = await response.json();
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
      'UNKNOWN_ERROR',
      error
    );
  }
}

function isValidAnalysisResult(result: any): result is AnalysisResult {
  return (
    typeof result === 'object' &&
    typeof result.score === 'number' &&
    typeof result.feedback === 'string' &&
    Array.isArray(result.recommendations) &&
    typeof result.isGoodForm === 'boolean'
  );
}
