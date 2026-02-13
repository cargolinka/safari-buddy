import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, DollarSign, Plus, Trash2 } from "lucide-react";
import Header from "@/components/Header";

const INCLUSIVE_OPTIONS = [
  "Vehicle Hire",
  "Driver's Allowance",
  "Fuel",
  "Driver & Vehicle Park Fees",
  "Parking",
  "Others",
];

interface DayItinerary {
  date: string;
  description: string;
}

const CreateBidRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    origin: "",
    destination: "",
    dropoff_location: "",
    pickup_date: "",
    pickup_time: "",
    return_date: "",
    return_time: "",
    vehicle_type: "",
    passengers: "",
    budget_range_min: "",
    budget_range_max: "",
    general_comments: "",
  });

  const [dailyItinerary, setDailyItinerary] = useState<DayItinerary[]>([]);
  const [selectedInclusives, setSelectedInclusives] = useState<string[]>([]);

  // Auto-generate days when pickup/return dates change
  useMemo(() => {
    if (formData.pickup_date) {
      const start = new Date(formData.pickup_date);
      const end = formData.return_date ? new Date(formData.return_date) : start;
      const days: DayItinerary[] = [];
      const current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        const existing = dailyItinerary.find((d) => d.date === dateStr);
        days.push({
          date: dateStr,
          description: existing?.description || "",
        });
        current.setDate(current.getDate() + 1);
      }
      if (JSON.stringify(days.map(d => d.date)) !== JSON.stringify(dailyItinerary.map(d => d.date))) {
        setDailyItinerary(days);
      }
    }
  }, [formData.pickup_date, formData.return_date]);

  const toggleInclusive = (item: string) => {
    setSelectedInclusives((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const updateItineraryDay = (index: number, description: string) => {
    setDailyItinerary((prev) =>
      prev.map((day, i) => (i === index ? { ...day, description } : day))
    );
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("bid_requests")
        .insert({
          ...data,
          client_id: user.id,
          with_driver: true, // Always chauffeur driven
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
      dropoff_location: formData.dropoff_location || null,
      pickup_date: formData.pickup_date,
      pickup_time: formData.pickup_time,
      return_date: formData.return_date || null,
      return_time: formData.return_time || null,
      vehicle_type: formData.vehicle_type || null,
      passengers: parseInt(formData.passengers),
      budget_range_min: formData.budget_range_min ? parseFloat(formData.budget_range_min) : null,
      budget_range_max: formData.budget_range_max ? parseFloat(formData.budget_range_max) : null,
      daily_itinerary: dailyItinerary.filter((d) => d.description.trim()),
      inclusives: selectedInclusives,
      general_comments: formData.general_comments || null,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
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
                Provide complete information to get accurate bids. All hires include a professional chauffeur.
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
                      Pick Up Point *
                    </Label>
                    <Input
                      id="origin"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      placeholder="e.g., JKIA Airport, Nairobi"
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

                <div className="space-y-2">
                  <Label htmlFor="dropoff_location">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Drop Off Point
                  </Label>
                  <Input
                    id="dropoff_location"
                    value={formData.dropoff_location}
                    onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
                    placeholder="e.g., Nairobi CBD or same as pick up"
                  />
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

                {/* Daily Itinerary Section */}
                {dailyItinerary.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Daily Itinerary</Label>
                    <p className="text-sm text-muted-foreground">
                      Add comments for each day to help drivers provide accurate quotes
                    </p>
                    <div className="space-y-3">
                      {dailyItinerary.map((day, index) => (
                        <div key={day.date} className="flex gap-3 items-start">
                          <div className="min-w-[120px] pt-2">
                            <span className="text-sm font-medium text-primary">
                              {formatDate(day.date)}
                            </span>
                          </div>
                          <Input
                            value={day.description}
                            onChange={(e) => updateItineraryDay(index, e.target.value)}
                            placeholder={`e.g., Pick up from Airport, drive to lodge...`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Inclusives Section */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">What Should Be Included?</Label>
                  <p className="text-sm text-muted-foreground">
                    Select what you need included in the bid price
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {INCLUSIVE_OPTIONS.map((item) => (
                      <div
                        key={item}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => toggleInclusive(item)}
                      >
                        <Checkbox
                          checked={selectedInclusives.includes(item)}
                          onCheckedChange={() => toggleInclusive(item)}
                        />
                        <Label className="cursor-pointer font-normal">{item}</Label>
                      </div>
                    ))}
                  </div>
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

                {/* General Comments */}
                <div className="space-y-2">
                  <Label htmlFor="general_comments">General Comments (Optional)</Label>
                  <Textarea
                    id="general_comments"
                    value={formData.general_comments}
                    onChange={(e) => setFormData({ ...formData, general_comments: e.target.value })}
                    placeholder="Any additional notes, special requirements, or preferences..."
                    rows={3}
                  />
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
