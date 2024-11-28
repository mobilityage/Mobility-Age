// src/services/poseAnalysisService.ts

import type { AnalysisResult, PoseAnalysis } from '../types/assessment';

export class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export async function analyzePose(data: PoseAnalysis): Promise<AnalysisResult> {
  try {
    console.log('Starting pose analysis for:', data.poseName);

    if (!data.photo) {
      throw new AnalysisError('No photo data provided');
    }

    const response = await fetch('/.netlify/functions/analyze-pose', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

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

    return {
      ...result,
      poseName: data.poseName,
      exercises: result.exercises || []
    };
  } catch (error) {
    console.error('Analysis error:', error);
    if (error instanceof AnalysisError) {
      throw error;
    }
    throw new AnalysisError('Failed to analyze pose. Please try again.');
  }
}

function isValidAnalysisResult(result: any): result is AnalysisResult {
  return (
    result !== null &&
    typeof result === 'object' &&
    typeof result.mobilityAge === 'number' &&
    typeof result.feedback === 'string' &&
    Array.isArray(result.recommendations) &&
    typeof result.isGoodForm === 'boolean' &&
    (!result.exercises || Array.isArray(result.exercises))
  );
}

export type { AnalysisResult, PoseAnalysis };
