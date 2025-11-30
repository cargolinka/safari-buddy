import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, MapPin, Users, DollarSign, CheckCircle2 } from "lucide-react";
import { format, addMonths } from "date-fns";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  type: string;
  model: string;
  year: number;
  capacity: number;
  daily_rate: number;
  features: string[] | null;
  status: string;
  registration_number: string | null;
  image_urls: string[] | null;
  insurance_expiry: string;
  inspection_expiry: string;
  road_license_expiry: string;
}

interface Booking {
  pickup_date: string;
  dropoff_date: string;
  status: string;
}

const PublicVehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchVehicleDetails();
    fetchBookings();
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setVehicle(data);
    } catch (error: any) {
      toast.error("Failed to load vehicle details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("pickup_date, dropoff_date, status")
        .eq("vehicle_id", id)
        .in("status", ["confirmed", "in_progress"]);

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error("Failed to load bookings:", error);
    }
  };

  const isDateBooked = (date: Date) => {
    return bookings.some(booking => {
      const pickup = new Date(booking.pickup_date);
      const dropoff = new Date(booking.dropoff_date);
      return date >= pickup && date <= dropoff;
    });
  };

  const formatVehicleType = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <Skeleton className="h-96 w-full mb-4" />
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-20" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Vehicle not found</h1>
          <Button onClick={() => navigate("/vehicles")}>Back to Vehicles</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/vehicles")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div>
            <div className="relative mb-4 rounded-lg overflow-hidden">
              <Badge className="absolute top-4 right-4 z-10 bg-green-500">
                {vehicle.status}
              </Badge>
              {vehicle.image_urls && vehicle.image_urls.length > 0 ? (
                <img
                  src={vehicle.image_urls[selectedImage]}
                  alt={vehicle.model}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <DollarSign className="w-24 h-24 text-primary/40" />
                </div>
              )}
            </div>

            {vehicle.image_urls && vehicle.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {vehicle.image_urls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${vehicle.model} ${idx + 1}`}
                      className="w-20 h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Availability Calendar */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Availability Calendar</h3>
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Booked</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Calendar
                    mode="single"
                    modifiers={{
                      booked: (date) => isDateBooked(date)
                    }}
                    modifiersStyles={{
                      booked: { backgroundColor: "hsl(var(--destructive))", color: "white" }
                    }}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                  <Calendar
                    mode="single"
                    month={addMonths(new Date(), 1)}
                    modifiers={{
                      booked: (date) => isDateBooked(date)
                    }}
                    modifiersStyles={{
                      booked: { backgroundColor: "hsl(var(--destructive))", color: "white" }
                    }}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                {formatVehicleType(vehicle.type)}
              </div>
              <h1 className="text-4xl font-bold mb-2">{vehicle.model}</h1>
              <p className="text-muted-foreground">
                {vehicle.year} • {vehicle.registration_number}
              </p>
            </div>

            {/* Pricing */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Daily</div>
                    <div className="text-2xl font-bold text-primary">
                      KSh {vehicle.daily_rate.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Weekly</div>
                    <div className="text-2xl font-bold text-primary">
                      KSh {(vehicle.daily_rate * 7 * 0.9).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Monthly</div>
                    <div className="text-2xl font-bold text-primary">
                      KSh {(vehicle.daily_rate * 30 * 0.8).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button size="lg" className="flex-1">
                Book Now
              </Button>
              <Button size="lg" variant="secondary" className="flex-1">
                Enquire
              </Button>
            </div>

            {/* Specifications */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {vehicle.capacity} passengers
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Year</span>
                    <span className="font-medium">{vehicle.year}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{formatVehicleType(vehicle.type)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary">{vehicle.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Features</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {vehicle.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicVehicleDetails;
