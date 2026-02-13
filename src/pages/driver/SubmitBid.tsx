import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Users, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";

const SubmitBid = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    vehicle_id: "",
    bid_amount: "",
    message: "",
  });

  const { data: request } = useQuery({
    queryKey: ["bid-request", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ["my-vehicles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("vehicles")
        .select("id, model, registration_number, type")
        .eq("owner_id", user.id)
        .eq("status", "available");

      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("bids")
        .insert({
          bid_request_id: requestId,
          bidder_id: user.id,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["browse-bid-requests"] });
      toast({
        title: "Bid Submitted",
        description: "Your bid has been sent to the client for review.",
      });
      navigate("/driver/bid-requests");
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
    submitMutation.mutate({
      vehicle_id: formData.vehicle_id || null,
      bid_amount: parseFloat(formData.bid_amount),
      message: formData.message || null,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const dailyItinerary = (request as any)?.daily_itinerary as Array<{ date: string; description: string }> | null;
  const inclusives = (request as any)?.inclusives as string[] | null;
  const dropoffLocation = (request as any)?.dropoff_location as string | null;
  const generalComments = (request as any)?.general_comments as string | null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Submit Your Bid</h1>
            <p className="text-muted-foreground text-lg">
              Provide your best offer for this trip (chauffeur driven)
            </p>
          </div>

          {request && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{request.title}</CardTitle>
                <CardDescription>{request.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Pick Up:
                    </span>
                    <p className="font-medium">{request.origin}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Destination:
                    </span>
                    <p className="font-medium">{request.destination}</p>
                  </div>
                  {dropoffLocation && (
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Drop Off:
                      </span>
                      <p className="font-medium">{dropoffLocation}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date:
                    </span>
                    <p className="font-medium">
                      {new Date(request.pickup_date).toLocaleDateString()} {request.pickup_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> Passengers:
                    </span>
                    <p className="font-medium">{request.passengers}</p>
                  </div>
                  {request.budget_range_min && request.budget_range_max && (
                    <div>
                      <span className="text-muted-foreground">Client Budget:</span>
                      <p className="font-medium">
                        KES {request.budget_range_min.toLocaleString()} - {request.budget_range_max.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Daily Itinerary */}
                {dailyItinerary && dailyItinerary.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-2">Daily Itinerary</h4>
                    <div className="space-y-2">
                      {dailyItinerary.map((day, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <span className="font-medium text-primary min-w-[100px]">
                            {formatDate(day.date)}:
                          </span>
                          <span>{day.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inclusives */}
                {inclusives && inclusives.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-2">Required Inclusives</h4>
                    <div className="flex flex-wrap gap-2">
                      {inclusives.map((item) => (
                        <Badge key={item} variant="secondary" className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Comments */}
                {generalComments && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-1">General Comments</h4>
                    <p className="text-sm text-muted-foreground">{generalComments}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Your Bid Details</CardTitle>
              <CardDescription>Enter your competitive offer</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_id">Select Vehicle (Optional)</Label>
                  <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.model} - {vehicle.registration_number} ({vehicle.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bid_amount">Your Bid Amount (KES) *</Label>
                  <Input
                    id="bid_amount"
                    type="number"
                    step="0.01"
                    value={formData.bid_amount}
                    onChange={(e) => setFormData({ ...formData, bid_amount: e.target.value })}
                    placeholder="e.g., 15000"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your total price for this trip
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message to Client (Optional)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Introduce yourself, highlight your experience, special services, etc."
                    rows={4}
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
                    disabled={submitMutation.isPending}
                    className="flex-1"
                  >
                    {submitMutation.isPending ? "Submitting..." : "Submit Bid"}
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

export default SubmitBid;
