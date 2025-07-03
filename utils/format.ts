export const formatVND = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Utility function to validate and get valid image URL
export const getValidImageUrl = (url: string | undefined | null): string => {
  if (!url || url.trim() === '') {
    return 'https://i.imgur.com/gTzT0hA.jpeg'; // Default fallback image
  }
  return url;
};

// Utility function to get first valid image from array
export const getFirstValidImage = (images: string[] | undefined | null): string => {
  if (!images || images.length === 0) {
    return 'https://i.imgur.com/gTzT0hA.jpeg';
  }
  
  const validImage = images.find(img => img && img.trim() !== '');
  return validImage || 'https://i.imgur.com/gTzT0hA.jpeg';
}; 