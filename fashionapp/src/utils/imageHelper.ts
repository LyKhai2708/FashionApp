
 //helper functions for handling image URLs from backend


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


export const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) {
        return '/placeholder-image.jpg';
    }

    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }


    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

    return `${API_URL}/${cleanPath}`;
};


export const getProductThumbnail = (product: any): string => {
    return getImageUrl(product?.thumbnail);
};


export const getColorImage = (color: any): string => {
    const firstImage = color?.images?.[0]?.image_url;
    return getImageUrl(firstImage);
};

export const getColorImages = (color: any): string[] => {
    if (!color?.images || !Array.isArray(color.images)) {
        return [];
    }
    return color.images.map((img: any) => getImageUrl(img.image_url));
};
