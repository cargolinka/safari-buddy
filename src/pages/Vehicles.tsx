import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, MapPin, Users, DollarSign, Car } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  is_compliant: boolean;
}

const Vehicles = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
  );
  const [vehicleType, setVehicleType] = useState(searchParams.get("vehicleType") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");

  useEffect(() => {
    fetchVehicles();
  }, [vehicleType, startDate, endDate]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("vehicles")
        .select("*")
        .eq("status", "available")
        .eq("is_compliant", true);

      // Filter by vehicle type if selected
      if (vehicleType && vehicleType !== "" && vehicleType !== "all") {
        query = query.eq("type", vehicleType as any);
      }

      // If dates are selected, filter out vehicles that are already booked
      if (startDate && endDate) {
        const { data: bookedVehicles } = await supabase
          .from("bookings")
          .select("vehicle_id")
          .or(`and(pickup_date.lte.${format(endDate, "yyyy-MM-dd")},dropoff_date.gte.${format(startDate, "yyyy-MM-dd")})`)
          .in("status", ["confirmed", "in_progress"]);

        if (bookedVehicles && bookedVehicles.length > 0) {
          const bookedIds = bookedVehicles.map(b => b.vehicle_id);
          query = query.not("id", "in", `(${bookedIds.join(",")})`);
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      toast.error("Failed to load vehicles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params: any = {};
    if (startDate) params.startDate = format(startDate, "yyyy-MM-dd");
    if (endDate) params.endDate = format(endDate, "yyyy-MM-dd");
    if (vehicleType) params.vehicleType = vehicleType;
    if (destination) params.destination = destination;
    
    setSearchParams(params);
    fetchVehicles();
  };

  const formatVehicleType = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search Bar */}
      <div className="bg-primary/10 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground mb-6">Browse Vehicles</h1>
          <Card className="p-4 shadow-lg bg-card">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PP") : "Start Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1 min-w-[180px]">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PP") : "End Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => date < (startDate || new Date())}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1 min-w-[160px]">
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vehicle Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="land_cruiser">Land Cruiser</SelectItem>
                    <SelectItem value="tour_van">Tour Van</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="saloon">Saloon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-shrink-0">
                <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                  Search
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Vehicle Listings */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">No vehicles found</h2>
            <p className="text-muted-foreground mb-6">Try adjusting your search criteria</p>
            <Button onClick={() => {
              setVehicleType("all");
              setStartDate(undefined);
              setEndDate(undefined);
              setDestination("");
              setSearchParams({});
              fetchVehicles();
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                Found {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Car className="w-24 h-24 text-primary/40" />
                  </div>
                  
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{vehicle.model}</CardTitle>
                        <CardDescription>{vehicle.year}</CardDescription>
                      </div>
                      <Badge variant="secondary">{formatVehicleType(vehicle.type)}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{vehicle.capacity} seats</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${vehicle.daily_rate}/day</span>
                      </div>
                    </div>
                    
                    {vehicle.features && vehicle.features.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {vehicle.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {vehicle.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{vehicle.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <Button asChild className="w-full">
                      <Link to={`/booking/${vehicle.id}`}>
                        Book Now
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
