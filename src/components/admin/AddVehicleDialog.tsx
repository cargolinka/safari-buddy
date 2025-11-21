import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import VehicleForm from "@/components/owner/VehicleForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AddVehicleDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchOwners();
    }
  }, [open]);

  const fetchOwners = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles:user_id(id, full_name, email)")
        .eq("role", "owner");

      if (error) throw error;
      
      const uniqueOwners = data
        .filter((item: any) => item.profiles)
        .map((item: any) => item.profiles)
        .filter((profile: any, index: number, self: any[]) => 
          index === self.findIndex((p) => p.id === profile.id)
        );
      
      setOwners(uniqueOwners);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: any) => {
    if (!selectedOwnerId) {
      toast({
        title: "Error",
        description: "Please select an owner or authorised driver",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("vehicles").insert({
        ...data,
        owner_id: selectedOwnerId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vehicle added successfully",
      });
      setOpen(false);
      setSelectedOwnerId("");
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
          Add Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="owner">Owner/Authorised Driver</Label>
            <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select owner/authorised driver" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <VehicleForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
