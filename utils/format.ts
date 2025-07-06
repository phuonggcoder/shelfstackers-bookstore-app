export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Utility function to get book image URL with fallback for thumbnail/cover display
// For external screens (index, cart, favorite, search, order-review): cover_image > thumbnail > default
export const getBookImageUrl = (book: any): string => {
  if (!book) return 'https://i.imgur.com/gTzT0hA.jpeg';
  
  // Priority: cover_image > thumbnail > default image (for external screens)
  if (book.cover_image && Array.isArray(book.cover_image) && book.cover_image.length > 0) {
    for (let i = 0; i < book.cover_image.length; i++) {
      const img = book.cover_image[i];
      if (img && img.trim() !== '') {
        return img;
      }
    }
  }
  
  // Fallback to thumbnail if no cover_image
  if (book.thumbnail && book.thumbnail.trim() !== '') {
    return book.thumbnail;
  }
  
  return 'https://i.imgur.com/gTzT0hA.jpeg';
};

// Utility function to get book cover image URL for detail pages
// For detail pages ([id]): cover_image > thumbnail > default
export const getBookCoverImageUrl = (book: any): string => {
  if (!book) return 'https://i.imgur.com/gTzT0hA.jpeg';
  
  // For detail pages, prioritize cover_image over thumbnail
  if (book.cover_image && Array.isArray(book.cover_image) && book.cover_image.length > 0) {
    for (let i = 0; i < book.cover_image.length; i++) {
      const img = book.cover_image[i];
      if (img && img.trim() !== '') {
        return img;
      }
    }
  }
  
  // Fallback to thumbnail if no cover_image
  if (book.thumbnail && book.thumbnail.trim() !== '') {
    return book.thumbnail;
  }
  
  return 'https://i.imgur.com/gTzT0hA.jpeg';
};

// Utility function to validate and get valid image URL
export const getValidImageUrl = (url: string | undefined | null): string => {
  if (!url || url.trim() === '') {
    return 'https://i.imgur.com/gTzT0hA.jpeg'; // Default fallback image
  }
  return url;
};

// Helper function to get first valid image from array
export const getFirstValidImage = (images: string[]): string => {
  if (!images || !Array.isArray(images)) {
    return 'https://i.imgur.com/gTzT0hA.jpeg';
  }
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (img && img.trim() !== '') {
      return img;
    }
  }
  
  return 'https://i.imgur.com/gTzT0hA.jpeg';
}; 