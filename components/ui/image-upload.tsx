"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { Point, Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Trash2, Upload, Pencil, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string | null) => void;
    onRemove: () => void;
    disabled?: boolean;
    className?: string;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    disabled,
    className
}: ImageUploadProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImageSrc(reader.result?.toString() || "");
                setIsOpen(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            return null;
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, "image/jpeg");
        });
    };

    const handleUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            setIsUploading(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            if (!croppedImageBlob) {
                toast.error("Failed to crop image");
                return;
            }

            // Get presigned URL
            const fileName = `profile-${Date.now()}.jpg`;
            const fileType = "image/jpeg";

            const { data } = await axios.post("/api/upload/presigned", {
                fileName,
                fileType,
            });

            const { url, fileUrl } = data;

            // Upload to S3
            console.log("Uploading to URL:", url);
            await axios.put(url, croppedImageBlob, {
                headers: {
                    "Content-Type": fileType,
                    "x-amz-acl": "public-read",
                },
            });

            onChange(fileUrl);
            setIsOpen(false);
            setImageSrc(null);
            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className={`flex flex-col items-center gap-4 ${className}`}>
            <div className="relative h-32 w-32">
                {value ? (
                    <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-border">
                        <img
                            src={value}
                            alt="Profile"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-white hover:text-white hover:bg-white/20"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Pencil className="h-5 w-5" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-white hover:text-red-400 hover:bg-white/20"
                                onClick={onRemove}
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="h-32 w-32 rounded-full border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <span className="text-xs text-muted-foreground font-medium">Upload Photo</span>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={onFileChange}
                disabled={disabled || isUploading}
            />

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Crop Image</DialogTitle>
                    </DialogHeader>
                    <div className="relative h-[300px] w-full bg-black/5 rounded-lg overflow-hidden mt-4">
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        )}
                    </div>
                    <div className="py-4 space-y-2">
                        <div className="text-xs text-muted-foreground font-medium">Zoom</div>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value: number[]) => setZoom(value[0])}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsOpen(false);
                                setImageSrc(null);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = "";
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? "Uploading..." : "Save Photo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
