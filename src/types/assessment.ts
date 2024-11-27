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
  targetMuscles: string[];
}

export interface AnalysisResult {
  mobilityAge: number;
  feedback: string;
  recommendations: string[];
  isGoodForm: boolean;
  exercises: Exercise[];
  poseName: string;
}

export interface PoseAnalysis {
  photo: string;
  poseName: string;
  poseDescription: string;
}

export interface AssessmentState {
  currentPose: number;
  photos: string[];
  analyses: AnalysisResult[];
  state: 'instructions' | 'camera' | 'analysis' | 'complete';
  currentAnalysis: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}
