import { PinataSDK } from 'pinata-web3';

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const TARGET_WIDTH = 400;
const TARGET_HEIGHT = 400;

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  ipfsHash: string;
  pinataUrl: string;
  gatewayUrl: string;
}

class PinataService {
  private readonly sdk: PinataSDK | null = null;

  constructor() {
    if (PINATA_JWT) {
      this.sdk = new PinataSDK({
        pinataJwt: PINATA_JWT,
        pinataGateway: PINATA_GATEWAY_URL,
      });
    }
  }

  validateImage(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`,
      };
    }

    return { valid: true };
  }

  async compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          let width = img.width;
          let height = img.height;

          if (width > height && width > TARGET_WIDTH) {
            height = (height * TARGET_WIDTH) / width;
            width = TARGET_WIDTH;
          } else if (height >= width && height > TARGET_HEIGHT) {
            width = (width * TARGET_HEIGHT) / height;
            height = TARGET_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            'image/jpeg',
            0.85
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async uploadImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    if (!this.sdk) {
      throw new Error('Pinata SDK not initialized. Please check your PINATA_JWT environment variable.');
    }

    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      onProgress?.({ loaded: 0, total: 100, percentage: 0 });

      const compressedFile = await this.compressImage(file);

      onProgress?.({ loaded: 30, total: 100, percentage: 30 });

      const upload = await this.sdk.upload.file(compressedFile);

      onProgress?.({ loaded: 100, total: 100, percentage: 100 });

      const ipfsHash = upload.IpfsHash;
      const pinataUrl = `https://pinata.cloud/ipfs/${ipfsHash}`;
      const gatewayUrl = this.getImageUrl(ipfsHash);

      return {
        ipfsHash,
        pinataUrl,
        gatewayUrl,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image upload failed: ${error.message}`);
      }
      throw new Error('Image upload failed with an unknown error');
    }
  }

  getImageUrl(ipfsHash: string, gateway?: string): string {
    if (!ipfsHash) {
      return '';
    }

    const cleanHash = ipfsHash.replace('ipfs://', '');
    const baseGateway = gateway || PINATA_GATEWAY_URL;

    return `${baseGateway}/ipfs/${cleanHash}`;
  }

  getFallbackUrls(ipfsHash: string): string[] {
    const cleanHash = ipfsHash.replace('ipfs://', '');

    return [
      `${PINATA_GATEWAY_URL}/ipfs/${cleanHash}`,
      `https://ipfs.io/ipfs/${cleanHash}`,
      `https://cloudflare-ipfs.com/ipfs/${cleanHash}`,
      `https://gateway.ipfs.io/ipfs/${cleanHash}`,
    ];
  }

  async testConnection(): Promise<boolean> {
    if (!this.sdk) {
      return false;
    }

    try {
      await this.sdk.testAuthentication();
      return true;
    } catch {
      return false;
    }
  }
}

export const pinataService = new PinataService();

export type { UploadProgress, UploadResult };
