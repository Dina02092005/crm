
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

export interface S3UploadConfig {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    rootFolder?: string;
    subFolder?: string;
    maxFileSize?: number; // in bytes
    allowedMimeTypes?: string[];
    endpoint?: string; // For DigitalOcean Spaces
    forcePathStyle?: boolean; // For DigitalOcean Spaces
    makePublic?: boolean; // Control file visibility
}

export interface UploadResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
    fileName?: string;
    fileSize?: number;
}

export class S3UploadService {
    private s3: AWS.S3;
    private config: S3UploadConfig;

    constructor(config?: Partial<S3UploadConfig>) {
        this.config = {
            bucketName: process.env.BUCKET_NAME || '',
            region: process.env.NEW_REGION || 'blr1',
            accessKeyId: process.env.NEW_ACCESS_KEY || '',
            secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
            rootFolder: 'amaramba', // Default from user code
            subFolder: 'user_documents',
            maxFileSize: 10 * 1024 * 1024, // 10MB default
            allowedMimeTypes: [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'video/mp4',
                'video/quicktime',
                'video/x-msvideo'
            ],
            // DigitalOcean Spaces specific configuration
            endpoint: process.env.S3_ENDPOINT || 'https://blr1.digitaloceanspaces.com',
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // DigitalOcean Spaces typically creates virtual-hosted style unless specified
            makePublic: process.env.S3_MAKE_PUBLIC !== 'false', // Default to true
            ...config
        };

        // Configure S3 client
        const s3Config: AWS.S3.ClientConfiguration = {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
            region: this.config.region,
        };

        // Add custom endpoint for DigitalOcean Spaces
        if (this.config.endpoint) {
            s3Config.endpoint = new AWS.Endpoint(this.config.endpoint);
            s3Config.s3ForcePathStyle = false; // DigitalOcean Spaces requires this to be false for virtual-hosted style
            s3Config.signatureVersion = 'v4';
        }

        this.s3 = new AWS.S3(s3Config);
    }

    /**
     * Validate file before upload
     */
    private validateFile(file: File): string | null {
        // Check file size
        if (file.size > this.config.maxFileSize!) {
            return `File size exceeds maximum allowed size of ${this.config.maxFileSize! / (1024 * 1024)}MB`;
        }

        // Check MIME type
        if (this.config.allowedMimeTypes && !this.config.allowedMimeTypes.includes(file.type)) {
            return `File type ${file.type} is not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`;
        }

        return null;
    }

    /**
     * Generate unique filename
     */
    private generateFileName(originalName: string): string {
        const extension = originalName.split('.').pop();
        const uniqueId = uuidv4().slice(0, 6);
        const timestamp = Date.now();
        return `${uniqueId}-${timestamp}.${extension}`;
    }

    /**
     * Upload file to S3/DigitalOcean Spaces
     */
    async uploadFile(file: File): Promise<UploadResult> {
        try {
            // Validate file
            const validationError = this.validateFile(file);
            if (validationError) {
                return {
                    success: false,
                    error: validationError
                };
            }

            // Generate unique filename
            const fileName = this.generateFileName(file.name);
            const key = `${this.config.rootFolder}/${this.config.subFolder}/${fileName}`;

            // Convert File to Buffer for AWS sdk
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Prepare upload parameters
            const params: AWS.S3.PutObjectRequest = {
                Bucket: this.config.bucketName,
                Key: key,
                Body: buffer,
                ContentType: file.type,
                Metadata: {
                    originalName: file.name,
                    uploadedAt: new Date().toISOString(),
                    fileSize: file.size.toString()
                }
            };

            // Add ACL if files should be public
            if (this.config.makePublic) {
                params.ACL = 'public-read';
            }

            // Upload to S3/DigitalOcean Spaces
            const uploadResult = await this.s3.upload(params).promise();

            console.log('File uploaded successfully to Spaces:', uploadResult.Location);

            return {
                success: true,
                imageUrl: uploadResult.Location,
                fileName: fileName,
                fileSize: file.size
            };

        } catch (error: any) {
            console.error('Error uploading file to Spaces:', error);

            let errorMessage = 'Failed to upload file to storage';

            if (error.code === 'NoSuchBucket') {
                errorMessage = 'Storage bucket not found. Please check configuration.';
            } else if (error.code === 'AccessDenied') {
                errorMessage = 'Access denied to storage. Please check credentials.';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Delete file from S3/DigitalOcean Spaces
     */
    async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            // Extract key from URL
            const url = new URL(fileUrl);
            const key = url.pathname.substring(1); // Remove leading slash

            const params: AWS.S3.DeleteObjectRequest = {
                Bucket: this.config.bucketName,
                Key: key
            };

            await this.s3.deleteObject(params).promise();
            console.log('File deleted successfully from Spaces:', fileUrl);
            return true;

        } catch (error: any) {
            console.error('Error deleting file from Spaces:', error);
            return false;
        }
    }

    /**
     * Get presigned URL for direct client-side upload
     */
    async getPresignedUploadUrl(fileName: string, fileType: string): Promise<{ url: string, key: string, fileUrl: string }> {
        const uniqueFileName = this.generateFileName(fileName);
        const key = `${this.config.rootFolder}/${this.config.subFolder}/${uniqueFileName}`;

        const params = {
            Bucket: this.config.bucketName,
            Key: key,
            Expires: 300, // 5 minutes
            ContentType: fileType,
            ACL: this.config.makePublic ? 'public-read' : 'private'
        };

        const url = await this.s3.getSignedUrlPromise('putObject', params);

        // Construct the final public URL (DigitalOcean Spaces format)
        // Note: The signed URL is for uploading, but the file will be accessible at a standard URL
        const fileUrl = this.config.endpoint
            ? `${this.config.endpoint}/${this.config.bucketName}/${key}`
            : `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`;

        return { url, key, fileUrl };
    }
}

