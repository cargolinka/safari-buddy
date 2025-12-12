import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, DollarSign, Users, Clock, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import heroImage from "@/assets/hero-safari-3.jpg";

interface EmptyLeg {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  discounted_rate: number;
  seats_available: number;
  notes: string | null;
  vehicle: {
    model: string;
    type: string;
    capacity: number;
    image_url: string | null;
  };
  profiles: {
    full_name: string;
  };
}

const BrowseEmptyLegs = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchOrigin, setSearchOrigin] = useState("");
  const [searchDestination, setSearchDestination] = useState("");

  const { data: emptyLegs, isLoading } = useQuery({
    queryKey: ["available-empty-legs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empty_legs")
        .select(`
          *,
          vehicles(model, type, capacity, image_url)
        `)
        .eq("status", "available")
        .gte("departure_date", new Date().toISOString().split("T")[0])
        .order("departure_date", { ascending: true });

      if (error) throw error;
      
      // Fetch driver profiles separately
      if (data) {
        const driverIds = [...new Set(data.map(leg => leg.driver_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", driverIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        return data.map(leg => ({
          ...leg,
          vehicle: leg.vehicles,
          profiles: profilesMap.get(leg.driver_id) || { full_name: "Unknown" }
        })) as EmptyLeg[];
      }
      
      return [];
    },
  });

  const handleBooking = async (leg: EmptyLeg) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book this empty leg.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Navigate to booking page with empty leg details
    toast({
      title: "Booking Feature",
      description: "Contact the driver to complete your booking.",
    });
  };

  const filteredLegs = emptyLegs?.filter((leg) => {
    const matchesOrigin = !searchOrigin || 
      leg.origin.toLowerCase().includes(searchOrigin.toLowerCase());
    const matchesDestination = !searchDestination || 
      leg.destination.toLowerCase().includes(searchDestination.toLowerCase());
    return matchesOrigin && matchesDestination;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="relative z-10 container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Empty Legs</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Save up to 50% on empty return journeys
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">

        {/* Search Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Empty Legs</CardTitle>
            <CardDescription>Filter by origin and destination</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Origin</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Nairobi"
                    value={searchOrigin}
                    onChange={(e) => setSearchOrigin(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Mombasa"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty Legs List */}
        {isLoading ? (
          <div className="text-center py-12">Loading available empty legs...</div>
        ) : filteredLegs && filteredLegs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Empty Legs Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or check back later for new offers.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredLegs?.map((leg) => (
              <Card key={leg.id} className="overflow-hidden">
                <div className="md:flex">
                  {leg.vehicle.image_url && (
                    <div className="md:w-1/3">
                      <img
                        src={leg.vehicle.image_url}
                        alt={leg.vehicle.model}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl mb-1">
                            {leg.origin} → {leg.destination}
                          </CardTitle>
                          <CardDescription className="text-base">
                            {leg.vehicle.model} • {leg.vehicle.type}
                          </CardDescription>
                        </div>
                        <Badge variant="default" className="bg-green-500">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Discounted
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(leg.departure_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">Date</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{leg.departure_time}</div>
                            <div className="text-xs text-muted-foreground">Time</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {leg.seats_available} seats
                            </div>
                            <div className="text-xs text-muted-foreground">Available</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              KES {leg.discounted_rate.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Price</div>
                          </div>
                        </div>
                      </div>

                      {leg.notes && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm">{leg.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Driver: {leg.profiles.full_name}
                        </div>
                        <Button onClick={() => handleBooking(leg)}>
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrowseEmptyLegs;
