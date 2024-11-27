import { AnalysisResult } from '../services/poseAnalysisService';

interface PoseFeedbackProps {
  analysis: AnalysisResult;
  onContinue: () => void;
  onRetry: () => void;
}

export function PoseFeedback({ analysis, onContinue, onRetry }: PoseFeedbackProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-purple-300/20">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-white">Mobility Analysis</h3>
          <span 
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              analysis.isGoodForm 
                ? 'bg-green-400/20 text-green-200 border border-green-400/30' 
                : 'bg-yellow-400/20 text-yellow-200 border border-yellow-400/30'
            }`}
          >
            Mobility Age: {analysis.mobilityAge}
          </span>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2 text-sm font-medium text-purple-200">
            <span>Mobility Assessment</span>
            <span>Age {analysis.mobilityAge}</span>
          </div>
          <div className="h-2.5 bg-purple-900/50 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                analysis.mobilityAge <= 30 ? 'bg-green-400' :
                analysis.mobilityAge <= 45 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${Math.max(0, 100 - analysis.mobilityAge)}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-purple-100 text-lg mb-6">{analysis.feedback}</p>
          
          {analysis.recommendations.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Recommended Improvements:</h4>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start bg-purple-800/30 rounded-lg p-4 border border-purple-300/20">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-purple-100">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          {!analysis.isGoodForm && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2.5 border border-purple-300/20 text-purple-100 rounded-lg
                         hover:bg-purple-800/30 active:bg-purple-700/30 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg
                       hover:bg-purple-500 active:bg-purple-700 transition-colors
                       shadow-lg shadow-purple-900/50"
          >
            {analysis.isGoodForm ? 'Continue' : 'Continue Anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
