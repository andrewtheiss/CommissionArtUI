/**
 * Image compression utility for optimizing artwork images
 * Handles converting images to byte arrays under 44000 bytes
 */

export interface CompressionOptions {
  format: 'webp' | 'jpeg' | 'avif';
  quality: number;
  maxWidth: number | null;
  maxHeight: number | null;
  targetSizeKB?: number;
  autoOptimize?: boolean;
}

export interface CompressionResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeKB: number;
  format: 'webp' | 'jpeg' | 'avif';
  quality: number;
  byteArray?: Uint8Array;
}

/**
 * Compresses an image to a desired format and quality in the browser
 * Automatically finds the best format and compression settings to meet target size
 */
export const compressImage = async (
  input: File | Blob | string,
  options: CompressionOptions = { 
    format: 'webp', 
    quality: 0.8, 
    maxWidth: null, 
    maxHeight: null,
    targetSizeKB: 43,
    autoOptimize: true
  }
): Promise<string | CompressionResult> => {
  const {
    format = 'webp',
    quality = 0.8,
    maxWidth = null,
    maxHeight = null,
    targetSizeKB = 43,
    autoOptimize = true
  } = options;

  // If autoOptimize is true, use the advanced optimization logic
  if (autoOptimize) {
    return optimizeImageForSize(input, targetSizeKB);
  }
  
  // Regular compression logic for when autoOptimize is false
  // Validate format
  const validFormats = ['webp', 'jpeg', 'avif'];
  const outputFormat = format.toLowerCase() as 'webp' | 'jpeg' | 'avif';
  if (!validFormats.includes(outputFormat)) {
    throw new Error(`Invalid format: ${format}. Supported formats: ${validFormats.join(', ')}`);
  }

  // Convert input to data URL if it's a File or Blob
  let imageDataUrl: string;
  if (typeof input === 'string' && input.startsWith('data:')) {
    imageDataUrl = input;
  } else {
    imageDataUrl = await fileToDataUrl(input as File | Blob);
  }
  
  // Create an image element
  const img = document.createElement('img');
  
  // Create a promise to handle image loading
  const imageLoaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
  });
  
  // Set the image source
  img.src = imageDataUrl;
  
  // Wait for the image to load
  await imageLoaded;
  
  // Calculate dimensions while maintaining aspect ratio
  let width = img.width;
  let height = img.height;
  
  if (maxWidth && width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (maxHeight && height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  // Round dimensions to integers
  width = Math.round(width);
  height = Math.round(height);
  
  // Create a canvas with the desired dimensions
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Draw the image on the canvas
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, width, height);
  
  // Get the mime type
  let mimeType: string;
  switch(outputFormat) {
    case 'webp':
      mimeType = 'image/webp';
      break;
    case 'jpeg':
      mimeType = 'image/jpeg';
      break;
    case 'avif':
      mimeType = 'image/avif';
      break;
    default:
      mimeType = 'image/webp';
  }
  
  // Convert canvas to compressed data URL
  return canvas.toDataURL(mimeType, quality);
};

/**
 * Optimizes image by trying different formats and dimensions to achieve target size
 */
