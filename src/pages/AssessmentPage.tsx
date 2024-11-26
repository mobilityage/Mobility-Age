import { useState, useEffect, useRef } from 'react';
import { MOBILITY_POSES } from '../types/assessment';

// Inline Camera Component
const Camera = ({ onPhotoTaken }: { onPhotoTaken: (photoData: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please ensure you've granted camera permissions.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg');
      onPhotoTaken(photoData);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {!isStreaming ? (
        <button
          onClick={startCamera}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Start Camera
        </button>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-w-full h-auto"
          />
          <button
            onClick={takePhoto}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                     bg-white text-blue-500 px-4 py-2 rounded-full shadow"
          >
            Take Photo
          </button>
        </div>
      )}
    </div>
  );
};

// Rest of your AssessmentPage component remains the same

export default function AssessmentPage() {
  const [currentPose, setCurrentPose] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [timer, setTimer] = useState(5);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    let interval: number;
    if (isCountingDown && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsCountingDown(false);
      setTimer(5);
    }
    return () => clearInterval(interval);
  }, [isCountingDown, timer]);

  const currentPoseData = MOBILITY_POSES[currentPose];

  const handleStartPose = () => {
    setShowInstructions(false);
    setIsCountingDown(true);
  };

  const handlePhotoTaken = (photoData: string) => {
    setPhotos([...photos, photoData]);
    if (currentPose < MOBILITY_POSES.length - 1) {
      setCurrentPose(currentPose + 1);
      setShowInstructions(true);
    } else {
      // Here we'll eventually send photos to API for analysis
      console.log("Assessment complete!");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-center">
          {currentPoseData.name}
        </h2>
        <p className="text-gray-600 mb-4">{currentPoseData.description}</p>

        {showInstructions ? (
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <h3 className="font-bold mb-2">Setup:</h3>
            <ul className="list-disc pl-5 mb-4">
              {currentPoseData.setup.map((step, index) => (
                <li key={`setup-${index}`} className="mb-1">{step}</li>
              ))}
            </ul>
            
            <h3 className="font-bold mb-2">Steps:</h3>
            <ul className="list-disc pl-5 mb-4">
              {currentPoseData.steps.map((step, index) => (
                <li key={`step-${index}`} className="mb-1">{step}</li>
              ))}
            </ul>

            <p className="text-sm text-gray-600 mb-4">
              {currentPoseData.cameraPosition}
            </p>

            <button
              onClick={handleStartPose}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Start Pose
            </button>
          </div>
        ) : (
          <>
            {isCountingDown ? (
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-blue-500">{timer}</div>
                <p>Get into position...</p>
              </div>
            ) : (
              <Camera onPhotoTaken={handlePhotoTaken} />
            )}
          </>
        )}

        <div className="mt-4 text-center text-sm text-gray-600">
          Pose {currentPose + 1} of {MOBILITY_POSES.length}
          {photos.length > 0 && (
            <p>{photos.length} poses captured</p>
          )}
        </div>
      </div>
    </div>
  );
}
