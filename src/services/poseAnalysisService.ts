interface PoseAnalysis {
  photo: string;
  poseName: string;
  poseDescription: string;
}

interface AnalysisResult {
  score: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
}

export async function analyzePose(data: PoseAnalysis): Promise<AnalysisResult> {
  try {
    const response = await fetch('/.netlify/functions/analyze-pose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing pose:', error);
    throw error;
  }
}
