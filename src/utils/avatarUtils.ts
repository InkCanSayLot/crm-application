// Avatar utility functions for generating initials and colors

export const getInitials = (name: string): string => {
  if (!name) return '?';
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export const getAvatarColor = (name: string): string => {
  // Generate consistent colors based on name
  const colors = [
    'bg-pink-500',
    'bg-blue-500', 
    'bg-green-500',
    'bg-purple-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];
  
  // Simple hash function to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a valid URL and not from problematic domains
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Block problematic domains that cause CORB errors
    const blockedDomains = [
      'images.unsplash.com',
      'unsplash.com',
      'source.unsplash.com'
    ];
    
    return !blockedDomains.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
};