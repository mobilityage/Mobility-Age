import { useState, useEffect } from 'react';
import { MOBILITY_POSES } from '../types/assessment';
import Camera from '@/components/Camera';
import { PoseInstructions } from '@/components/PoseInstructions';
import { PoseFeedback } from '@/components/PoseFeedback';
import { analyzePose } from '@/services/poseAnalysisService';

type AssessmentState = 'instructions' | 'camera' | 'countdown' | 'analysis';

interface StoredAssessment {
  photos: string[];
  analyses: any[];
  timestamp: number;
}

export default function AssessmentPage() {
  const [currentPose, setCurrentPose] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [assessmentState, setAssessmentState] = useState<AssessmentState>('instructions');
  const [timer, setTimer] = useState(5);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval: number;
    if (assessmentState === 'countdown' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setAssessmentState('camera');
      setTimer(5);
    }
    return () => clearInterval(interval);
  }, [assessmentState, timer]);

  const currentPoseData = MOBILITY_POSES[currentPose];

  const handleStartPose = () => {
    setAssessmentState('countdown');
  };

  const handlePhotoTaken = async (photoData: string) => {
    setIsLoading(true);
    try {
      const analysis = await analyzePose({
        photo: photoData,
        poseName: currentPoseData.name,
        poseDescription: currentPoseData.description
      });
      
      const newPhotos = [...photos, photoData];
      const newAnalyses = [...analyses, analysis];
      
      setPhotos(newPhotos);
      setAnalyses(newAnalyses);
      setCurrentAnalysis(analysis);
      setAssessmentState('analysis');

      // Store progress in localStorage
      const assessment: StoredAssessment = {
        photos: newPhotos,
        analyses: newAnalyses,
        timestamp: Date.now()
      };
      localStorage.setItem('currentAssessment', JSON.stringify(assessment));

    } catch (error) {
      console.error('Error analyzing pose:', error);
      alert('Failed to analyze pose. Please try again.');
      setAssessmentState('instructions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (currentPose < MOBILITY_POSES.length - 1) {
      setCurrentPose(currentPose + 1);
      setAssessmentState('instructions');
      setCurrentAnalysis(null);
    } else {
      // Final analysis
      const totalScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
      alert(`Assessment complete! Average score: ${totalScore.toFixed(1)}`);
      localStorage.removeItem('currentAssessment'); // Clear stored progress
    }
  };

  const handleRetry = () => {
    setAssessmentState('instructions');
    setCurrentAnalysis(null);
  };

  const renderContent = () => {
    switch (assessmentState) {
      case 'instructions':
        return (
          <PoseInstructions 
            poseData={currentPoseData}
            onStartPose={handleStartPose}
          />
        );
      case 'countdown':
        return (
          <div className="text-center mb-4 bg-white p-8 rounded-lg shadow-md">
            <div className="text-6xl font-bold text-blue-500 mb-2">{timer}</div>
            <p className="text-xl">Get into position...</p>
            <p className="text-gray-600 mt-2">{currentPoseData.cameraPosition}</p>
          </div>
        );
      case 'camera':
        return <Camera onPhotoTaken={handlePhotoTaken} />;
      case 'analysis':
        return currentAnalysis ? (
          <PoseFeedback
            analysis={currentAnalysis}
            onContinue={handleContinue}
            onRetry={handleRetry}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-center">
          {currentPoseData.name}
        </h2>
        <p className="text-gray-600 mb-4">{currentPoseData.description}</p>

        {isLoading ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <div className="animate-pulse">
              <div className="text-lg mb-2">Analyzing your form...</div>
              <div className="text-sm text-gray-600">
                Our AI physiotherapist is reviewing your pose
              </div>
            </div>
          </div>
        ) : (
          renderContent()
        )}

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Pose {currentPose + 1} of {MOBILITY_POSES.length}</p>
          {photos.length > 0 && (
            <p className="mt-1">{photos.length} poses analyzed</p>
          )}
        </div>
      </div>
    </div>
  );
}
