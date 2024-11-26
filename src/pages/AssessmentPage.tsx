import { useState, useEffect } from 'react';
import { MOBILITY_POSES } from '../types/assessment';
import Camera from '@/components/Camera';
import { PoseInstructions } from '@/components/PoseInstructions';
import { PoseFeedback } from '@/components/PoseFeedback';
import { analyzePose } from '@/services/poseAnalysisService';

type AssessmentState = 'instructions' | 'camera' | 'countdown' | 'analysis';

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
      
      setPhotos([...photos, photoData]);
      setAnalyses([...analyses, analysis]);
      setCurrentAnalysis(analysis);
      setAssessmentState('analysis');
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
      // For now, just show completion message
      alert('Assessment complete! Final analysis feature coming soon.');
      // Here we could navigate to a results page or show final analysis
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
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-blue-500">{timer}</div>
            <p>Get into position...</p>
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
          <div className="text-center py-8">
            <div className="text-lg mb-2">Analyzing your form...</div>
            <div className="text-sm text-gray-600">
              Our AI physiotherapist is reviewing your pose
            </div>
          </div>
        ) : (
          renderContent()
        )}

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Pose {currentPose + 1} of {MOBILITY_POSES.length}</p>
          {photos.length > 0 && (
            <p>{photos.length} poses analyzed</p>
          )}
        </div>
      </div>
    </div>
  );
}
