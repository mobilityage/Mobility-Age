// src/pages/AssessmentPage.tsx

import { useState, useEffect } from 'react';
import { MOBILITY_POSES } from '../types/assessment';
import Camera from '@/components/Camera';
import { PoseInstructions } from '@/components/PoseInstructions';
import { PoseFeedback } from '@/components/PoseFeedback';
import { CompletionScreen } from '@/components/CompletionScreen';
import { analyzePose, AnalysisError, AnalysisResult } from '@/services/poseAnalysisService';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type AssessmentState = 'age-input' | 'instructions' | 'camera' | 'analysis' | 'complete';

interface AssessmentHistory {
  date: string;
  averageAge: number;
  analyses: AnalysisResult[];
}

export default function AssessmentPage() {
  const [currentPose, setCurrentPose] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [assessmentState, setAssessmentState] = useState<AssessmentState>('age-input');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biologicalAge, setBiologicalAge] = useState<number | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistory[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);

  const currentPoseData = MOBILITY_POSES[currentPose];

  useEffect(() => {
    // Load assessment history from localStorage
    const history = localStorage.getItem('assessmentHistory');
    if (history) {
      setAssessmentHistory(JSON.parse(history));
    }
  }, []);

  const saveAssessmentHistory = (newAnalyses: AnalysisResult[]) => {
    const averageAge = newAnalyses.reduce((sum, a) => sum + a.mobilityAge, 0) / newAnalyses.length;
    const newHistory = {
      date: new Date().toISOString(),
      averageAge,
      analyses: newAnalyses
    };
    
    const updatedHistory = [...assessmentHistory, newHistory];
    setAssessmentHistory(updatedHistory);
    localStorage.setItem('assessmentHistory', JSON.stringify(updatedHistory));
  };

  const handleStartAssessment = (age: number) => {
    setBiologicalAge(age);
    setAssessmentState('instructions');
  };

  const handleStartPose = () => {
    setError(null);
    setAssessmentState('camera');
  };

  const handlePhotoTaken = async (photoData: string) => {
    setCurrentPhoto(photoData);
    setIsLoading(true);
    setError(null);
    try {
      const analysis = await analyzePose({
        photo: photoData,
        poseName: currentPoseData.name,
        poseDescription: currentPoseData.description,
        biologicalAge
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
    setCurrentPhoto(null);
    if (currentPose < MOBILITY_POSES.length - 1) {
      setCurrentPose(currentPose + 1);
      setAssessmentState('instructions');
      setCurrentAnalysis(null);
    } else {
      saveAssessmentHistory(analyses);
      setAssessmentState('complete');
    }
  };

  const handleRestart = () => {
    setCurrentPose(0);
    setPhotos([]);
    setAnalyses([]);
    setAssessmentState('age-input');
    setCurrentAnalysis(null);
    setCurrentPhoto(null);
    setBiologicalAge(null);
  };

  const getAverageAge = () => {
    if (analyses.length === 0) return 0;
    return analyses.reduce((sum, a) => sum + a.mobilityAge, 0) / analyses.length;
  };

  if (assessmentState === 'age-input') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Welcome to Your Mobility Assessment</h2>
            <p className="text-gray-600 mb-6">
              To provide more accurate results, please enter your biological age:
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (biologicalAge) handleStartAssessment(biologicalAge);
            }}>
              <Input
                type="number"
                min="18"
                max="100"
                placeholder="Enter your age"
                className="mb-4"
                onChange={(e) => setBiologicalAge(parseInt(e.target.value))}
              />
              <Button 
                type="submit"
                className="w-full"
                disabled={!biologicalAge || biologicalAge < 18 || biologicalAge > 100}
              >
                Start Assessment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(142,67,231,0.1),transparent)]" />
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
        <div className="mb-8 text-center transition-all duration-300">
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
        </div>

        {/* Main Content */}
        <div className="relative">
          {error && (
            <div className="absolute top-0 left-0 right-0 -mt-4 transform -translate-y-full">
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg p-4 text-red-200">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="transition-all duration-300 transform">
            {isLoading ? (
              <div className="bg-purple-900/20 backdrop-blur-sm rounded-2xl p-12 text-center 
                            border border-purple-300/20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 
                              border-4 border-white border-t-transparent mb-4" />
                <p className="text-xl text-white font-medium">Analyzing your form...</p>
                <p className="text-purple-200 mt-2">This will take just a moment</p>
              </div>
            ) : (
              <div className="transition-opacity duration-300">
                {assessmentState === 'instructions' && (
                  <PoseInstructions 
                    poseData={currentPoseData}
                    onStartPose={handleStartPose}
                  />
                )}
                {assessmentState === 'camera' && (
                  <Camera 
                    onPhotoTaken={handlePhotoTaken}
                    currentPhoto={currentPhoto}
                  />
                )}
                {assessmentState === 'analysis' && currentAnalysis && (
                  <PoseFeedback
                    analysis={currentAnalysis}
                    onContinue={handleContinue}
                    onRetry={() => setAssessmentState('instructions')}
                    photo={currentPhoto}
                    biologicalAge={biologicalAge}
                  />
                )}
                {assessmentState === 'complete' && (
                  <CompletionScreen 
                    averageAge={getAverageAge()}
                    analyses={analyses.map(analysis => ({
                      ...analysis,
                      poseName: analysis.poseName || MOBILITY_POSES[analyses.indexOf(analysis)].name
                    }))}
                    onRestart={handleRestart}
                    assessmentHistory={assessmentHistory}
                    biologicalAge={biologicalAge}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicators */}
        {assessmentState !== 'complete' && (
          <div className="mt-8 flex justify-center space-x-2">
            {MOBILITY_POSES.map((_, index) => (
              <div
                key={index}
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
