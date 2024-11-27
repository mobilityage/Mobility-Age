// src/services/poseAnalysisService.ts

export interface Exercise {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sets?: number;
  reps?: number;
  targetMuscles: string[];
}

export interface AnalysisResult {
  mobilityAge: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
  exercises: Exercise[];
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
  const hasRequiredFields = result &&
    typeof result === 'object' &&
    typeof result.mobilityAge === 'number' &&
    typeof result.feedback === 'string' &&
    Array.isArray(result.recommendations) &&
    typeof result.isGoodForm === 'boolean' &&
    Array.isArray(result.exercises);

  const hasValidExercises = result.exercises.every((exercise: any) => 
    exercise &&
    typeof exercise.name === 'string' &&
    typeof exercise.description === 'string' &&
    ['beginner', 'intermediate', 'advanced'].includes(exercise.difficulty) &&
    Array.isArray(exercise.targetMuscles) &&
    (!exercise.sets || typeof exercise.sets === 'number') &&
    (!exercise.reps || typeof exercise.reps === 'number')
  );

  if (!hasRequiredFields || !hasValidExercises) {
    console.log('Validation details:', {
      hasRequiredFields,
      hasValidExercises,
      mobilityAge: typeof result?.mobilityAge === 'number',
      feedback: typeof result?.feedback === 'string',
      recommendations: Array.isArray(result?.recommendations),
      isGoodForm: typeof result?.isGoodForm === 'boolean',
      exercises: Array.isArray(result?.exercises)
    });
  }

  return hasRequiredFields && hasValidExercises;
}
