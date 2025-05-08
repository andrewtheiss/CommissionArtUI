/**
 * Utility functions for handling and decoding NFT tokenURI data
 */

/**
 * Interface for decoded tokenURI data structure
 */
export interface DecodedTokenURI {
  name: string;
  description: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  [key: string]: any; // Allow for any additional fields
}

/**
 * Detect the MIME type of binary data based on magic numbers
 * @param data Binary data to analyze
 * @returns Detected MIME type or fallback type
 */
export function detectImageFormat(data: Uint8Array): string {
  // Check for common image format signatures (magic numbers)
  if (data.length >= 2) {
    // JPEG signature: starts with FF D8
    if (data[0] === 0xFF && data[1] === 0xD8) {
      return 'image/jpeg';
    }
    
    // PNG signature: starts with 89 50 4E 47
    if (data.length >= 4 && data[0] === 0x89 && data[1] === 0x50 && 
        data[2] === 0x4E && data[3] === 0x47) {
      return 'image/png';
    }
    
    // GIF signature: starts with GIF8
    if (data.length >= 4 && data[0] === 0x47 && data[1] === 0x49 && 
        data[2] === 0x46 && data[3] === 0x38) {
      return 'image/gif';
    }
    
    // WebP signature: starts with RIFF....WEBP
    if (data.length >= 12 && data[0] === 0x52 && data[1] === 0x49 && 
        data[2] === 0x46 && data[3] === 0x46 && 
        data[8] === 0x57 && data[9] === 0x45 && 
        data[10] === 0x42 && data[11] === 0x50) {
      return 'image/webp';
    }
    
    // AVIF signature check (simplified)
    if (data.length >= 12 && 
        data[4] === 0x66 && data[5] === 0x74 && 
        data[6] === 0x79 && data[7] === 0x70 && 
        data[8] === 0x61 && data[9] === 0x76 && 
        data[10] === 0x69 && data[11] === 0x66) {
      return 'image/avif';
    }
  }
  
  // Default to a generic type if format couldn't be detected
  return 'application/octet-stream';
}

/**
 * Create a data URL from binary data and MIME type
 * @param data The binary data
 * @param mimeType The MIME type of the data
 * @returns Data URL string
 */
export function createDataUrl(data: Uint8Array, mimeType: string): string {
  // Convert Uint8Array to base64 string
  let binary = '';
  const bytes = new Uint8Array(data);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Safely revoke a URL to prevent memory leaks
 * @param url URL to revoke (only revokes blob: or data: URLs)
 */
export function safeRevokeUrl(url: string): void {
  if (url && (url.startsWith('blob:') || url.startsWith('data:'))) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Failed to revoke URL:', e);
    }
  }
}

/**
 * Try to parse a tokenURI JSON data
 * @param data String data that might be a tokenURI JSON
 * @returns Parsed TokenURI or null if invalid
 */
export function tryParseTokenURI(data: string): DecodedTokenURI | null {
  try {
    // Check if it's a base64-encoded JSON string
    if (data.startsWith('data:application/json;base64,')) {
      const base64Data = data.replace('data:application/json;base64,', '');
      const jsonString = atob(base64Data);
      return JSON.parse(jsonString);
    }
    
    // Try to parse as direct JSON
    return JSON.parse(data);
  } catch (e) {
    console.warn('Failed to parse as tokenURI:', e);
    return null;
  }
}

/**
 * Process artwork data in various formats and return standardized output
 * @param data Raw artwork data (can be Uint8Array, hex string, or tokenURI string)
 * @returns Processed artwork info with image URL and metadata
 */
