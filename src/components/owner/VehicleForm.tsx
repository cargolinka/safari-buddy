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

const vehicleSchema = z.object({
  model: z.string().min(1, "Model is required"),
  type: z.string().min(1, "Vehicle type is required"),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  capacity: z.number().min(1).max(100),
  daily_rate: z.number().min(0),
  insurance_expiry: z.string(),
  inspection_expiry: z.string(),
  road_license_expiry: z.string(),
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

export default function VehicleForm({ initialData, onSubmit, loading }: VehicleFormProps) {
  const { toast } = useToast();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(initialData?.features || []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      model: initialData?.model || "",
      type: initialData?.type || "",
      year: initialData?.year || new Date().getFullYear(),
      capacity: initialData?.capacity || 5,
      daily_rate: initialData?.daily_rate || 0,
      insurance_expiry: initialData?.insurance_expiry || "",
      inspection_expiry: initialData?.inspection_expiry || "",
      road_license_expiry: initialData?.road_license_expiry || "",
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
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return imagePreview;

    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
      return imagePreview;
    } finally {
      setUploading(false);
    }
  };

  const onFormSubmit = async (data: VehicleFormData) => {
    const imageUrl = await uploadImage();
    await onSubmit({ ...data, image_url: imageUrl });
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Vehicle preview" className="w-full h-64 object-cover rounded-md" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-4">
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              <Label htmlFor="image" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  <span>Upload Image</span>
                </div>
              </Label>
            </div>
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
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="insurance_expiry">Insurance Expiry Date *</Label>
            <Input id="insurance_expiry" type="date" {...register("insurance_expiry")} />
            {errors.insurance_expiry && <p className="text-sm text-destructive mt-1">{errors.insurance_expiry.message}</p>}
          </div>

          <div>
            <Label htmlFor="inspection_expiry">Inspection Expiry Date *</Label>
            <Input id="inspection_expiry" type="date" {...register("inspection_expiry")} />
            {errors.inspection_expiry && <p className="text-sm text-destructive mt-1">{errors.inspection_expiry.message}</p>}
          </div>

          <div>
            <Label htmlFor="road_license_expiry">Road License Expiry Date *</Label>
            <Input id="road_license_expiry" type="date" {...register("road_license_expiry")} />
            {errors.road_license_expiry && <p className="text-sm text-destructive mt-1">{errors.road_license_expiry.message}</p>}
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
