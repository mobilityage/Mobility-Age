export interface AssessmentData {
  biological_age: number;
  mobility_age: number;
  poses: any[];
  feedback: Array<{
    poseName: string;
    recommendations: string[];
  }>;
}