export function processArtworkData(data: Uint8Array | string): {
  imageUrl: string | null;
  decodedTokenURI: DecodedTokenURI | null;
  isTokenURIFormat: boolean;
  mimeType: string;
} {
  // Default values
  let imageUrl: string | null = null;
  let decodedTokenURI: DecodedTokenURI | null = null;
  let isTokenURIFormat = false;
  let mimeType = 'application/octet-stream';
  
  try {
    // Case 1: Binary data (Uint8Array)
    if (data instanceof Uint8Array) {
      mimeType = detectImageFormat(data);
      imageUrl = createDataUrl(data, mimeType);
      return { imageUrl, decodedTokenURI, isTokenURIFormat, mimeType };
    }
    
    // Case 2: String data - could be hex, data URL, or tokenURI JSON
    if (typeof data === 'string') {
      // Case 2a: Hex string starting with 0x - convert to binary
      if (data.startsWith('0x')) {
        const hexData = data.substring(2); // Remove 0x prefix
        const byteArray = new Uint8Array(hexData.length / 2);
        
        for (let i = 0; i < byteArray.length; i++) {
          const byteValue = parseInt(hexData.substring(i * 2, i * 2 + 2), 16);
          byteArray[i] = byteValue;
        }
        
        mimeType = detectImageFormat(byteArray);
        imageUrl = createDataUrl(byteArray, mimeType);
        return { imageUrl, decodedTokenURI, isTokenURIFormat, mimeType };
      }
      
      // Case 2b: Already a data URL
      if (data.startsWith('data:')) {
        // Extract MIME type from data URL
        const mimeMatch = data.match(/^data:([^;,]+)/);
        mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        
        // Check if it's a JSON data URL (tokenURI format)
        if (mimeType === 'application/json') {
          decodedTokenURI = tryParseTokenURI(data);
          
          if (decodedTokenURI && decodedTokenURI.image) {
            isTokenURIFormat = true;
            
            // Handle case where image is a data URL
            if (decodedTokenURI.image.startsWith('data:')) {
              imageUrl = decodedTokenURI.image;
            } 
            // Handle case where image is a URL
            else {
              imageUrl = decodedTokenURI.image;
            }
          } else {
            // If JSON parsing failed, treat as direct data URL
            imageUrl = data;
          }
        } else {
          // Direct image data URL
          imageUrl = data;
        }
        
        return { imageUrl, decodedTokenURI, isTokenURIFormat, mimeType };
      }
      
      // Case 2c: Try parsing as JSON string (tokenURI format)
      decodedTokenURI = tryParseTokenURI(data);
      
      if (decodedTokenURI && decodedTokenURI.image) {
        isTokenURIFormat = true;
        imageUrl = decodedTokenURI.image;
        
        // Try to determine MIME type from image field
        if (imageUrl.startsWith('data:')) {
          const mimeMatch = imageUrl.match(/^data:([^;,]+)/);
          mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        }
        
        return { imageUrl, decodedTokenURI, isTokenURIFormat, mimeType };
      }
      
      // Case 2d: Might be a direct URL
      if (data.startsWith('http')) {
        imageUrl = data;
        return { imageUrl, decodedTokenURI, isTokenURIFormat, mimeType };
      }
      
      // Case 2e: Unknown string format, try to convert to data URL
      console.warn('Unknown string format, trying to use as text');
      imageUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`;
      return { imageUrl, decodedTokenURI, isTokenURIFormat, mimeType };
    }
    
    // If we got here, we couldn't process the data
    console.error('Unsupported data format:', typeof data);
    return { imageUrl: null, decodedTokenURI: null, isTokenURIFormat: false, mimeType };
  } catch (error) {
    console.error('Error processing artwork data:', error);
    return { imageUrl: null, decodedTokenURI: null, isTokenURIFormat: false, mimeType };
  }
}

/**
 * Get MIME type and file extension from format string
 * @param format Format string (e.g., 'webp', 'png', 'jpeg')
 * @returns Object with mimeType and extension
 */
export function getMimeTypeFromFormat(format: string): { mimeType: string, extension: string } {
  format = format.toLowerCase().trim();
  
  switch (format) {
    case 'jpeg':
    case 'jpg':
      return { mimeType: 'image/jpeg', extension: 'jpg' };
    case 'png':
      return { mimeType: 'image/png', extension: 'png' };
    case 'gif':
      return { mimeType: 'image/gif', extension: 'gif' };
    case 'webp':
      return { mimeType: 'image/webp', extension: 'webp' };
    case 'avif':
      return { mimeType: 'image/avif', extension: 'avif' };
    case 'svg':
      return { mimeType: 'image/svg+xml', extension: 'svg' };
    default:
      return { mimeType: 'application/octet-stream', extension: format || 'bin' };
  }
} 