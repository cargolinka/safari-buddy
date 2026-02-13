import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, X, Crop, ZoomIn, ZoomOut } from "lucide-react";
import { Slider } from "@/components/ui/slider";

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const PREVIEW_W = 600;
  const PREVIEW_H = Math.round(PREVIEW_W / aspectRatio);

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
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [toast]);

  // Load image and draw preview
  useEffect(() => {
    if (!selectedFile || !isCropDialogOpen) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageSize({ w: img.width, h: img.height });
      drawPreview(img, zoom, pan);
    };
    img.src = selectedFile;
  }, [selectedFile, isCropDialogOpen]);

  useEffect(() => {
    if (imgRef.current && isCropDialogOpen) {
      drawPreview(imgRef.current, zoom, pan);
    }
  }, [zoom, pan, isCropDialogOpen]);

  const drawPreview = (img: HTMLImageElement, z: number, p: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

    // Scale image to fill the crop area, then apply zoom
    const scaleToFill = Math.max(PREVIEW_W / img.width, PREVIEW_H / img.height);
    const scale = scaleToFill * z;

    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = (PREVIEW_W - drawW) / 2 + p.x;
    const drawY = (PREVIEW_H - drawH) / 2 + p.y;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCropAndUpload = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;

    setIsUploading(true);
    try {
      // Create output canvas at target resolution
      const outW = 1200;
      const outH = Math.round(outW / aspectRatio);
      const outCanvas = document.createElement("canvas");
      outCanvas.width = outW;
      outCanvas.height = outH;
      const ctx = outCanvas.getContext("2d")!;

      const scaleToFill = Math.max(PREVIEW_W / img.width, PREVIEW_H / img.height);
      const scale = scaleToFill * zoom;
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = (PREVIEW_W - drawW) / 2 + pan.x;
      const drawY = (PREVIEW_H - drawH) / 2 + pan.y;

      // Map from preview coords to output coords
      const outScale = outW / PREVIEW_W;
      ctx.drawImage(img, drawX * outScale, drawY * outScale, drawW * outScale, drawH * outScale);

      const blob = await new Promise<Blob>((resolve, reject) => {
        outCanvas.toBlob(
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
  }, [zoom, pan, aspectRatio, bucket, onImageUploaded, toast, PREVIEW_W, PREVIEW_H]);

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {currentImageUrl ? (
        <div className="relative group rounded-lg overflow-hidden border border-border">
          <img src={currentImageUrl} alt="Featured" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Crop className="w-4 h-4 mr-1" /> Replace
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => onImageUploaded("")}>
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
          <p className="text-sm text-muted-foreground">Click to upload an image</p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, WEBP up to 5MB • Cropped to {aspectRatio === 16 / 9 ? "16:9" : "custom"} ratio
          </p>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      <Dialog open={isCropDialogOpen} onOpenChange={(o) => { if (!isUploading) setIsCropDialogOpen(o); }}>
        <DialogContent className="max-w-[680px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5" /> Crop Image
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <canvas
              ref={canvasRef}
              width={PREVIEW_W}
              height={PREVIEW_H}
              className="w-full rounded-lg cursor-move border border-border"
              style={{ aspectRatio: `${PREVIEW_W}/${PREVIEW_H}` }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={1}
                max={3}
                step={0.05}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setIsCropDialogOpen(false); setSelectedFile(null); }} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCropAndUpload} disabled={isUploading}>
              {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2" /> Crop & Upload</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogImageCropper;
