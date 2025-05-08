import React, { useState, useRef } from 'react';
import { compressImage } from '../utils/imageCompression';
import { ethers } from 'ethers';
import { useBlockchain } from '../contexts/BlockchainContext';
import { createMinimalProxy } from '../contracts/ArtPieceContract';
import { getContractAddress } from '../utils/contracts';
import { loadABI } from '../utils/abi';
import './ProfilePhotoUpload.css';

interface ProfilePhotoUploadProps {
  profileAddress: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ 
  profileAddress, 
  isOpen, 
  onClose,
  onSuccess 
}) => {
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<{ dataUrl: string; data: Uint8Array; format: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'creating_proxy' | 'initializing' | 'complete'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [proxyAddress, setProxyAddress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { network } = useBlockchain();

  if (!isOpen) return null;

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleDropzoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Read file as data URL for preview
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    try {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }
      
      // Create preview of original image
      const originalDataUrl = await readFileAsDataURL(file);
      setOriginalPreview(originalDataUrl);
      
      // Compress the image
      setIsCompressing(true);
      setError(null);
      
      const compressionResult = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        format: 'webp',
        autoOptimize: true
      });
      
      // Make sure we're working with a CompressionResult object
      if (typeof compressionResult === 'string') {
        throw new Error('Unexpected compression result format');
      }
      
      if (!compressionResult.byteArray) {
        throw new Error('Compression result does not contain byte array');
      }
      
      setCompressedImage({
        dataUrl: compressionResult.dataUrl,
        data: compressionResult.byteArray,
        format: compressionResult.format
      });
      
      console.log(`Image compressed: ${compressionResult.width}x${compressionResult.height}, ${compressionResult.sizeKB.toFixed(2)}KB, format: ${compressionResult.format}`);
      
      setIsCompressing(false);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image. Please try another file.');
      setIsCompressing(false);
    }
  };

  const handleUpload = async () => {
    if (!compressedImage) {
      setError('Please select an image to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setTxHash(null);
    setCurrentStep('creating_proxy');

    try {
      // Get signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      // Get the template address for the image proxy
      const templateAddress = getContractAddress('artPiece');
      if (!templateAddress) {
        throw new Error('Image proxy template address not found');
      }
      
      console.log('Creating minimal proxy for image storage...');
      
      // Step 1: Create a minimal proxy clone of the template
      const { tx: deployTx, proxyAddress } = await createMinimalProxy(templateAddress, signer);
      
      setTxHash(deployTx.hash);
      console.log(`Deployment transaction sent: ${deployTx.hash}`);
      
      // Wait for the deployment transaction to be mined
      await deployTx.wait();
      console.log(`Minimal proxy deployed at ${proxyAddress}`);
      
      // Store the proxy address
      setProxyAddress(proxyAddress);
      
      // Update step
      setCurrentStep('initializing');
      
      // Step 2: Initialize the proxy with the image data
      // Get the ABI for the image proxy
      const imageProxyABI = loadABI('ArtPiece');
      if (!imageProxyABI) {
        throw new Error('Image proxy ABI not found');
      }
      
      // Create contract instance
      const proxyInstance = new ethers.Contract(proxyAddress, imageProxyABI, signer);
      
      // Use the raw byte array directly from the compression result
      console.log('Initializing proxy with image data...');
      
      // Estimate gas for initialization
      let estimatedGas;
      try {
        estimatedGas = await proxyInstance.initialize.estimateGas(
          compressedImage.data,
          compressedImage.format,
          "Profile Image", // Title
          "User profile image", // Description
          signerAddress, // Owner
          signerAddress, // Artist
          ethers.ZeroAddress, // Commission hub (null address)
          false // AI generated
        );
        
        // Add 20% buffer
        estimatedGas = Math.floor(Number(estimatedGas) * 1.2);
      } catch (error) {
        console.warn('Gas estimation failed, using safe default:', error);
        estimatedGas = 1000000; // Safe default
      }
      
      // Initialize the proxy
      const initTx = await proxyInstance.initialize(
        compressedImage.data,
        compressedImage.format,
        "Profile Image", // Title
        "User profile image", // Description
        signerAddress, // Owner
        signerAddress, // Artist
        ethers.ZeroAddress, // Commission hub (null address)
        false, // AI generated
        { gasLimit: estimatedGas }
      );
      
      setTxHash(initTx.hash);
      console.log(`Initialization transaction sent: ${initTx.hash}`);
      
      // Wait for initialization transaction to be mined
      await initTx.wait();
      console.log('Proxy initialization complete');
      
      // Step 3: Update the profile's image pointer
      const profileABI = loadABI('Profile');
      if (!profileABI) {
        throw new Error('Profile ABI not found');
      }
      
      // Create profile contract instance
      const profileContract = new ethers.Contract(profileAddress, profileABI, signer);
      
      // Set the profile image to point to the proxy
      console.log('Setting profile image pointer...');
      const setImageTx = await profileContract.setProfileImage(proxyAddress, { gasLimit: 300000 });
      
      setTxHash(setImageTx.hash);
      console.log(`Set image transaction sent: ${setImageTx.hash}`);
      
      // Wait for set image transaction to be mined
      await setImageTx.wait();
      
      // Set the profile image format
      console.log('Setting profile image format...');
      const setFormatTx = await profileContract.setProfileImageFormat(compressedImage.format, { gasLimit: 200000 });
      await setFormatTx.wait();
      
      console.log('Profile image updated successfully');
      
      // Update step
      setCurrentStep('complete');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Show success message but don't close automatically
      setIsUploading(false);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setError(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUploading(false);
      setCurrentStep('idle');
    }
  };

  const getStepMessage = () => {
    switch (currentStep) {
      case 'creating_proxy':
        return 'Creating storage for your image...';
      case 'initializing':
        return 'Uploading image data...';
      case 'complete':
        return 'Profile photo updated successfully!';
      default:
        return '';
    }
  };

  return (
    <div className="profile-photo-upload-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        
        <h2>Upload Profile Photo</h2>
        
        <div className="upload-container">
          <div
            className={`dropzone ${isDragging ? 'active' : ''}`}
            onClick={handleDropzoneClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {originalPreview ? (
              <img 
                src={compressedImage?.dataUrl || originalPreview} 
                alt="Preview" 
                className="preview-image" 
              />
            ) : (
              <>
                <div className="icon">📷</div>
                <p>Drop your profile photo here or click to browse</p>
                <p>Supports JPG, PNG, WebP (max 10MB)</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>
          
          {isCompressing && (
            <div className="compression-status">
              <div className="spinner"></div>
              <span>Compressing image...</span>
            </div>
          )}
          
          {isUploading && (
            <div className="upload-status">
              <div className="spinner"></div>
              <span>{getStepMessage()}</span>
            </div>
          )}
          
          {currentStep === 'complete' && !isUploading && (
            <div className="success-message">
              <p>Profile photo updated successfully!</p>
              {txHash && (
                <div className="transaction-info">
                  <p>Transaction: <a 
                    href={`${network.blockExplorerUrl}/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                  </a></p>
                  {proxyAddress && (
                    <p>Image Contract: <a 
                      href={`${network.blockExplorerUrl}/address/${proxyAddress}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {proxyAddress.substring(0, 10)}...{proxyAddress.substring(proxyAddress.length - 8)}
                    </a></p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="button-group">
            <button 
              className="cancel-button" 
              onClick={onClose}
              disabled={isUploading}
            >
              {currentStep === 'complete' ? 'Close' : 'Cancel'}
            </button>
            {currentStep === 'idle' && (
              <button 
                className="action-button" 
                onClick={handleUpload}
                disabled={!compressedImage || isUploading || isCompressing}
              >
                Upload Photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoUpload; 