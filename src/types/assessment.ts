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
  steps: string[];
  frequency: string;
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

export const MOBILITY_POSES: PoseInstruction[] = [
  {
    name: "Deep Squat",
    description: "Tests ankle dorsiflexion, knee flexion, hip mobility, thoracic extension, and shoulder mobility",
    setup: [
      "Stand with feet shoulder-width apart",
      "Point your toes slightly outward",
      "Hold your arms straight out in front"
    ],
    steps: [
      "Keep your heels firmly on the ground",
      "Squat down as low as you comfortably can",
      "Keep your chest up and arms out in front",
      "Try to get your thighs parallel to the ground or lower"
    ],
    duration: 5,
    targetAngle: 90,
    cameraPosition: "Position your phone 6-8 feet away, at knee height, from your side",
    referenceImage: "/images/poses/deep-squat.jpg"
  },
  {
    name: "Apley Scratch Test",
    description: "Tests shoulder flexibility, thoracic spine movement and functional asymmetry",
    setup: [
      "Stand straight facing away from the camera",
      "We'll test both sides, starting with your right arm"
    ],
    steps: [
      "Reach your right arm over your shoulder",
      "Reach your left arm behind your lower back",
      "Try to touch your fingers together between your shoulder blades",
      "Hold the position when you reach your maximum range"
    ],
    duration: 3,
    cameraPosition: "Position your phone 4-5 feet away, facing your back",
    referenceImage: "/images/poses/apley-scratch.jpg"
  },
  {
    name: "Forward Fold",
    description: "Tests hamstrings flexibility and hip mobility",
    setup: [
      "Stand with feet hip-width apart",
      "Keep your legs straight but not locked",
      "Arms hanging relaxed"
    ],
    steps: [
      "Bend forward from your hips",
      "Let your arms hang down towards your toes",
      "Keep your legs as straight as possible",
      "Relax your head and neck"
    ],
    duration: 3,
    targetAngle: 90,
    cameraPosition: "Position your phone 4-5 feet away, at hip height, from your side",
    referenceImage: "/images/poses/forward-fold.jpg"
  },
  {
    name: "Knee to Wall Test",
    description: "Tests ankle mobility and dorsiflexion",
    setup: [
      "Stand facing a wall, about 4 inches away",
      "Place one foot approximately 4 inches (10cm) away from the wall and step the other foot back",
      "Keep your heel firmly planted"
    ],
    steps: [
      "Bend your knee to touch the wall",
      "Keep your heel planted firmly on the ground",
      "If successful, move your foot back slightly and repeat",
      "Stop when your heel starts to lift or knee can't touch wall"
    ],
    duration: 3,
    cameraPosition: "Position your phone 3-4 feet away, parallel to your side",
    referenceImage: "/images/poses/knee-wall.jpg"
  }
];
