import { useRef, useState, useEffect } from 'react';

interface CameraProps {
  onPhotoTaken: (photoData: string) => void;
}

const Camera = ({ onPhotoTaken }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please ensure you've granted camera permissions.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup: stop all video streams when component unmounts
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

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
      context.drawImage(videoRef.current, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      onPhotoTaken(photoData);

      // Stop the camera stream after taking photo
      const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks();
      tracks?.forEach(track => track.stop());
    }
  };

  if (error) {
    return (
      <div className="text-center p-4 bg-red-50 rounded-lg">
        <p className="text-red-600 mb-2">{error}</p>
        <button
          onClick={() => {
            setError(null);
            startCamera();
          }}
          className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          onLoadedMetadata={() => setIsStreaming(true)}
        />
        
        {isStreaming && !isCountingDown && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30">
            <p className="text-white mb-4 text-lg">
              Position yourself according to the instructions
            </p>
            <button
              onClick={startCountdown}
              className="bg-white text-blue-500 px-6 py-2 rounded-full shadow-lg
                       hover:bg-blue-50 transition-colors"
            >
              Take Photo
            </button>
          </div>
        )}

        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <div className="text-white text-6xl font-bold">
              {countdown}
            </div>
          </div>
        )}
      </div>

      {!isStreaming && (
        <div className="mt-4 text-center">
          <p className="text-gray-600">Starting camera...</p>
        </div>
      )}
    </div>
  );
};

export default Camera;
