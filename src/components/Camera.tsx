import { useRef, useState, useEffect } from 'react';

interface CameraProps {
  onPhotoTaken: (photoData: string) => void;
}

const Camera = ({ onPhotoTaken }: CameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        {isStreaming && (
          <button
            onClick={takePhoto}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                     bg-white text-blue-500 px-6 py-2 rounded-full shadow-lg
                     hover:bg-blue-50 transition-colors"
          >
            Take Photo
          </button>
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
