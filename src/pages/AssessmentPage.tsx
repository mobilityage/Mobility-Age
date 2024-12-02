// src/pages/AssessmentPage.tsx

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MOBILITY_POSES, type AnalysisResult, type AssessmentHistory } from '../types/assessment';
import Camera from '../components/Camera';
import { PoseInstructions } from '../components/PoseInstructions';
import { PoseFeedback } from '../components/PoseFeedback';
import { CompletionScreen } from '../components/CompletionScreen';
import AssessmentInstructions from '../components/AssessmentInstructions';
import { analyzePose } from '../services/poseAnalysisService';

type AssessmentState = 'welcome' | 'age-input' | 'instructions' | 'camera' | 'analysis' | 'complete';

export default function AssessmentPage() {
  const [currentPose, setCurrentPose] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [assessmentState, setAssessmentState] = useState<AssessmentState>('welcome');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biologicalAge, setBiologicalAge] = useState<number | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistory[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const currentPoseData = MOBILITY_POSES[currentPose];

  useEffect(() => {
    const savedHistory = localStorage.getItem('assessmentHistory');
    if (savedHistory) {
      try {
        setAssessmentHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading assessment history:', e);
      }
    }
  }, []);

  const saveAssessmentHistory = (newAnalyses: AnalysisResult[]) => {
    if (!biologicalAge) return;

    const newHistory: AssessmentHistory = {
      date: new Date().toISOString(),
      averageAge: getAverageAge(),
      biologicalAge,
      analyses: newAnalyses,
    };

    const updatedHistory = [...assessmentHistory, newHistory];
    setAssessmentHistory(updatedHistory);
    try {
      localStorage.setItem('assessmentHistory', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Error saving assessment history:', e);
    }
  };

  const getAverageAge = (): number => {
    if (analyses.length === 0) return 0;
    return analyses.reduce((sum, a) => sum + a.mobilityAge, 0) / analyses.length;
  };

  const handlePhotoTaken = async (photoData: string) => {
    if (!biologicalAge) return;

    setCurrentPhoto(photoData);
    setIsLoading(true);
    setError(null);
    setRetryMessage(null);

    try {
      const response = await analyzePose({
        photo: photoData,
        poseName: currentPoseData.name,
        poseDescription: currentPoseData.description,
        biologicalAge,
      });

      if ('needsRetry' in response) {
        setRetryMessage(response.message);
        setAssessmentState('camera');
      } else {
        setPhotos([...photos, photoData]);
        setAnalyses([...analyses, response]);
        setCurrentAnalysis(response);
        setAssessmentState('analysis');
      }
    } catch (error: any) {
      console.error('Error analyzing pose:', error);
      setError(error.message || 'Failed to analyze pose');
      setAssessmentState('instructions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAssessment = () => {
    setAssessmentState('age-input');
  };

  const handleBack = () => {
    switch (assessmentState) {
      case 'camera':
        setAssessmentState('instructions');
        break;
      case 'analysis':
        setAssessmentState('camera');
        setCurrentAnalysis(null);
        break;
      case 'age-input':
        setAssessmentState('welcome');
        setBiologicalAge(null);
        break;
      case 'instructions':
        if (currentPose > 0) {
          setCurrentPose(currentPose - 1);
          setAssessmentState('analysis');
        } else {
          setAssessmentState('age-input');
        }
        break;
      default:
        return;
    }
  };

  const handleContinue = () => {
    setCurrentPhoto(null);
    setRetryMessage(null);
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
    setAssessmentState('welcome');
    setCurrentAnalysis(null);
    setCurrentPhoto(null);
    setBiologicalAge(null);
    setRetryMessage(null);
  };

  if (assessmentState === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 p-4">
        <div className="max-w-2xl mx-auto mt-20">
          <AssessmentInstructions onStart={handleStartAssessment} />
        </div>
      </div>
    );
  }

  if (assessmentState === 'age-input') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 p-4">
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 p-2 text-purple-200 hover:text-white transition-colors duration-300 rounded-lg hover:bg-purple-800/30"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="max-w-md mx-auto mt-20 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-purple-300/20">
          <h2 className="text-2xl font-bold text-white mb-4">Enter Your Age</h2>
          <p className="text-purple-200 mb-6">
            To provide more accurate results, please enter your biological age:
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (biologicalAge && biologicalAge >= 18 && biologicalAge <= 100) {
                setAssessmentState('instructions');
              }
            }}
          >
            <input
              type="number"
              min="18"
              max="100"
              placeholder="Enter your age"
              className="w-full px-4 py-2 bg-purple-900/50 border border-purple-300/20 rounded-lg text-white placeholder-purple-300 mb-4"
              onChange={(e) => setBiologicalAge(parseInt(e.target.value))}
            />
            <button
              type="submit"
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!biologicalAge || biologicalAge < 18 || biologicalAge > 100}
            >
              Start Assessment
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 relative">
      {/* Other states */}
    </div>
  );
}
