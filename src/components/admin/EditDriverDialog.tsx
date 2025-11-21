import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const driverSchema = z.object({
  license_number: z.string().min(1, "License number is required"),
  license_expiry: z.string().min(1, "License expiry is required"),
  ntsa_badge_number: z.string().optional(),
  id_number: z.string().min(1, "ID number is required"),
  status: z.enum(["available", "on_trip", "unavailable"]),
});

type DriverFormData = z.infer<typeof driverSchema>;

interface EditDriverDialogProps {
  driver: any;
  onSuccess: () => void;
}

export function EditDriverDialog({ driver, onSuccess }: EditDriverDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      license_number: driver.license_number,
      license_expiry: driver.license_expiry,
      ntsa_badge_number: driver.ntsa_badge_number || "",
      id_number: driver.id_number || "",
      status: driver.status,
    },
  });

  useEffect(() => {
    if (open) {
      // Reset form with current driver data when dialog opens
      setValue("license_number", driver.license_number);
      setValue("license_expiry", driver.license_expiry);
      setValue("ntsa_badge_number", driver.ntsa_badge_number || "");
      setValue("id_number", driver.id_number || "");
      setValue("status", driver.status);
    }
  }, [open, driver, setValue]);

  const onSubmit = async (data: DriverFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("drivers")
        .update({
          license_number: data.license_number,
          license_expiry: data.license_expiry,
          ntsa_badge_number: data.ntsa_badge_number || null,
          id_number: data.id_number,
          status: data.status,
        })
        .eq("id", driver.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Driver updated successfully",
      });
      setOpen(false);
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
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Driver Name</Label>
            <Input value={driver.profiles?.full_name || "N/A"} disabled className="bg-muted" />
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

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value: any) => setValue("status", value)} defaultValue={driver.status}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_trip">On Trip</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Driver"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
