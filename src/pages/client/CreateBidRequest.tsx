import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, DollarSign } from "lucide-react";
import Header from "@/components/Header";

const CreateBidRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    origin: "",
    destination: "",
    pickup_date: "",
    pickup_time: "",
    return_date: "",
    return_time: "",
    vehicle_type: "",
    passengers: "",
    with_driver: true,
    budget_range_min: "",
    budget_range_max: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("bid_requests")
        .insert({
          ...data,
          client_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Bid Request Created",
        description: "Drivers and owners will start submitting bids shortly.",
      });
      navigate("/client/bid-requests");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      origin: formData.origin,
      destination: formData.destination,
      pickup_date: formData.pickup_date,
      pickup_time: formData.pickup_time,
      return_date: formData.return_date || null,
      return_time: formData.return_time || null,
      vehicle_type: formData.vehicle_type || null,
      passengers: parseInt(formData.passengers),
      with_driver: formData.with_driver,
      budget_range_min: formData.budget_range_min ? parseFloat(formData.budget_range_min) : null,
      budget_range_max: formData.budget_range_max ? parseFloat(formData.budget_range_max) : null,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Request for Bids</h1>
            <p className="text-muted-foreground text-lg">
              Post your trip details and receive competitive bids from drivers and vehicle owners
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
              <CardDescription>
                Provide complete information to get accurate bids
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Request Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Safari trip to Maasai Mara"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Trip Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your trip requirements, special needs, luggage, etc."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origin">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Origin *
                    </Label>
                    <Input
                      id="origin"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      placeholder="e.g., Nairobi"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Destination *
                    </Label>
                    <Input
                      id="destination"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="e.g., Maasai Mara"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickup_date">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Pickup Date *
                    </Label>
                    <Input
                      id="pickup_date"
                      type="date"
                      value={formData.pickup_date}
                      onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup_time">Pickup Time *</Label>
                    <Input
                      id="pickup_time"
                      type="time"
                      value={formData.pickup_time}
                      onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="return_date">Return Date (Optional)</Label>
                    <Input
                      id="return_date"
                      type="date"
                      value={formData.return_date}
                      onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="return_time">Return Time (Optional)</Label>
                    <Input
                      id="return_time"
                      type="time"
                      value={formData.return_time}
                      onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Preferred Vehicle Type</Label>
                    <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="land_cruiser">Land Cruiser</SelectItem>
                        <SelectItem value="tour_van">Tour Van</SelectItem>
                        <SelectItem value="bus">Bus</SelectItem>
                        <SelectItem value="saloon">Saloon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passengers">
                      <Users className="w-4 h-4 inline mr-1" />
                      Number of Passengers *
                    </Label>
                    <Input
                      id="passengers"
                      type="number"
                      min="1"
                      value={formData.passengers}
                      onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                      placeholder="e.g., 4"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="with_driver" className="cursor-pointer">
                      Include Professional Driver
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Hire a vehicle with an experienced driver
                    </p>
                  </div>
                  <Switch
                    id="with_driver"
                    checked={formData.with_driver}
                    onCheckedChange={(checked) => setFormData({ ...formData, with_driver: checked })}
                  />
                </div>

                <div className="space-y-4">
                  <Label>
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Budget Range (Optional)
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="number"
                        value={formData.budget_range_min}
                        onChange={(e) => setFormData({ ...formData, budget_range_min: e.target.value })}
                        placeholder="Min (KES)"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={formData.budget_range_max}
                        onChange={(e) => setFormData({ ...formData, budget_range_max: e.target.value })}
                        placeholder="Max (KES)"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Setting a budget range helps you receive more relevant bids
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending ? "Posting..." : "Post Bid Request"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateBidRequest;
