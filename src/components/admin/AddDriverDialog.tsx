import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  user_id: z.string().min(1, "Please select a user"),
  license_number: z.string().min(1, "License number is required"),
  license_expiry: z.string().min(1, "License expiry is required"),
  ntsa_badge_number: z.string().optional(),
  id_number: z.string().min(1, "ID number is required"),
});

type FormData = z.infer<typeof formSchema>;

export function AddDriverDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (open) {
      fetchAvailableUsers();
    }
  }, [open]);

  const fetchAvailableUsers = async () => {
    try {
      // Get all users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profilesError) throw profilesError;

      // Get users who are already drivers
      const { data: existingDrivers, error: driversError } = await supabase
        .from("drivers")
        .select("id");

      if (driversError) throw driversError;

      const driverIds = new Set(existingDrivers.map(d => d.id));
      const availableUsers = profiles.filter(p => !driverIds.has(p.id));
      
      setUsers(availableUsers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const uploadDocument = async (file: File, userId: string, docType: 'driver_license' | 'national_id') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${docType}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('driver-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { error: docError } = await supabase.from('documents').insert({
      entity_id: userId,
      entity_type: 'driver',
      document_type: docType,
      file_path: fileName,
    });

    if (docError) throw docError;
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    let driverCreated = false;
    
    try {
      // Validate required documents
      if (!licenseFile || !idFile) {
        toast({
          title: "Missing Documents",
          description: "Please upload both driver's license and national ID",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create driver record
      const { error: driverError } = await supabase.from("drivers").insert({
        id: data.user_id,
        license_number: data.license_number,
        license_expiry: data.license_expiry,
        ntsa_badge_number: data.ntsa_badge_number || null,
        id_number: data.id_number,
        is_compliant: false,
        status: "unavailable",
      });

      if (driverError) throw driverError;
      driverCreated = true;

      // Upload documents
      await uploadDocument(licenseFile, data.user_id, 'driver_license');
      await uploadDocument(idFile, data.user_id, 'national_id');

      // Add driver role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: data.user_id,
        role: "driver",
      });

      if (roleError) {
        // Rollback driver record if role assignment fails
        if (driverCreated) {
          await supabase.from("drivers").delete().eq("id", data.user_id);
        }
        throw roleError;
      }

      toast({
        title: "Success",
        description: "Driver added successfully with documents",
      });
      setOpen(false);
      form.reset();
      setLicenseFile(null);
      setIdFile(null);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
      setLicenseFile(null);
      setIdFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
          <DialogDescription>
            Select an existing user to add as a driver. New drivers should register themselves at /driver/register.
          </DialogDescription>
        </DialogHeader>

        {users.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No available users found. Users need to register first before they can be added as drivers.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">Select User</Label>
              <Select onValueChange={(value) => form.setValue("user_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} {user.email && `(${user.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.user_id && (
                <p className="text-sm text-destructive">{form.formState.errors.user_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_number">License Number</Label>
              <Input {...form.register("license_number")} placeholder="Enter license number" />
              {form.formState.errors.license_number && (
                <p className="text-sm text-destructive">{form.formState.errors.license_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_expiry">License Expiry</Label>
              <Input {...form.register("license_expiry")} type="date" />
              {form.formState.errors.license_expiry && (
                <p className="text-sm text-destructive">{form.formState.errors.license_expiry.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_number">National ID Number</Label>
              <Input {...form.register("id_number")} placeholder="Enter ID number" />
              {form.formState.errors.id_number && (
                <p className="text-sm text-destructive">{form.formState.errors.id_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ntsa_badge_number">NTSA Badge Number (Optional)</Label>
              <Input {...form.register("ntsa_badge_number")} placeholder="Enter NTSA badge number" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_doc">Driver's License Document *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {licenseFile && (
                <p className="text-sm text-muted-foreground">{licenseFile.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_doc">National ID Document *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {idFile && (
                <p className="text-sm text-muted-foreground">{idFile.name}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding..." : "Add Driver"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
