interface PoseImageProps {
  src: string;
  name: string;
  width?: number;
  height?: number;
}

export function PoseImage({ 
  src, 
  name, 
  width = 400, 
  height = 300 
}: PoseImageProps) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-purple-300/20 shadow-lg">
      <img 
        src={src} 
        alt={`Reference pose for ${name}`}
        width={width}
        height={height}
        loading="lazy"
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
  );
}
