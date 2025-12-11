import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { DocumentUploadField } from "@/components/driver/DocumentUploadField";

const vehicleSchema = z.object({
  model: z.string().min(1, "Model is required"),
  registration_number: z.string().min(1, "Registration number is required").toUpperCase(),
  type: z.string().min(1, "Vehicle type is required"),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  capacity: z.number().min(1).max(100),
  daily_rate: z.number().min(0),
  min_advance_booking_days: z.number().min(0).max(30),
  insurance_expiry: z.string(),
  inspection_expiry: z.string(),
  road_license_expiry: z.string(),
  tsv_psv_licence_expiry: z.string().optional(),
  features: z.array(z.string()),
  status: z.enum(["available", "booked", "maintenance", "unavailable"]),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

const availableFeatures = ["AC", "GPS", "Roof Rack", "4WD", "Backup Camera", "Bluetooth", "USB Charging"];

const MAX_IMAGES = 6;

export default function VehicleForm({ initialData, onSubmit, loading }: VehicleFormProps) {
  const { toast } = useToast();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(initialData?.features || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialData?.image_urls || initialData?.image_url ? [initialData.image_url] : []);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Document upload states
  const [insuranceDoc, setInsuranceDoc] = useState<File | null>(null);
  const [inspectionDoc, setInspectionDoc] = useState<File | null>(null);
  const [roadLicenseDoc, setRoadLicenseDoc] = useState<File | null>(null);
  const [psvLicenseDoc, setPsvLicenseDoc] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      model: initialData?.model || "",
      registration_number: initialData?.registration_number || "",
      type: initialData?.type || "",
      year: initialData?.year || new Date().getFullYear(),
      capacity: initialData?.capacity || 5,
      daily_rate: initialData?.daily_rate || 0,
      min_advance_booking_days: initialData?.min_advance_booking_days || 0,
      insurance_expiry: initialData?.insurance_expiry || "",
      inspection_expiry: initialData?.inspection_expiry || "",
      road_license_expiry: initialData?.road_license_expiry || "",
      tsv_psv_licence_expiry: initialData?.tsv_psv_licence_expiry || "",
      features: initialData?.features || [],
      status: initialData?.status || "available",
    },
  });

  const vehicleType = watch("type");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicle_categories')
          .select('id, name, slug')
          .order('name');
        
        if (error) throw error;
        setCategories(data || []);
      } catch (error: any) {
        toast({
          title: "Error loading categories",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [toast]);

  const handleFeatureToggle = (feature: string) => {
    const updated = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    setSelectedFeatures(updated);
    setValue("features", updated);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (imagePreviews.length + files.length > MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: `You can only upload up to ${MAX_IMAGES} images`,
        variant: "destructive",
      });
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imagePreviews.length + files.length > MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: `You can only upload up to ${MAX_IMAGES} images`,
        variant: "destructive",
      });
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPreviews = [...imagePreviews];
    const draggedItem = newPreviews[draggedIndex];
    newPreviews.splice(draggedIndex, 1);
    newPreviews.splice(index, 0, draggedItem);

    const newFiles = [...imageFiles];
    if (draggedIndex < newFiles.length && index < newFiles.length) {
      const draggedFile = newFiles[draggedIndex];
      newFiles.splice(draggedIndex, 1);
      newFiles.splice(index, 0, draggedFile);
      setImageFiles(newFiles);
    }

    setImagePreviews(newPreviews);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  const uploadImages = async () => {
    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Keep existing URLs
      const existingUrls = imagePreviews.filter(url => url.startsWith('http'));
      
      // Upload new files
      const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      return [...existingUrls, ...newUrls];
    } catch (error: any) {
      toast({
        title: "Error uploading images",
        description: error.message,
        variant: "destructive",
      });
      return imagePreviews.filter(url => url.startsWith('http'));
    } finally {
      setUploading(false);
    }
  };

  const uploadDocuments = async (vehicleId: string, formData: VehicleFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const documentUploads = [
        { file: insuranceDoc, type: 'insurance' as const, expiry: formData.insurance_expiry },
        { file: inspectionDoc, type: 'inspection' as const, expiry: formData.inspection_expiry },
        { file: roadLicenseDoc, type: 'road_license' as const, expiry: formData.road_license_expiry },
        { file: psvLicenseDoc, type: 'road_license' as const, expiry: formData.tsv_psv_licence_expiry },
      ].filter(doc => doc.file !== null);

      for (const doc of documentUploads) {
        if (!doc.file) continue;

        const fileExt = doc.file.name.split('.').pop();
        const fileName = `${vehicleId}/${doc.type}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicle-documents')
          .upload(fileName, doc.file);

        if (uploadError) throw uploadError;

        // Insert document record
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            entity_type: 'vehicle',
            entity_id: vehicleId,
            document_type: doc.type,
            file_path: fileName,
            expiry_date: doc.expiry || null,
          });

        if (dbError) throw dbError;
      }
    } catch (error: any) {
      toast({
        title: "Error uploading documents",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const onFormSubmit = async (data: VehicleFormData) => {
    const imageUrls = await uploadImages();
    const vehicleData = { 
      ...data, 
      image_urls: imageUrls,
      image_url: imageUrls[0] || null
    };
    
    // If this is a new vehicle (no initialData.id), we need to handle documents after creation
    if (!initialData?.id) {
      // For new vehicles, pass document data along
      await onSubmit({ 
        ...vehicleData,
        _documentFiles: {
          insurance: insuranceDoc,
          inspection: inspectionDoc,
          roadLicense: roadLicenseDoc,
          psvLicense: psvLicenseDoc,
        }
      });
    } else {
      // For existing vehicles, upload documents directly
      await uploadDocuments(initialData.id, data);
      await onSubmit(vehicleData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="model">Vehicle Model *</Label>
            <Input id="model" {...register("model")} placeholder="e.g., Toyota Land Cruiser" />
            {errors.model && <p className="text-sm text-destructive mt-1">{errors.model.message}</p>}
          </div>

          <div>
            <Label htmlFor="registration_number">Registration Number (Plate) *</Label>
            <Input 
              id="registration_number" 
              {...register("registration_number")} 
              placeholder="e.g., KAA 123A" 
              className="uppercase"
            />
            {errors.registration_number && <p className="text-sm text-destructive mt-1">{errors.registration_number.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Vehicle Type *</Label>
              <Select 
                onValueChange={(value: any) => setValue("type", value)} 
                defaultValue={vehicleType}
                disabled={loadingCategories}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCategories ? "Loading..." : "Select vehicle type"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive mt-1">{errors.type.message}</p>}
            </div>

            <div>
              <Label htmlFor="year">Year *</Label>
              <Input 
                id="year" 
                type="number" 
                {...register("year", { valueAsNumber: true })} 
              />
              {errors.year && <p className="text-sm text-destructive mt-1">{errors.year.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capacity">Capacity (seats) *</Label>
              <Input 
                id="capacity" 
                type="number" 
                {...register("capacity", { valueAsNumber: true })} 
              />
              {errors.capacity && <p className="text-sm text-destructive mt-1">{errors.capacity.message}</p>}
            </div>

            <div>
              <Label htmlFor="daily_rate">Daily Rate (KES) *</Label>
              <Input 
                id="daily_rate" 
                type="number" 
                {...register("daily_rate", { valueAsNumber: true })} 
              />
              {errors.daily_rate && <p className="text-sm text-destructive mt-1">{errors.daily_rate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_advance_booking_days">Minimum Advance Booking Days</Label>
              <Select 
                onValueChange={(value) => setValue("min_advance_booking_days", parseInt(value))} 
                defaultValue={String(watch("min_advance_booking_days") || 0)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Real-time (same day)</SelectItem>
                  <SelectItem value="1">1 day in advance</SelectItem>
                  <SelectItem value="2">2 days in advance</SelectItem>
                  <SelectItem value="3">3 days in advance</SelectItem>
                  <SelectItem value="5">5 days in advance</SelectItem>
                  <SelectItem value="7">7 days (1 week)</SelectItem>
                  <SelectItem value="14">14 days (2 weeks)</SelectItem>
                  <SelectItem value="30">30 days (1 month)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">How far in advance clients must book</p>
              {errors.min_advance_booking_days && <p className="text-sm text-destructive mt-1">{errors.min_advance_booking_days.message}</p>}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value: any) => setValue("status", value)} defaultValue={watch("status")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Images ({imagePreviews.length}/{MAX_IMAGES})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div 
                    key={index} 
                    className="relative group cursor-move"
                    draggable
                    onDragStart={(e) => handleImageDragStart(e, index)}
                    onDragOver={(e) => handleImageDragOver(e, index)}
                    onDragEnd={handleImageDragEnd}
                  >
                    <img 
                      src={preview} 
                      alt={`Vehicle preview ${index + 1}`} 
                      className={`w-full h-32 object-cover rounded-md transition-all ${
                        draggedIndex === index ? 'opacity-50 scale-95' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Main
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium mb-2">
                {isDragging ? 'Drop images here' : 'Drag and drop images here'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">or</p>
              <Input
                id="images"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                multiple
                className="hidden"
                disabled={imagePreviews.length >= MAX_IMAGES}
              />
              <Label htmlFor="images" className={imagePreviews.length >= MAX_IMAGES ? 'cursor-not-allowed' : 'cursor-pointer'}>
                <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-md ${
                  imagePreviews.length >= MAX_IMAGES 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-accent'
                }`}>
                  <span>Browse Files ({MAX_IMAGES - imagePreviews.length} remaining)</span>
                </div>
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload 4-6 photos from different angles. Drag images to reorder. First image will be the main photo.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {availableFeatures.map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={feature}
                  checked={selectedFeatures.includes(feature)}
                  onCheckedChange={() => handleFeatureToggle(feature)}
                />
                <Label htmlFor={feature} className="cursor-pointer">{feature}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="insurance_expiry">Insurance Expiry Date *</Label>
              <Input id="insurance_expiry" type="date" {...register("insurance_expiry")} />
              {errors.insurance_expiry && <p className="text-sm text-destructive mt-1">{errors.insurance_expiry.message}</p>}
            </div>
            <DocumentUploadField
              label="Insurance Document"
              required
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5}
              onFileSelect={setInsuranceDoc}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="inspection_expiry">Inspection Expiry Date *</Label>
              <Input id="inspection_expiry" type="date" {...register("inspection_expiry")} />
              {errors.inspection_expiry && <p className="text-sm text-destructive mt-1">{errors.inspection_expiry.message}</p>}
            </div>
            <DocumentUploadField
              label="Inspection Certificate"
              required
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5}
              onFileSelect={setInspectionDoc}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="road_license_expiry">Road License Expiry Date *</Label>
              <Input id="road_license_expiry" type="date" {...register("road_license_expiry")} />
              {errors.road_license_expiry && <p className="text-sm text-destructive mt-1">{errors.road_license_expiry.message}</p>}
            </div>
            <DocumentUploadField
              label="Road License Document"
              required
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5}
              onFileSelect={setRoadLicenseDoc}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tsv_psv_licence_expiry">TSV/PSV Licence Expiry Date</Label>
              <Input id="tsv_psv_licence_expiry" type="date" {...register("tsv_psv_licence_expiry")} />
              <p className="text-xs text-muted-foreground mt-1">Required for commercial passenger vehicles</p>
              {errors.tsv_psv_licence_expiry && <p className="text-sm text-destructive mt-1">{errors.tsv_psv_licence_expiry.message}</p>}
            </div>
            <DocumentUploadField
              label="TSV/PSV Licence Document"
              required={false}
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5}
              onFileSelect={setPsvLicenseDoc}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading || uploading} className="flex-1">
          {loading || uploading ? "Saving..." : initialData ? "Update Vehicle" : "Add Vehicle"}
        </Button>
      </div>
    </form>
  );
}
