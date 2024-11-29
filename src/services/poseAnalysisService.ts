// src/services/poseAnalysisService.ts

import type { AnalysisResult, PoseAnalysis, RetryMessage } from '../types/assessment';

export class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export async function analyzePose(data: PoseAnalysis): Promise<AnalysisResult | RetryMessage> {
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

    const result = await response.json();

    if (response.status === 422 && 'needsRetry' in result) {
      return result as RetryMessage;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new AnalysisError(`Server error: ${errorText}`);
    }

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
    throw error instanceof Error ? error : new AnalysisError('Failed to analyze pose. Please try again.');
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
    Array.isArray(result.exercises)
  );
}
