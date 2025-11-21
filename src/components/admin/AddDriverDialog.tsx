import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const existingUserSchema = z.object({
  user_id: z.string().min(1, "Please select a user"),
  license_number: z.string().min(1, "License number is required"),
  license_expiry: z.string().min(1, "License expiry is required"),
  ntsa_badge_number: z.string().optional(),
  id_number: z.string().min(1, "ID number is required"),
});

const newUserSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  license_number: z.string().min(1, "License number is required"),
  license_expiry: z.string().min(1, "License expiry is required"),
  ntsa_badge_number: z.string().optional(),
  id_number: z.string().min(1, "ID number is required"),
});

type ExistingUserFormData = z.infer<typeof existingUserSchema>;
type NewUserFormData = z.infer<typeof newUserSchema>;

export function AddDriverDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const { toast } = useToast();

  const existingUserForm = useForm<ExistingUserFormData>({
    resolver: zodResolver(existingUserSchema),
  });

  const newUserForm = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
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
        .select("id, full_name");

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

  const uploadDocument = async (file: File, userId: string, docType: 'driver_license' | 'ntsa_verification') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${docType}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('driver-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { error: docError } = await supabase.from('documents').insert({
      entity_id: userId,
      entity_type: 'driver',
      document_type: docType as any,
      file_path: fileName,
    });

    if (docError) throw docError;
  };

  const onSubmitExisting = async (data: ExistingUserFormData) => {
    setLoading(true);
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

      // Upload documents
      await uploadDocument(licenseFile, data.user_id, 'driver_license');
      await uploadDocument(idFile, data.user_id, 'driver_license'); // Temporary: using driver_license until national_id is added to enum

      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: data.user_id,
        role: "driver",
      });

      if (roleError) throw roleError;

      toast({
        title: "Success",
        description: "Driver added successfully with documents",
      });
      setOpen(false);
      existingUserForm.reset();
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

  const onSubmitNew = async (data: NewUserFormData) => {
    setLoading(true);
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

      // Generate a UUID for the new profile
      const newUserId = crypto.randomUUID();
      
      // First create the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: newUserId,
          full_name: data.full_name,
          phone: data.phone,
        });

      if (profileError) throw profileError;

      // Then create the driver record
      const { error: driverError } = await supabase.from("drivers").insert({
        id: newUserId,
        license_number: data.license_number,
        license_expiry: data.license_expiry,
        ntsa_badge_number: data.ntsa_badge_number || null,
        id_number: data.id_number,
        is_compliant: false,
        status: "unavailable",
      });

      if (driverError) throw driverError;

      // Upload documents
      await uploadDocument(licenseFile, newUserId, 'driver_license');
      await uploadDocument(idFile, newUserId, 'driver_license'); // Temporary: using driver_license until national_id is added to enum

      // Add driver role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: newUserId,
        role: "driver",
      });

      if (roleError) throw roleError;

      toast({
        title: "Success",
        description: "Driver profile created successfully with documents",
      });
      setOpen(false);
      newUserForm.reset();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as "existing" | "new")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Select Existing User</TabsTrigger>
            <TabsTrigger value="new">Create New User</TabsTrigger>
          </TabsList>

          <TabsContent value="existing">
            <form onSubmit={existingUserForm.handleSubmit(onSubmitExisting)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">Select User</Label>
                <Select onValueChange={(value) => existingUserForm.setValue("user_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {existingUserForm.formState.errors.user_id && (
                  <p className="text-sm text-destructive">{existingUserForm.formState.errors.user_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">License Number</Label>
                <Input {...existingUserForm.register("license_number")} placeholder="Enter license number" />
                {existingUserForm.formState.errors.license_number && (
                  <p className="text-sm text-destructive">{existingUserForm.formState.errors.license_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_expiry">License Expiry</Label>
                <Input {...existingUserForm.register("license_expiry")} type="date" />
                {existingUserForm.formState.errors.license_expiry && (
                  <p className="text-sm text-destructive">{existingUserForm.formState.errors.license_expiry.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number">National ID Number</Label>
                <Input {...existingUserForm.register("id_number")} placeholder="Enter ID number" />
                {existingUserForm.formState.errors.id_number && (
                  <p className="text-sm text-destructive">{existingUserForm.formState.errors.id_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ntsa_badge_number">NTSA Badge Number (Optional)</Label>
                <Input {...existingUserForm.register("ntsa_badge_number")} placeholder="Enter NTSA badge number" />
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
          </TabsContent>

          <TabsContent value="new">
            <form onSubmit={newUserForm.handleSubmit(onSubmitNew)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input {...newUserForm.register("full_name")} placeholder="Enter full name" />
                {newUserForm.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{newUserForm.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input {...newUserForm.register("phone")} placeholder="Enter phone number" />
                {newUserForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">{newUserForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input {...newUserForm.register("email")} type="email" placeholder="Enter email address" />
                {newUserForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{newUserForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">License Number</Label>
                <Input {...newUserForm.register("license_number")} placeholder="Enter license number" />
                {newUserForm.formState.errors.license_number && (
                  <p className="text-sm text-destructive">{newUserForm.formState.errors.license_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_expiry">License Expiry</Label>
                <Input {...newUserForm.register("license_expiry")} type="date" />
                {newUserForm.formState.errors.license_expiry && (
                  <p className="text-sm text-destructive">{newUserForm.formState.errors.license_expiry.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_number">National ID Number</Label>
                <Input {...newUserForm.register("id_number")} placeholder="Enter ID number" />
                {newUserForm.formState.errors.id_number && (
                  <p className="text-sm text-destructive">{newUserForm.formState.errors.id_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ntsa_badge_number">NTSA Badge Number (Optional)</Label>
                <Input {...newUserForm.register("ntsa_badge_number")} placeholder="Enter NTSA badge number" />
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
                {loading ? "Creating..." : "Create Driver"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
