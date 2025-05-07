import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { compressImage, fileToDataUrl, getImageInfo, dataUrlToByteArray, CompressionResult } from '../utils/imageCompression';
import { useArtPieceTemplateContract, createArtPiece } from '../contracts/ArtPieceContract';
import { useBlockchain } from '../contexts/BlockchainContext';
import { ethers } from 'ethers';

interface ArtFormData {
  title: string;
  description: string;
  imageData?: Uint8Array;
  format?: string;
}

const AddArt: React.FC = () => {
  // Blockchain integration
  const { isConnected, walletAddress, network } = useBlockchain();
  const artPieceTemplateContract = useArtPieceTemplateContract();

  // Form state
  const [formData, setFormData] = useState<ArtFormData>({
    title: '',
    description: ''
  });

  // Image state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [originalInfo, setOriginalInfo] = useState<{
    size: number;
    dimensions: { width: number; height: number };
    format: string;
  } | null>(null);
  const [compressedImage, setCompressedImage] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [aiGenerated, setAiGenerated] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection from input or drop
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    setError(null);
    setSelectedFile(file);
    setCompressedImage(null);
    
    try {
      // Get and display original image info
      const info = await getImageInfo(file);
      setOriginalPreview(info.dataUrl);
      setOriginalInfo({
        size: info.sizeKB,
        dimensions: info.dimensions,
        format: info.format
      });
      
      // Auto-compress the image
      await compressImageFile(file);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image');
    }
  };
  
  // Automatically compress the image when a file is selected
  const compressImageFile = async (file: File) => {
    if (!file) return;
    
    setIsCompressing(true);
    setError(null);
    
    try {
      // Use auto-optimize with a target of 43KB
      const result = await compressImage(file, {
        format: 'webp',
        quality: 0.8,
        maxWidth: null,
        maxHeight: null,
        targetSizeKB: 44, 
        autoOptimize: true
      }) as CompressionResult;
      
      setCompressedImage(result);
      
      // Update form data with the compressed image
      setFormData(prev => ({
        ...prev,
        imageData: result.byteArray,
        format: result.format
      }));
      
    } catch (err) {
      console.error('Compression failed:', err);
      setError(`Compression failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCompressing(false);
    }
  };
  
  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle drag and drop events
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
    setIsDragging(true);
  };
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);
  
  // Handle click on dropzone
  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.imageData) {
      setError('Image is required');
      return;
    }

    if (!isConnected || !walletAddress) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!artPieceTemplateContract) {
      setError('Contract template not available');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      console.log('Saving artwork to blockchain:', {
        title: formData.title,
        description: formData.description,
        imageFormat: formData.format || 'webp',
        imageDataSize: formData.imageData.length,
        aiGenerated
      });
      
      try {
        // Get a provider with signer to make transactions
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Use the createArtPiece function from our contract module
        // This will clone the template and initialize it with the actual image data
        const { tx, contractAddress: newContractAddress } = await createArtPiece(
          formData.title,
          formData.description || '',
          formData.imageData,
          formData.format || 'webp',
          signer,
          aiGenerated
        );
        
        console.log('Transaction sent:', tx.hash);
        setTxHash(tx.hash);
        setContractAddress(newContractAddress);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        
        setSaveSuccess(true);
        
        // Reset form after successful save
        setTimeout(() => {
          setFormData({
            title: '',
            description: ''
          });
          setSelectedFile(null);
          setOriginalPreview(null);
          setCompressedImage(null);
          setOriginalInfo(null);
          setSaveSuccess(false);
          setTxHash(null);
          setContractAddress(null);
          setAiGenerated(false);
        }, 5000);
      } catch (contractError) {
        console.error('Contract interaction error:', contractError);
        setError(`Contract error: ${contractError instanceof Error ? contractError.message : 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error saving artwork:', err);
      setError('Failed to save artwork');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Determine if form is valid
  const isFormValid = formData.title.trim() !== '' && !!formData.imageData && isConnected;
  
  // Add AI generated checkbox
  const handleAiGeneratedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiGenerated(e.target.checked);
  };

  return (
    <div className="add-art-page">
      <div className="add-art-container">
        <div className="add-art-header">
          <h2>Add Artwork</h2>
          {!isConnected && (
            <div className="wallet-warning">
              Please connect your wallet to save artwork to the blockchain
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="add-art-form">
          <div className="art-image-section">
            <div
              className={`dropzone ${isDragging ? 'active' : ''}`}
              onClick={handleDropzoneClick}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {originalPreview ? (
                <img src={compressedImage?.dataUrl || originalPreview} alt="Preview" className="preview-image" />
              ) : (
                <>
                  <div className="icon">📷</div>
                  <p>Drop your image here or click to browse</p>
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
                <span>Optimizing image...</span>
              </div>
            )}
            
            {compressedImage && !isCompressing && (
              <div className="compression-info">
                <p>
                  <span className="label">Original:</span>
                  <span className="value">{originalInfo?.size.toFixed(2)} KB</span>
                </p>
                <p>
                  <span className="label">Compressed:</span>
                  <span className="value">{compressedImage.sizeKB.toFixed(2)} KB</span>
                </p>
                <p>
                  <span className="label">Format:</span>
                  <span className="value">{compressedImage.format.toUpperCase()}</span>
                </p>
                <p>
                  <span className="label">Dimensions:</span>
                  <span className="value">{compressedImage.width} × {compressedImage.height}</span>
                </p>
                <p>
                  <span className="label">Reduction:</span>
                  <span className="value">
                    {originalInfo ? (100 - (compressedImage.sizeKB / originalInfo.size * 100)).toFixed(1) : 0}%
                  </span>
                </p>
              </div>
            )}
            
            {error && (
              <div className="compression-status error">
                <span>{error}</span>
              </div>
            )}
            
            {saveSuccess && (
              <div className="compression-status success">
                <span>Artwork saved successfully to the blockchain!</span>
                {txHash && (
                  <a 
                    href={`https://sepolia-explorer.arbitrum.io/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View transaction
                  </a>
                )}
                {contractAddress && (
                  <a 
                    href={`https://sepolia-explorer.arbitrum.io/address/${contractAddress}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View contract
                  </a>
                )}
              </div>
            )}
          </div>
          
          <div className="art-info-section">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter artwork title"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your artwork"
                rows={5}
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={aiGenerated}
                  onChange={handleAiGeneratedChange}
                />
                AI Generated Artwork
              </label>
            </div>
            
            <div className="form-actions">
              <Link to="/" className="back-link">Cancel</Link>
              <button
                type="submit"
                className="submit-button"
                disabled={!isFormValid || isCompressing || isSaving}
              >
                {isSaving ? 'Saving to Blockchain...' : 'Save Artwork'}
                {isSaving && <span className="spinner"></span>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddArt; 