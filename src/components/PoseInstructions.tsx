// src/components/PoseInstructions.tsx
export function PoseInstructions({ poseData, onStartPose }: PoseInstructionsProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-300/20">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {poseData.name}
          </h2>
          <p className="text-purple-200 mt-1">{poseData.description}</p>
        </div>

        {/* Reference Image */}
        {poseData.referenceImage && (
          <div className="relative aspect-video">
            <img 
              src={poseData.referenceImage}
              alt="Reference Pose"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 bg-black/30 rounded-full text-sm text-white">
                  Reference Pose
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-6 space-y-6">
          {/* Setup Instructions */}
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-4">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-500 text-sm">
                1
              </span>
              Setup
            </h3>
            <ul className="space-y-2 text-purple-100">
              {poseData.setup.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-4">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-500 text-sm">
                2
              </span>
              Steps
            </h3>
            <ul className="space-y-2 text-purple-100">
              {poseData.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Camera Position */}
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-4">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-500 text-sm">
                3
              </span>
              Camera Setup
            </h3>
            <p className="text-purple-100">{poseData.cameraPosition}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-6 bg-purple-900/30 border-t border-purple-300/20">
          <button
            onClick={onStartPose}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 
                     text-white px-6 py-3 rounded-xl font-semibold
                     hover:from-purple-500 hover:to-purple-400 
                     transform transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                     shadow-lg hover:shadow-xl"
          >
            Start Pose
          </button>
        </div>
      </div>
    </div>
  );
}