const optimizeImageForSize = async (
  input: File | Blob | string,
  targetSizeKB: number = 43
): Promise<CompressionResult> => {
  console.log(`Starting auto-optimization to target ${targetSizeKB}KB`);
  
  // Format options in order of preference (better quality comes first)
  const formatOptions: Array<'avif' | 'webp' | 'jpeg'> = ['avif', 'webp', 'jpeg'];
  
  // Load the image
  let imageDataUrl: string;
  if (typeof input === 'string' && input.startsWith('data:')) {
    imageDataUrl = input;
  } else {
    imageDataUrl = await fileToDataUrl(input as File | Blob);
  }
  
  // Get original image dimensions
  const img = document.createElement('img');
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
  
  const originalWidth = img.width;
  const originalHeight = img.height;
  
  console.log(`Original dimensions: ${originalWidth}x${originalHeight}`);
  
  // Start with original dimensions and try all formats and qualities
  let bestResult: CompressionResult | null = null;
  
  // Try different formats and quality levels
  for (const format of formatOptions) {
    // Try high quality first, then lower if needed
    for (let quality = 0.9; quality >= 0.4; quality -= 0.1) {
      // Create a canvas with original dimensions
      const canvas = document.createElement('canvas');
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, originalWidth, originalHeight);
      
      // Get mime type
      const mimeType = `image/${format}`;
      
      // Convert canvas to data URL with current format and quality
      try {
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const sizeKB = calculateDataUrlSizeKB(dataUrl);
        
        console.log(`Format: ${format}, Quality: ${quality.toFixed(1)}, Size: ${sizeKB.toFixed(2)}KB`);
        
        // Check if this result is better than our previous best
        if (sizeKB <= targetSizeKB && (!bestResult || sizeKB > bestResult.sizeKB)) {
          bestResult = {
            dataUrl,
            width: originalWidth,
            height: originalHeight,
            sizeKB,
            format,
            quality
          };
          console.log(`New best result: ${format} at ${quality.toFixed(1)} quality (${sizeKB.toFixed(2)}KB)`);
          
          // If we're very close to target with a good format, we can stop early
          if (sizeKB > targetSizeKB * 0.95 && (format === 'avif' || format === 'webp')) {
            console.log(`Optimal result found early, stopping search`);
            return addByteArray(bestResult);
          }
        }
      } catch (error) {
        console.warn(`Format ${format} not supported by browser, skipping`);
        // Skip this format as browser doesn't support it
        break;
      }
    }
  }
  
  // If we haven't found a good result yet, try reducing dimensions
  if (!bestResult) {
    console.log(`Unable to meet target size with original dimensions, trying reduced dimensions`);
    
    // Try different scale factors (90%, 80%, 70%, etc.)
    for (let scale = 0.9; scale >= 0.3; scale -= 0.1) {
      const width = Math.round(originalWidth * scale);
      const height = Math.round(originalHeight * scale);
      
      console.log(`Trying scaled dimensions: ${width}x${height} (${Math.round(scale * 100)}%)`);
      
      // Try different formats and quality levels at reduced dimensions
      for (const format of formatOptions) {
        // With smaller dimensions, we can use higher quality
        for (let quality = 0.9; quality >= 0.5; quality -= 0.1) {
          // Create a canvas with scaled dimensions
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Get mime type
          const mimeType = `image/${format}`;
          
          try {
            // Convert canvas to data URL with current format and quality
            const dataUrl = canvas.toDataURL(mimeType, quality);
            const sizeKB = calculateDataUrlSizeKB(dataUrl);
            
            console.log(`Scale: ${Math.round(scale * 100)}%, Format: ${format}, Quality: ${quality.toFixed(1)}, Size: ${sizeKB.toFixed(2)}KB`);
            
            // Check if this result is better than our previous best
            if (sizeKB <= targetSizeKB && (!bestResult || sizeKB > bestResult.sizeKB)) {
              bestResult = {
                dataUrl,
                width,
                height,
                sizeKB,
                format,
                quality
              };
              console.log(`New best result: ${width}x${height} ${format} at ${quality.toFixed(1)} quality (${sizeKB.toFixed(2)}KB)`);
              
              // If we're very close to target with a good format, we can stop early
              if (sizeKB > targetSizeKB * 0.95 && (format === 'avif' || format === 'webp')) {
                console.log(`Optimal result found, stopping search`);
                return addByteArray(bestResult);
              }
            }
          } catch (error) {
            console.warn(`Format ${format} not supported by browser, skipping`);
            // Skip this format as browser doesn't support it
            break;
          }
        }
      }
      
      // If we've found a result that's at least 90% of our target size, stop reducing dimensions
      if (bestResult && bestResult.sizeKB > targetSizeKB * 0.9) {
        console.log(`Found good result at ${Math.round(scale * 100)}% scale, stopping dimension reduction`);
        break;
      }
    }
  }
  
  // If we still haven't found a good result, use the smallest JPEG at lowest quality as fallback
  if (!bestResult) {
    console.log(`Unable to meet target size, using minimum size JPEG fallback`);
    
    const width = Math.round(originalWidth * 0.3);
    const height = Math.round(originalHeight * 0.3);
    
    // Create a canvas with minimum dimensions
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, width, height);
    
    // Use JPEG at lowest quality
    const dataUrl = canvas.toDataURL('image/jpeg', 0.3);
    const sizeKB = calculateDataUrlSizeKB(dataUrl);
    
    bestResult = {
      dataUrl,
      width,
      height,
      sizeKB,
      format: 'jpeg',
      quality: 0.3
    };
    
    console.log(`Fallback result: ${width}x${height} JPEG at minimum quality (${sizeKB.toFixed(2)}KB)`);
  }
  
  return addByteArray(bestResult);
};

/**
 * Add a byte array to the compression result
 */
const addByteArray = (result: CompressionResult): CompressionResult => {
  // Convert the data URL to a byte array
  const byteArray = dataUrlToByteArray(result.dataUrl);
  return {
    ...result,
    byteArray
  };
};

/**
 * Convert data URL to a Uint8Array byte array
 */
export const dataUrlToByteArray = (dataUrl: string): Uint8Array => {
  // Remove the data URL prefix to get the base64 data
  const base64 = dataUrl.split(',')[1];
  
  // Convert base64 to binary string
  const binaryString = atob(base64);
  
  // Create a Uint8Array from the binary string
  const byteArray = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }
  
  return byteArray;
};

/**
 * Calculate size in KB from data URL
 */
export const calculateDataUrlSizeKB = (dataUrl: string): number => {
  // Remove the data URL prefix (e.g., 'data:image/jpeg;base64,')
  const base64 = dataUrl.split(',')[1];
  // Calculate the size: base64 is 4/3 the size of binary
  const sizeInBytes = Math.ceil((base64.length * 3) / 4);
  return sizeInBytes / 1024;
};

/**
 * Helper function to convert a File or Blob to a data URL
 */
export const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Extract image dimensions from data URL
 */
export const getImageDimensions = async (dataUrl: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

/**
 * Extract format from data URL
 */
export const getImageFormat = (dataUrl: string): string => {
  const match = dataUrl.match(/data:image\/([a-zA-Z0-9]+);/);
  return match ? match[1].toUpperCase() : 'Unknown';
};

export const getImageInfo = async (file: File): Promise<{dataUrl: string; dimensions: {width: number, height: number}; format: string; sizeKB: number}> => {
  const dataUrl = await fileToDataUrl(file);
  const dimensions = await getImageDimensions(dataUrl);
  const format = file.type.split('/')[1].toUpperCase();
  const sizeKB = file.size / 1024;
  
  return {
    dataUrl,
    dimensions,
    format,
    sizeKB
  };
}; 