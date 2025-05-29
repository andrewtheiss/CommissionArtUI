/**
 * ArWeave utility for uploading large original files
 * Handles communication with desktop ArWeave wallet extension
 * 
 * IMPLEMENTATION NOTE: Successfully tested and working as of [current date]
 * - Uses dual approach: ArConnect native createTransaction() with fallback to arweave-js + sign()
 * - Uploads ORIGINAL files (not compressed versions) to preserve quality
 * - Example successful upload: Transaction ID J2Yy4KbilH0n0yLiH2vYVK4rUeCnV9ERzOHOPRqrlfU
 * - URL format: https://arweave.net/{transactionId}
 * - Integrated into AddArt.tsx and ProfilePhotoUpload.tsx components
 */
import Arweave from 'arweave';

export interface ArWeaveUploadResult {
  success: boolean;
  transactionId?: string;
  url?: string;
  error?: string;
}

export interface ArWeaveStatus {
  extensionInstalled: boolean;
  walletConnected: boolean;
  error?: string;
}

// Initialize Arweave client
const arweave = new Arweave({
  host: 'ar-io.net',
  port: 443,
  protocol: 'https'
});

/**
 * Check if ArWeave extension is installed and available
 */
export const checkArWeaveExtension = async (): Promise<ArWeaveStatus> => {
  try {
    // Check if ArConnect is available
    if (typeof (window as any).arweaveWallet === 'undefined') {
      return {
        extensionInstalled: false,
        walletConnected: false,
        error: 'ArConnect extension not found'
      };
    }

    // Try to get permissions to check if wallet is connected
    try {
      const permissions = await (window as any).arweaveWallet.getPermissions();
      return {
        extensionInstalled: true,
        walletConnected: permissions.length > 0
      };
    } catch (permError) {
      return {
        extensionInstalled: true,
        walletConnected: false,
        error: 'Wallet not connected'
      };
    }
  } catch (error) {
    console.error('Error checking ArWeave extension:', error);
    return {
      extensionInstalled: false,
      walletConnected: false,
      error: 'Failed to check extension status'
    };
  }
};

/**
 * Request permissions from ArWeave wallet
 */
export const connectArWeaveWallet = async (): Promise<boolean> => {
  try {
    if (typeof (window as any).arweaveWallet === 'undefined') {
      throw new Error('ArConnect extension not found');
    }

    await (window as any).arweaveWallet.connect([
      'ACCESS_ADDRESS',
      'SIGN_TRANSACTION',
      'DISPATCH'
    ]);

    console.log('ArWeave wallet connected successfully');
    return true;
  } catch (error) {
    console.error('Error connecting ArWeave wallet:', error);
    return false;
  }
};

/**
 * Upload file to ArWeave
 */
export const uploadToArWeave = async (
  file: File,
  tags: { name: string; value: string }[] = []
): Promise<ArWeaveUploadResult> => {
  try {
    console.log(`Starting ArWeave upload for file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // Check extension availability
    const status = await checkArWeaveExtension();
    if (!status.extensionInstalled) {
      return {
        success: false,
        error: 'ArConnect extension not installed. Please install it from https://arconnect.io'
      };
    }

    if (!status.walletConnected) {
      console.log('Wallet not connected, attempting to connect...');
      const connected = await connectArWeaveWallet();
      if (!connected) {
        return {
          success: false,
          error: 'Failed to connect ArWeave wallet'
        };
      }
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Prepare transaction tags
    const transactionTags = [
      { name: 'Content-Type', value: file.type || 'application/octet-stream' },
      { name: 'File-Name', value: file.name || 'untitled' },
      { name: 'File-Size', value: file.size.toString() },
      { name: 'Upload-Client', value: 'CommissionArtUI' },
      { name: 'Upload-Timestamp', value: Date.now().toString() }
    ];

    // Add additional custom tags if provided
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        if (tag && tag.name && tag.value && typeof tag.name === 'string' && typeof tag.value === 'string') {
          transactionTags.push(tag);
        }
      }
    }

    console.log('Creating transaction via ArConnect...');

    try {
      // Try ArConnect's createTransaction method first
      const transaction = await (window as any).arweaveWallet.createTransaction({
        data: fileData,
        tags: transactionTags
      });

      console.log('Transaction created via ArConnect, dispatching...');

      // Dispatch the transaction
      const response = await (window as any).arweaveWallet.dispatch(transaction);

      if (!response || !response.id) {
        throw new Error('Invalid response from ArWeave dispatch');
      }

      const transactionId = response.id;
      const arweaveUrl = `https://arweave.net/${transactionId}`;

      console.log(`File uploaded to ArWeave successfully!`);
      console.log(`Transaction ID: ${transactionId}`);
      console.log(`URL: ${arweaveUrl}`);

      return {
        success: true,
        transactionId,
        url: arweaveUrl
      };

    } catch (arConnectError) {
      console.log('ArConnect createTransaction failed, trying arweave-js approach...');
      
      // Fallback to arweave-js + ArConnect sign approach (recommended method)
      const transaction = await arweave.createTransaction({
        data: fileData
      });

      // Add tags to the transaction one by one
      for (const tag of transactionTags) {
        try {
          transaction.addTag(tag.name, tag.value);
        } catch (tagError) {
          console.warn('Failed to add tag:', tag, tagError);
        }
      }

      console.log('Transaction created with arweave-js, signing with ArConnect...');

      // Use arweave.transactions.sign() which will automatically use ArConnect
      // This is the recommended approach from ArConnect docs
      await arweave.transactions.sign(transaction);

      console.log('Transaction signed, posting to network...');

      // Post the transaction directly to the network
      const postResponse = await arweave.transactions.post(transaction);
      
      if (postResponse.status !== 200) {
        throw new Error(`Failed to post transaction: ${postResponse.status} ${postResponse.statusText}`);
      }

      const transactionId = transaction.id;
      const arweaveUrl = `https://arweave.net/${transactionId}`;

      console.log(`File uploaded to ArWeave successfully via fallback method!`);
      console.log(`Transaction ID: ${transactionId}`);
      console.log(`URL: ${arweaveUrl}`);

      return {
        success: true,
        transactionId,
        url: arweaveUrl
      };
    }

  } catch (error) {
    console.error('ArWeave upload failed:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return {
      success: false,
      error: `Upload failed: ${errorMessage}`
    };
  }
};

/**
 * Get ArWeave file URL from transaction ID
 */
export const getArWeaveFileUrl = (transactionId: string): string => {
  return `https://arweave.net/${transactionId}`;
};

/**
 * Check if ArWeave extension installation is recommended
 * Returns true if original file is significantly larger than compressed
 */
export const shouldRecommendArWeave = (originalSizeKB: number, compressedSizeKB: number): boolean => {
  // Recommend ArWeave if original is at least 50% larger than compressed
  // and original is at least 100KB
  const compressionRatio = compressedSizeKB / originalSizeKB;
  return originalSizeKB >= 100 && compressionRatio < 0.7;
};

/**
 * Open ArConnect installation page
 */
export const openArConnectInstallPage = (): void => {
  window.open('https://arconnect.io/', '_blank', 'noopener,noreferrer');
}; 