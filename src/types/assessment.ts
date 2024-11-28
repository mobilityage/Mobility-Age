// src/types/assessment.ts

export interface PoseInstruction {
  name: string;
  description: string;
  setup: string[];
  steps: string[];
  duration: number;
  targetAngle?: number;
  cameraPosition: string;
  referenceImage: string;
}

export interface Exercise {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sets?: number;
  reps?: number;
  steps?: string[];
  frequency?: string;
  targetMuscles: string[];
  progressionMetrics?: string;
}

export interface AnalysisResult {
  mobilityAge: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
  exercises: Exercise[];
  poseName: string;
  comparativeAge?: {
    difference: number;
    assessment: string;
  };
}

export interface PoseAnalysis {
  photo: string;
  poseName: string;
  poseDescription: string;
  biologicalAge?: number;
}

export interface AssessmentHistory {
  date: string;
  averageAge: number;
  biologicalAge?: number;
  analyses: AnalysisResult[];
}

// Keep existing MOBILITY_POSES constant unchanged
export const MOBILITY_POSES: PoseInstruction[] = [
  // ... existing poses
];
