import React, { useState } from 'react';
import { getInitials, getAvatarColor, isValidImageUrl } from '../../utils/avatarUtils';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg',
  lg: 'w-16 h-16 text-xl'
};

export default function Avatar({ name, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const shouldShowImage = avatarUrl && isValidImageUrl(avatarUrl) && !imageError;
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);
  
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };
  
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {shouldShowImage ? (
        <>
          {imageLoading && (
            <div className={`${colorClass} w-full h-full flex items-center justify-center`}>
              <span className="text-white font-semibold">
                {initials}
              </span>
            </div>
          )}
          <img 
            src={avatarUrl} 
            alt={name}
            className={`w-full h-full object-cover ${imageLoading ? 'hidden' : 'block'}`}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </>
      ) : (
        <div className={`${colorClass} w-full h-full flex items-center justify-center`}>
          <span className="text-white font-semibold">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}