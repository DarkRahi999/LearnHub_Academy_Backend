import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || 'ddv7va3lr',
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY') || '315647786727532',
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET') || 'agjwiM1QTw27e55CEza4iY69OdI',
    });
  }

  /**
   * Upload an image file to Cloudinary
   * @param file - The image file to upload
   * @returns Promise with upload result
   */
  async uploadImage(file: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'learnhub-academy',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.url,
              public_id: result.public_id,
              secure_url: result.secure_url,
            });
          } else {
            reject(new Error('Upload failed'));
          }
        }
      );
      
      uploadStream.end(file.buffer);
    });
  }

  /**
   * Upload an image from a URL to Cloudinary
   * @param url - The URL of the image to upload
   * @returns Promise with upload result
   */
  async uploadImageFromUrl(url: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: 'learnhub-academy',
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      });
      
      return {
        url: result.url,
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
    } catch (error) {
      throw new Error(`Failed to upload image from URL: ${error}`);
    }
  }

  /**
   * Delete an image from Cloudinary
   * @param publicId - The public ID of the image to delete
   * @returns Promise with deletion result
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
  }
}