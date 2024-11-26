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
  constructor(message: string) {
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
      throw new AnalysisError('Failed to analyze pose. Please try again.');
    }

    const result = await response.json();
    
    if (!isValidAnalysisResult(result)) {
      throw new AnalysisError('Invalid response from analysis service');
    }

    return result;
  } catch (error) {
    console.error('Error in analyzePose:', error);
    throw error instanceof AnalysisError ? error : new AnalysisError('Failed to analyze pose');
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
