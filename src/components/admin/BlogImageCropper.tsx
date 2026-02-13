import { useState, useRef, useCallback } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Loader2, X, Crop } from "lucide-react";

interface BlogImageCropperProps {
  currentImageUrl: string;
  onImageUploaded: (url: string) => void;
  bucket?: string;
  aspectRatio?: number;
  label?: string;
}

const BlogImageCropper = ({
  currentImageUrl,
  onImageUploaded,
  bucket = "hero-images",
  aspectRatio = 16 / 9,
  label = "Featured Image",
}: BlogImageCropperProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cropperRef = useRef<ReactCropperElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile(reader.result as string);
      setIsCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [toast]);

  const handleCropAndUpload = useCallback(async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    setIsUploading(true);
    try {
      const canvas = cropper.getCroppedCanvas({
        width: 1200,
        height: Math.round(1200 / aspectRatio),
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))),
          "image/webp",
          0.85
        );
      });

      const fileName = `blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, { contentType: "image/webp", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onImageUploaded(urlData.publicUrl);
      setIsCropDialogOpen(false);
      setSelectedFile(null);
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }, [aspectRatio, bucket, onImageUploaded, toast]);

  const handleRemoveImage = () => {
    onImageUploaded("");
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {currentImageUrl ? (
        <div className="relative group rounded-lg overflow-hidden border border-border">
          <img
            src={currentImageUrl}
            alt="Featured"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Crop className="w-4 h-4 mr-1" /> Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemoveImage}
            >
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click to upload an image
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, WEBP up to 5MB • Will be cropped to {aspectRatio === 16 / 9 ? "16:9" : "custom"} ratio
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Crop Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={(o) => { if (!isUploading) setIsCropDialogOpen(o); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5" /> Crop Image
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-hidden">
            {selectedFile && (
              <Cropper
                ref={cropperRef}
                src={selectedFile}
                style={{ height: "100%", maxHeight: "55vh", width: "100%" }}
                aspectRatio={aspectRatio}
                guides
                viewMode={1}
                minCropBoxHeight={100}
                minCropBoxWidth={100}
                responsive
                autoCropArea={1}
                checkOrientation={false}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsCropDialogOpen(false); setSelectedFile(null); }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCropAndUpload} disabled={isUploading}>
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Crop & Upload</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogImageCropper;
