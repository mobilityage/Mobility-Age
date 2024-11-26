import { useState } from 'react';
import { MOBILITY_POSES } from '../types/assessment';
import Camera from '@/components/Camera';
import { PoseInstructions } from '@/components/PoseInstructions';
import { PoseFeedback } from '@/components/PoseFeedback';
import { analyzePose, AnalysisError } from '@/services/poseAnalysisService';

type AssessmentState = 'instructions' | 'camera' | 'analysis';

export default function AssessmentPage() {
  const [currentPose, setCurrentPose] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [assessmentState, setAssessmentState] = useState<AssessmentState>('instructions');
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPoseData = MOBILITY_POSES[currentPose];

  const handleStartPose = () => {
    setError(null);
    setAssessmentState('camera');
  };

  const handlePhotoTaken = async (photoData: string) => {
    setIsLoading(true);
    setError(null);
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
      setError(error instanceof AnalysisError ? error.message : 'Failed to analyze pose');
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
      const totalScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
      alert(`Assessment complete! Average score: ${totalScore.toFixed(1)}`);
    }
  };

  const handleRetry = () => {
    setAssessmentState('instructions');
    setCurrentAnalysis(null);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-center">
          {currentPoseData.name}
        </h2>
        <p className="text-gray-600 mb-4">{currentPoseData.description}</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <div className="animate-pulse">
              <div className="text-lg mb-2">Analyzing your form...</div>
              <div className="text-sm text-gray-600">
                Please wait while we process your photo
              </div>
            </div>
          </div>
        ) : (
          <>
            {assessmentState === 'instructions' && (
              <PoseInstructions 
                poseData={currentPoseData}
                onStartPose={handleStartPose}
              />
            )}
            {assessmentState === 'camera' && (
              <Camera onPhotoTaken={handlePhotoTaken} />
            )}
            {assessmentState === 'analysis' && currentAnalysis && (
              <PoseFeedback
                analysis={currentAnalysis}
                onContinue={handleContinue}
                onRetry={handleRetry}
              />
            )}
          </>
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
