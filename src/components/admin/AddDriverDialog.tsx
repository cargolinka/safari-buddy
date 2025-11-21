import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const driverSchema = z.object({
  user_id: z.string().min(1, "Please select a user"),
  license_number: z.string().min(1, "License number is required"),
  license_expiry: z.string().min(1, "License expiry is required"),
  ntsa_badge_number: z.string().optional(),
  id_number: z.string().min(1, "ID number is required"),
});

type DriverFormData = z.infer<typeof driverSchema>;

export function AddDriverDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
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

  const onSubmit = async (data: DriverFormData) => {
    setLoading(true);
    try {
      // Insert driver record
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

      // Add driver role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: data.user_id,
        role: "driver",
      });

      if (roleError) throw roleError;

      toast({
        title: "Success",
        description: "Driver added successfully",
      });
      setOpen(false);
      reset();
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_id">Select User</Label>
            <Select onValueChange={(value) => setValue("user_id", value)}>
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
            {errors.user_id && (
              <p className="text-sm text-destructive">{errors.user_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_number">License Number</Label>
            <Input {...register("license_number")} placeholder="Enter license number" />
            {errors.license_number && (
              <p className="text-sm text-destructive">{errors.license_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_expiry">License Expiry</Label>
            <Input {...register("license_expiry")} type="date" />
            {errors.license_expiry && (
              <p className="text-sm text-destructive">{errors.license_expiry.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_number">National ID Number</Label>
            <Input {...register("id_number")} placeholder="Enter ID number" />
            {errors.id_number && (
              <p className="text-sm text-destructive">{errors.id_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ntsa_badge_number">NTSA Badge Number (Optional)</Label>
            <Input {...register("ntsa_badge_number")} placeholder="Enter NTSA badge number" />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Driver"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
