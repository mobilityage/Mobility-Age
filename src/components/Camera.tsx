import { useRef, useState, useEffect } from 'react';

interface CameraProps {
  onPhotoTaken: (photoData: string) => void;
}

const CameraComponent = ({ onPhotoTaken }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // ... [rest of the state management and camera functions remain the same]

  if (error) {
    return (
      <div className="text-center p-6 bg-purple-900/30 rounded-xl backdrop-blur-sm border border-purple-300/20">
        <p className="text-purple-100 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            startCamera();
          }}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 
                     transition-all duration-300 shadow-lg shadow-purple-900/50"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      {/* Container for Instructions */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Capture Your Pose</h2>
        <p className="text-purple-200 text-sm">
          Ensure you're in a well-lit area and your full body is visible
        </p>
      </div>

      {/* Camera Container */}
      <div className="relative rounded-2xl overflow-hidden bg-purple-900/20 backdrop-blur-sm
                    border border-purple-300/20 shadow-xl">
        {/* Aspect ratio container */}
        <div className="relative aspect-[3/4] md:aspect-[4/3] w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
            onLoadedMetadata={() => setIsStreaming(true)}
          />
          
          {/* Camera UI Overlay */}
          {isStreaming && !isCountingDown && (
            <div className="absolute inset-0 flex flex-col items-center justify-end
                         bg-gradient-to-t from-black/70 via-transparent to-transparent">
              <div className="w-full p-4 space-y-4">
                {/* Camera Controls */}
                <div className="flex justify-center items-center space-x-4">
                  <button
                    onClick={toggleCamera}
                    className="p-4 bg-white/10 backdrop-blur-sm text-white rounded-full
                             hover:bg-white/20 transition-all duration-300 
                             shadow-lg border border-white/20"
                    title="Switch Camera"
                  >
                    ⟲
                  </button>
                  <button
                    onClick={startCountdown}
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full
                             hover:bg-white/20 transition-all duration-300
                             shadow-lg border border-white/20
                             font-medium text-lg"
                  >
                    Take Photo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Countdown Overlay */}
          {isCountingDown && (
            <div className="absolute inset-0 flex items-center justify-center 
                         bg-black/40 backdrop-blur-sm">
              <div className="relative">
                <div className="absolute inset-0 animate-ping opacity-50">
                  <div className="w-24 h-24 rounded-full bg-white/20"></div>
                </div>
                <div className="text-white text-6xl font-bold relative z-10">
                  {countdown}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center 
                         bg-purple-900/80 backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-transparent
                             rounded-full animate-spin"></div>
                <p className="text-purple-200 text-lg">Starting camera...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Guidelines */}
      <div className="mt-6 p-4 bg-purple-900/20 backdrop-blur-sm rounded-xl
                    border border-purple-300/20">
        <h3 className="text-white font-medium mb-2">Tips for Best Results:</h3>
        <ul className="text-purple-200 text-sm space-y-2">
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Ensure your entire body is visible in the frame
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Find a well-lit area
          </li>
          <li className="flex items-center">
            <span className="mr-2">•</span>
            Keep a clear background if possible
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CameraComponent;
