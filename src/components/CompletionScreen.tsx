// src/components/CompletionScreen.tsx

import { Exercise } from '../services/poseAnalysisService';

interface CompletionScreenProps {
  averageAge: number;
  analyses: {
    poseName: string;
    mobilityAge: number;
    feedback: string;
    exercises: Exercise[];
  }[];
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

      <div className="relative p-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Assessment Complete!</h2>
          <p className="text-purple-200">Here's your mobility analysis</p>
        </div>

        {/* Age Display */}
        <div className="mb-12 text-center">
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
        <div className="space-y-8 mb-8">
          {analyses.map((analysis, index) => (
            <div key={index} className="bg-purple-800/20 rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-purple-200">{analysis.poseName}</span>
                  <span className="text-white font-medium">Age {analysis.mobilityAge}</span>
                </div>
                <div className="h-1.5 bg-purple-900/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                    style={{ width: `${Math.max(0, 100 - analysis.mobilityAge)}%` }}
                  />
                </div>
              </div>

              {/* Exercise Recommendations */}
              {analysis.exercises.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Recommended Exercises:</h4>
                  <div className="grid gap-3">
                    {analysis.exercises.map((exercise, idx) => (
                      <div key={idx} className="bg-purple-900/30 rounded-lg p-4 border border-purple-300/10">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-white font-medium">{exercise.name}</h5>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            exercise.difficulty === 'beginner' ? 'bg-green-400/20 text-green-200' :
                            exercise.difficulty === 'intermediate' ? 'bg-yellow-400/20 text-yellow-200' :
                            'bg-red-400/20 text-red-200'
                          }`}>
                            {exercise.difficulty}
                          </span>
                        </div>
                        <p className="text-purple-200 text-sm mb-2">{exercise.description}</p>
                        <div className="flex flex-wrap gap-2 text-sm">
                          {exercise.sets && exercise.reps && (
                            <span className="text-purple-200">
                              {exercise.sets} sets × {exercise.reps} reps
                            </span>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {exercise.targetMuscles.map((muscle, midx) => (
                              <span 
                                key={midx}
                                className="px-2 py-1 bg-purple-800/30 rounded-full text-purple-200 text-xs"
                              >
                                {muscle}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
