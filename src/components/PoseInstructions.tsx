import { PoseImage } from './PoseImage';
import { PoseInstruction } from '../types/assessment';

interface PoseInstructionsProps {
  poseData: PoseInstruction;
  onStartPose: () => void;
}

export function PoseInstructions({ poseData, onStartPose }: PoseInstructionsProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      {poseData.referenceImage && (
        <PoseImage src={poseData.referenceImage} name={poseData.name} />
      )}

      <h3 className="font-bold mb-2">Setup:</h3>
      <ul className="list-disc pl-5 mb-4">
        {poseData.setup.map((step, index) => (
          <li key={`setup-${index}`} className="mb-1">{step}</li>
        ))}
      </ul>
      
      <h3 className="font-bold mb-2">Steps:</h3>
      <ul className="list-disc pl-5 mb-4">
        {poseData.steps.map((step, index) => (
          <li key={`step-${index}`} className="mb-1">{step}</li>
        ))}
      </ul>

      <p className="text-sm text-gray-600 mb-4">
        {poseData.cameraPosition}
      </p>

      <button
        onClick={onStartPose}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Start Pose
      </button>
    </div>
  );
}
