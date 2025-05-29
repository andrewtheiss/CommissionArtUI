/**
 * ArWeave utility for uploading large original files
 * Handles communication with desktop ArWeave wallet extension
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
    const data = new Uint8Array(arrayBuffer);

    // Prepare transaction tags
    const transactionTags = [
      { name: 'Content-Type', value: file.type },
      { name: 'File-Name', value: file.name },
      { name: 'File-Size', value: file.size.toString() },
      { name: 'Upload-Client', value: 'CommissionArtUI' },
      { name: 'Upload-Timestamp', value: Date.now().toString() },
      ...tags
    ];

    console.log('Creating ArWeave transaction with tags:', transactionTags);

    // Create transaction using arweave-js
    const transaction = await arweave.createTransaction({
      data: data
    });

    // Add tags to the transaction
    transactionTags.forEach(tag => {
      transaction.addTag(tag.name, tag.value);
    });

    console.log('Transaction created, dispatching via ArConnect...');

    // Use ArConnect to dispatch the transaction (sign and submit in one step)
    const response = await (window as any).arweaveWallet.dispatch(transaction);

    console.log('ArWeave transaction dispatched:', response);

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