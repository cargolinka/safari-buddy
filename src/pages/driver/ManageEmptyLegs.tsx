import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MapPin, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmptyLeg {
  id: string;
  driver_id: string;
  vehicle_id: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  discounted_rate: number;
  seats_available: number;
  status: string;
  notes: string | null;
  vehicle: {
    model: string;
    registration_number: string;
  };
}

const ManageEmptyLegs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingLeg, setEditingLeg] = useState<EmptyLeg | null>(null);
  
  const [formData, setFormData] = useState({
    vehicle_id: "",
    origin: "",
    destination: "",
    departure_date: "",
    departure_time: "",
    discounted_rate: "",
    seats_available: "",
    notes: "",
  });

  // Fetch current user and driver info
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch driver's vehicles
  const { data: vehicles } = useQuery({
    queryKey: ["driver-vehicles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, model, registration_number")
        .eq("owner_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch empty legs
  const { data: emptyLegs, isLoading } = useQuery({
    queryKey: ["empty-legs", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("empty_legs")
        .select(`
          *,
          vehicle:vehicles(model, registration_number)
        `)
        .eq("driver_id", user.id)
        .order("departure_date", { ascending: true });

      if (error) throw error;
      return data as EmptyLeg[];
    },
    enabled: !!user,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingLeg) {
        const { error } = await supabase
          .from("empty_legs")
          .update(data)
          .eq("id", editingLeg.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("empty_legs")
          .insert({ ...data, driver_id: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empty-legs"] });
      toast({
        title: editingLeg ? "Empty Leg Updated" : "Empty Leg Created",
        description: editingLeg 
          ? "Your empty leg has been updated successfully."
          : "Your empty leg has been created successfully.",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("empty_legs")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empty-legs"] });
      toast({
        title: "Empty Leg Deleted",
        description: "The empty leg has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      vehicle_id: formData.vehicle_id,
      origin: formData.origin,
      destination: formData.destination,
      departure_date: formData.departure_date,
      departure_time: formData.departure_time,
      discounted_rate: parseFloat(formData.discounted_rate),
      seats_available: parseInt(formData.seats_available),
      notes: formData.notes || null,
    });
  };

  const handleEdit = (leg: EmptyLeg) => {
    setEditingLeg(leg);
    setFormData({
      vehicle_id: leg.vehicle_id,
      origin: leg.origin,
      destination: leg.destination,
      departure_date: leg.departure_date,
      departure_time: leg.departure_time,
      discounted_rate: leg.discounted_rate.toString(),
      seats_available: leg.seats_available.toString(),
      notes: leg.notes || "",
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingLeg(null);
    setFormData({
      vehicle_id: "",
      origin: "",
      destination: "",
      departure_date: "",
      departure_time: "",
      discounted_rate: "",
      seats_available: "",
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      available: "default",
      booked: "secondary",
      expired: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Empty Legs</h1>
          <p className="text-muted-foreground mt-2">
            Offer discounted trips for your empty return journeys
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleCloseDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Empty Leg
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLeg ? "Edit Empty Leg" : "Create Empty Leg"}
              </DialogTitle>
              <DialogDescription>
                Offer a discounted trip for an empty return journey
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_id">Vehicle *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicle_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} - {vehicle.registration_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin *</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) =>
                      setFormData({ ...formData, origin: e.target.value })
                    }
                    placeholder="e.g., Nairobi"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination *</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    placeholder="e.g., Mombasa"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departure_date">Departure Date *</Label>
                  <Input
                    id="departure_date"
                    type="date"
                    value={formData.departure_date}
                    onChange={(e) =>
                      setFormData({ ...formData, departure_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departure_time">Departure Time *</Label>
                  <Input
                    id="departure_time"
                    type="time"
                    value={formData.departure_time}
                    onChange={(e) =>
                      setFormData({ ...formData, departure_time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discounted_rate">Discounted Rate (KES) *</Label>
                  <Input
                    id="discounted_rate"
                    type="number"
                    step="0.01"
                    value={formData.discounted_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, discounted_rate: e.target.value })
                    }
                    placeholder="e.g., 5000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats_available">Seats Available *</Label>
                  <Input
                    id="seats_available"
                    type="number"
                    value={formData.seats_available}
                    onChange={(e) =>
                      setFormData({ ...formData, seats_available: e.target.value })
                    }
                    placeholder="e.g., 4"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional information about this trip..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? "Saving..."
                    : editingLeg
                    ? "Update"
                    : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {emptyLegs && emptyLegs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No empty legs created yet. Click "Add Empty Leg" to get started.
            </CardContent>
          </Card>
        ) : (
          emptyLegs?.map((leg) => (
            <Card key={leg.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {leg.origin} → {leg.destination}
                    </CardTitle>
                    <CardDescription>
                      {leg.vehicle.model} - {leg.vehicle.registration_number}
                    </CardDescription>
                  </div>
                  {getStatusBadge(leg.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(leg.departure_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {leg.departure_time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        KES {leg.discounted_rate.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Discounted Rate
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        {leg.seats_available} seats
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Available
                      </div>
                    </div>
                  </div>
                </div>
                {leg.notes && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {leg.notes}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(leg)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(leg.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageEmptyLegs;
