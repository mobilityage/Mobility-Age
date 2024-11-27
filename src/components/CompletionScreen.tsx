// src/components/CompletionScreen.tsx

import type { Exercise } from '../types/assessment';
import type { AnalysisResult } from '../types/assessment';

interface CompletionScreenProps {
  averageAge: number;
  analyses: AnalysisResult[];
  onRestart: () => void;
}

export function CompletionScreen({ averageAge, analyses, onRestart }: CompletionScreenProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-purple-900/20 backdrop-blur-sm border border-purple-300/20">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-500/20 animate-pulse" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
      </div>

      <div className="relative p-8 text-center">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Assessment Complete!</h2>
          <p className="text-purple-200">Here's your mobility analysis</p>
        </div>

        {/* Age Display */}
        <div className="mb-12">
          <div className="inline-block rounded-full p-1 bg-gradient-to-r from-purple-500 to-blue-500">
            <div className="bg-purple-900 rounded-full p-8">
              <div className="text-5xl font-bold text-white mb-2">
                {Math.round(averageAge)}
              </div>
              <div className="text-purple-200">Mobility Age</div>
            </div>
          </div>
        </div>

        {/* Pose Breakdown */}
        <div className="grid gap-4 mb-8">
          {analyses.map((analysis, index) => (
            <div key={index} className="bg-purple-800/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-purple-200">{analysis.poseName}</span>
                <span className="text-white font-medium">Age {analysis.mobilityAge}</span>
              </div>
              <div className="mt-2 h-1.5 bg-purple-900/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                  style={{ width: `${Math.max(0, 100 - analysis.mobilityAge)}%` }}
                />
              </div>

              {/* Exercise Recommendations */}
              {analysis.exercises && analysis.exercises.length > 0 && (
                <div className="mt-4">
                  {analysis.exercises.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="mt-2 text-sm">
                      <div className="flex justify-between items-start text-purple-200">
                        <span>{exercise.name}</span>
                        <span className="text-xs bg-purple-700/50 px-2 py-1 rounded-full">
                          {exercise.difficulty}
                        </span>
                      </div>
                      {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exercise.targetMuscles.map((muscle: string, muscleIndex: number) => (
                            <span 
                              key={muscleIndex}
                              className="text-xs bg-purple-800/50 px-2 py-0.5 rounded-full text-purple-200"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid gap-4">
          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 
                     text-white px-6 py-3 rounded-xl font-medium
                     hover:from-purple-500 hover:to-purple-400 
                     transition-all duration-300 shadow-lg
                     focus:ring-2 focus:ring-purple-400"
          >
            Start New Assessment
          </button>
          <button
            onClick={() => window.print()}
            className="w-full bg-purple-800/30 text-purple-200 px-6 py-3 rounded-xl
                     hover:bg-purple-700/30 transition-all duration-300
                     border border-purple-300/20"
          >
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
