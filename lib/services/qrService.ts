import {
  PaymentDraft,
  QrDecodingResult,
  QrErrorType,
  QrDecodingError,
} from '@/types/payment';
import { decodeQrCode } from '@/utils/qr';

/**
 * QR Service
 * 
 * Provides high-level QR code decoding and processing functionality.
 * Handles both camera scanning and image upload scenarios.
 */

export class QrService {
  /**
   * Maximum QR payload size in bytes
   */
  private static readonly MAX_PAYLOAD_SIZE = 2048; // 2KB

  /**
   * Decodes a QR code string into payment information
   * 
   * @param qrData - The raw QR code data string
   * @returns Promise resolving to QrDecodingResult
   */
  static async decodeQrCode(qrData: string): Promise<QrDecodingResult> {
    // Validate payload size
    if (qrData.length > QrService.MAX_PAYLOAD_SIZE) {
      throw new QrDecodingError(
        `QR payload too large: ${qrData.length} bytes (max ${QrService.MAX_PAYLOAD_SIZE})`,
        'PAYLOAD_TOO_LARGE'
      );
    }

    // Delegate to decoder
    return decodeQrCode(qrData);
  }

  /**
   * Decodes a QR code from an image file
   * 
   * @param file - The image file containing a QR code
   * @returns Promise resolving to QrDecodingResult
   */
  static async decodeQrFromImage(file: File): Promise<QrDecodingResult> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new QrDecodingError(
        `Unsupported file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`,
        'INVALID_QR_FORMAT'
      );
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new QrDecodingError(
        `File too large: ${file.size} bytes (max ${maxSize})`,
        'PAYLOAD_TOO_LARGE'
      );
    }

    // Import @zxing/browser dynamically to reduce bundle size
    const { BrowserMultiFormatReader } = await import('@zxing/browser');

    // Create image element from file
    const img = new Image();
    img.src = URL.createObjectURL(file);

    // Wait for image to load
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });

    // Decode QR from image
    const codeReader = new BrowserMultiFormatReader();
    const result = await codeReader.decodeFromImage(img);

    // Clean up
    URL.revokeObjectURL(img.src);

    // Decode the result
    return QrService.decodeQrCode(result.getText());
  }

  /**
   * Decodes a QR code from a camera stream
   * 
   * @param videoElement - The video element with camera stream
   * @param canvasElement - Canvas element for drawing frames
   * @param onResult - Callback for successful decode
   * @param onError - Callback for errors
   * @returns Function to stop scanning
   */
  static async scanFromCamera(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onResult: (result: QrDecodingResult) => void,
    onError: (error: Error) => void
  ): Promise<() => void> {
    const { BrowserMultiFormatReader } = await import('@zxing/browser');
    const codeReader = new BrowserMultiFormatReader();

    let animationFrameId: number | null = null;
    let stopped = false;

    const scanFrame = async () => {
      if (stopped) return;

      try {
        const ctx = canvasElement.getContext('2d');
        if (!ctx) {
          onError(new Error('Canvas context not available'));
          return;
        }

        // Draw current video frame to canvas
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        // Decode from canvas
        const result = await codeReader.decodeFromCanvas(canvasElement);
        
        // Process the result
        try {
          const decodingResult = await QrService.decodeQrCode(result.getText());
          if (decodingResult.success) {
            onResult(decodingResult);
            stop();
          }
        } catch (error) {
          // Non-critical error, continue scanning
          console.warn('QR decode error:', error);
        }
      } catch (err) {
        const error = err as Error;
        if (error.name !== 'NotFoundException') {
          onError(error);
        }
        // Continue scanning for NotFoundException
      }

      if (!stopped) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    const stop = () => {
      stopped = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      codeReader.reset();
    };

    // Start scanning
    animationFrameId = requestAnimationFrame(scanFrame);

    return stop;
  }

  /**
   * Validates a PaymentDraft for completeness and correctness
   * 
   * @param draft - The payment draft to validate
   * @returns Promise resolving to validation result
   */
  static async validateDraft(draft: PaymentDraft): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check QR format
    if (!['pay-by-square', 'epc-sepa', 'unknown'].includes(draft.qrFormat)) {
      errors.push('Invalid QR format');
    }

    // Check recipient name
    if (!draft.recipientName || draft.recipientName.trim() === '') {
      warnings.push('Recipient name is recommended');
    }

    // Check IBAN
    if (!draft.iban || draft.iban.trim() === '') {
      errors.push('IBAN is required');
    }

    // Check BIC (optional but recommended for international)
    if (!draft.bic) {
      warnings.push('BIC is recommended for international payments');
    }

    // Check amount
    if (draft.amount === null) {
      warnings.push('Amount was not specified in QR code');
    } else if (draft.amount <= 0) {
      errors.push('Amount must be positive');
    }

    // Check currency
    if (!draft.currency) {
      warnings.push('Currency was not specified, defaulting to EUR');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Gets the preferred payment option from multiple options
   * 
   * @param options - Array of payment drafts
   * @returns The preferred option (first by default)
   */
  static getPreferredOption(options: PaymentDraft[]): PaymentDraft {
    if (options.length === 0) {
      throw new Error('No payment options available');
    }

    // For now, just return the first option
    // In the future, this could use user preferences or other logic
    return options[0];
  }
}

export default QrService;
