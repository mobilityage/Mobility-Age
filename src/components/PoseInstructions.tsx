import { PoseInstruction } from '../types/assessment';

interface PoseInstructionsProps {
  poseData: PoseInstruction;
  onStartPose: () => void;
}

export function PoseInstructions({ poseData, onStartPose }: PoseInstructionsProps) {
  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <div className="bg-purple-900/20 backdrop-blur-sm rounded-2xl 
                    border border-purple-300/20 shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-purple-800/40 p-6 border-b border-purple-300/20">
          <h2 className="text-2xl font-semibold text-white mb-2">{poseData.name}</h2>
          <p className="text-purple-200">{poseData.description}</p>
        </div>

        {/* Reference Image */}
        {poseData.referenceImage && (
          <div className="relative aspect-video overflow-hidden">
            <img 
              src={poseData.referenceImage} 
              alt={`Reference pose for ${poseData.name}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 via-transparent to-transparent">
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 bg-purple-900/60 backdrop-blur-sm 
                               rounded-full text-sm text-purple-100 
                               border border-purple-300/20">
                  Reference Pose
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Setup Instructions */}
          <div className="space-y-3">
            <h3 className="text-xl font-medium text-white flex items-center">
              <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-3 text-sm">
                1
              </span>
              Setup
            </h3>
            <ul className="space-y-2 pl-11">
              {poseData.setup.map((step, index) => (
                <li key={`setup-${index}`} 
                    className="text-purple-200 flex items-start">
                  <span className="mr-2 text-purple-400">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h3 className="text-xl font-medium text-white flex items-center">
              <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-3 text-sm">
                2
              </span>
              Steps
            </h3>
            <ul className="space-y-2 pl-11">
              {poseData.steps.map((step, index) => (
                <li key={`step-${index}`} 
                    className="text-purple-200 flex items-start">
                  <span className="mr-2 text-purple-400">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Camera Position */}
          <div className="space-y-3">
            <h3 className="text-xl font-medium text-white flex items-center">
              <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-3 text-sm">
                3
              </span>
              Camera Setup
            </h3>
            <p className="text-purple-200 pl-11">
              {poseData.cameraPosition}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-6 bg-purple-800/40 border-t border-purple-300/20">
          <button
            onClick={onStartPose}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 
                     text-white px-6 py-3 rounded-xl font-medium
                     hover:from-purple-500 hover:to-purple-400 
                     transition-all duration-300 shadow-lg
                     focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 
                     focus:ring-offset-purple-900 focus:outline-none"
          >
            Start Pose
          </button>
        </div>
      </div>
    </div>
  );
}
