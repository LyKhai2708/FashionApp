
export const formatVNDPrice = (price: number | null | undefined): string => {
  if (!price || price === 0) return '0 ₫';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};


export const formatVNDNumber = (price: number | null | undefined): string => {
  if (!price || price === 0) return '0';
  
  return new Intl.NumberFormat('vi-VN').format(price);
};
