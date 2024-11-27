import { useState } from 'react';
import { MOBILITY_POSES } from '../types/assessment';
import Camera from '@/components/Camera';
import { PoseInstructions } from '@/components/PoseInstructions';
import { PoseFeedback } from '@/components/PoseFeedback';
import { CompletionScreen } from '@/components/CompletionScreen';
import { analyzePose, AnalysisError } from '@/services/poseAnalysisService';
import { motion, AnimatePresence } from 'framer-motion';

type AssessmentState = 'instructions' | 'camera' | 'analysis' | 'complete';

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
      setAssessmentState('complete');
    }
  };

  const handleRestart = () => {
    setCurrentPose(0);
    setPhotos([]);
    setAnalyses([]);
    setAssessmentState('instructions');
    setCurrentAnalysis(null);
  };

  const getAverageAge = () => {
    return analyses.reduce((sum, a) => sum + a.mobilityAge, 0) / analyses.length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 relative">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(142,67,231,0.1),transparent)]" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/5 rounded-full"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-purple-900/50 z-50">
        <div 
          className="h-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-500"
          style={{ 
            width: `${((currentPose + (assessmentState === 'analysis' ? 1 : 0)) / MOBILITY_POSES.length) * 100}%` 
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPose}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              {assessmentState === 'complete' ? 'Assessment Complete' : 'Mobility Assessment'}
            </h1>
            {assessmentState !== 'complete' && (
              <div className="flex items-center justify-center space-x-2 text-purple-200">
                <span>Pose {currentPose + 1} of {MOBILITY_POSES.length}</span>
                <span>•</span>
                <span>{currentPoseData.name}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Main Content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-0 right-0 -mt-4 transform -translate-y-full"
              >
                <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg p-4 text-red-200">
                  <p className="text-sm">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-purple-900/20 backdrop-blur-sm rounded-2xl p-12 text-center 
                          border border-purple-300/20"
              >
                <div className="inline-block animate-spin rounded-full h-12 w-12 
                              border-4 border-white border-t-transparent mb-4" />
                <p className="text-xl text-white font-medium">Analyzing your form...</p>
                <p className="text-purple-200 mt-2">This will take just a moment</p>
              </motion.div>
            ) : (
              <motion.div
                key={assessmentState}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
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
                    onRetry={() => setAssessmentState('instructions')}
                  />
                )}
                {assessmentState === 'complete' && (
                  <CompletionScreen 
                    averageAge={getAverageAge()}
                    analyses={analyses}
                    onRestart={handleRestart}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Indicators */}
        {assessmentState !== 'complete' && (
          <div className="mt-8 flex justify-center space-x-2">
            {MOBILITY_POSES.map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index < currentPose 
                    ? 'bg-purple-400' 
                    : index === currentPose
                      ? 'bg-white w-4'
                      : 'bg-purple-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
