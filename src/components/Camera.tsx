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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please ensure you've granted camera permissions.");
    }
  };

  const toggleCamera = async () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    
    if (isCountingDown && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      takePhoto();
      setIsCountingDown(false);
      setCountdown(5);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isCountingDown, countdown]);

  const startCountdown = () => {
    setIsCountingDown(true);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      if (facingMode === 'user') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(videoRef.current, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      onPhotoTaken(photoData);

      const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks();
      tracks?.forEach(track => track.stop());
    }
  };

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
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden 
                    border-2 border-purple-300/20 shadow-xl shadow-purple-900/30">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          onLoadedMetadata={() => setIsStreaming(true)}
        />
        
        {isStreaming && !isCountingDown && (
          <div className="absolute inset-0 flex flex-col items-center justify-center 
                         bg-gradient-to-t from-purple-900/70 to-transparent">
            <p className="text-white mb-4 text-lg text-center px-4">
              Position yourself according to the instructions
            </p>
            <div className="flex space-x-3">
              <button
                onClick={toggleCamera}
                className="p-3 bg-purple-600/80 text-white rounded-full hover:bg-purple-500/80 
                         transition-all duration-300 shadow-lg"
                title="Switch Camera"
              >
                ⟲
              </button>
              <button
                onClick={startCountdown}
                className="px-6 py-3 bg-purple-600/80 text-white rounded-full hover:bg-purple-500/80 
                         transition-all duration-300 shadow-lg flex items-center space-x-2"
              >
                <span>Take Photo</span>
              </button>
            </div>
          </div>
        )}

        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-purple-900/40 backdrop-blur-sm">
            <div className="text-white text-7xl font-bold animate-pulse">
              {countdown}
            </div>
          </div>
        )}
      </div>

      {!isStreaming && (
        <div className="text-center">
          <p className="text-purple-200">Starting camera...</p>
        </div>
      )}
    </div>
  );
};

export default CameraComponent;
