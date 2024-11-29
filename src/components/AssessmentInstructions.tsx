// src/components/AssessmentInstructions.tsx

interface AssessmentInstructionsProps {
  onStart: () => void;
}

export default function AssessmentInstructions({ onStart }: AssessmentInstructionsProps) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-300/20">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Mobility Age Assessment</h2>
        <p className="text-purple-200 mb-4">
          Your mobility age reflects how well you can move compared to others your age. Just like 
          metabolic age measures internal health, mobility age measures your physical capabilities 
          through flexibility, strength, and control.
        </p>
        <div className="flex items-start gap-4 bg-purple-900/30 p-4 rounded-lg">
          <div className="flex-shrink-0 mt-1">
            <Info className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <p className="text-purple-200 text-sm">
              You'll be guided through 4 simple mobility poses. For each pose, you'll need to:
            </p>
            <ul className="mt-2 space-y-2 text-sm text-purple-200">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Review the pose instructions and reference image</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Capture a photo of yourself performing the pose</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Receive personalized feedback and recommendations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowGuide(!showGuide)}
        className="w-full mb-4 px-4 py-2 bg-purple-900/30 text-purple-200 rounded-lg 
                 hover:bg-purple-800/30 transition-colors text-sm flex items-center justify-center gap-2"
      >
        <Info className="w-4 h-4" />
        How to take good photos
      </button>

      {showGuide && (
        <div className="mb-6 bg-purple-900/30 p-4 rounded-lg text-sm">
          <h3 className="text-white font-medium mb-3">Photo Capture Guide</h3>
          <ul className="space-y-3 text-purple-200">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-800 flex items-center justify-center text-xs text-white flex-shrink-0 mt-0.5">1</span>
              <span>Use portrait orientation and ensure your full body is visible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-800 flex items-center justify-center text-xs text-white flex-shrink-0 mt-0.5">2</span>
              <span>Find good lighting and a clear background</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-800 flex items-center justify-center text-xs text-white flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="mb-1">Choose your capture method:</p>
                <ul className="space-y-1 ml-7 list-disc">
                  <li>Use the timer function (recommended)</li>
                  <li>Ask someone to take the photo</li>
                  <li>Record a video and screenshot the correct pose</li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      )}

      <button
        onClick={onStart}
        className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl
                 hover:bg-purple-500 transition-colors duration-300
                 font-medium shadow-lg shadow-purple-900/50"
      >
        Start Assessment
      </button>
    </div>
  );
}
