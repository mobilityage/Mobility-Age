interface PoseImageProps {
  src: string;
  name: string;
}

export function PoseImage({ src, name }: PoseImageProps) {
  return (
    <div className="relative aspect-w-4 aspect-h-3 mb-4 overflow-hidden rounded-lg">
      <img 
        src={src} 
        alt={`Reference pose for ${name}`}
        className="object-cover w-full h-full rounded-lg shadow-sm"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
        <p className="text-white text-sm text-center">Reference pose</p>
      </div>
    </div>
  );
}
