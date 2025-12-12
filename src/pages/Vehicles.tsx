import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Car, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import vehiclesHero from "@/assets/vehicles-hero.jpg";

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
  registration_number: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  vehicle_subcategories?: {
    name: string;
    vehicle_categories?: {
      name: string;
    };
  } | null;
}

const Vehicles = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [vehicleSubCategory, setVehicleSubCategory] = useState(searchParams.get("vehicleSubCategory") || "");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [selectedCategory, vehicleSubCategory, subCategories, sortBy]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicle_categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Failed to load categories:", error.message);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicle_subcategories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setSubCategories(data || []);
    } catch (error: any) {
      console.error("Failed to load subcategories:", error.message);
    }
  };

  // Filter subcategories based on selected category
  const filteredSubCategories = selectedCategory && selectedCategory !== "all"
    ? subCategories.filter(sub => sub.category_id === selectedCategory)
    : subCategories;

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_subcategories(name, vehicle_categories(name))
        `)
        .eq("status", "available")
        .eq("is_compliant", true);

      // Filter by category if selected (through subcategories)
      if (selectedCategory && selectedCategory !== "" && selectedCategory !== "all") {
        const categorySubIds = subCategories
          .filter(sub => sub.category_id === selectedCategory)
          .map(sub => sub.id);
        if (categorySubIds.length > 0) {
          query = query.in("subcategory_id", categorySubIds);
        }
      }

      // Filter by vehicle subcategory if selected
      if (vehicleSubCategory && vehicleSubCategory !== "" && vehicleSubCategory !== "all") {
        query = query.eq("subcategory_id", vehicleSubCategory);
      }

      // Apply sorting
      if (sortBy === "price_low") {
        query = query.order("daily_rate", { ascending: true });
      } else if (sortBy === "price_high") {
        query = query.order("daily_rate", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      toast.error("Failed to load vehicles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get selected category name for title
  const selectedCategoryName = categories.find(cat => cat.id === selectedCategory)?.name || "All Vehicles";


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Image */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={vehiclesHero} 
          alt="Safari Vehicles" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <h1 className="text-5xl font-bold text-white mb-4">Find Your Perfect Vehicle</h1>
            <p className="text-xl text-white/90">Choose from our fleet of premium safari vehicles</p>
          </div>
        </div>
      </div>

      {/* Category & Subcategory Filters */}
      <div className="bg-primary/10 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground">{selectedCategoryName}</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Category Filter */}
              <div className="w-full sm:w-auto min-w-[200px]">
                <Select 
                  value={selectedCategory} 
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setVehicleSubCategory(""); // Reset subcategory when category changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory Filter */}
              {filteredSubCategories.length > 0 && (
                <div className="w-full sm:w-auto min-w-[200px]">
                  <Select value={vehicleSubCategory} onValueChange={setVehicleSubCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Sub Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sub Categories</SelectItem>
                      {filteredSubCategories.map((subCat) => (
                        <SelectItem key={subCat.id} value={subCat.id}>
                          {subCat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Sort By */}
              <div className="w-full sm:w-auto min-w-[180px]">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
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
              setSelectedCategory("");
              setVehicleSubCategory("");
              setSearchParams({});
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
                <Card key={vehicle.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-md group">
                  <div className="relative h-52 overflow-hidden bg-muted">
                    {(vehicle.image_urls?.[0] || vehicle.image_url) ? (
                      <img 
                        src={vehicle.image_urls?.[0] || vehicle.image_url} 
                        alt={vehicle.model}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                        <Car className="h-20 w-20 text-muted-foreground/50" />
                      </div>
                    )}
                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Category badge - top left */}
                    {vehicle.vehicle_subcategories?.vehicle_categories?.name && (
                      <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-primary-foreground font-medium shadow-lg">
                        {vehicle.vehicle_subcategories.vehicle_categories.name}
                      </Badge>
                    )}
                    
                    {/* Available badge - top right */}
                    <Badge className="absolute top-3 right-3 bg-green-600/90 backdrop-blur-sm text-white shadow-lg">
                      Available
                    </Badge>
                    
                    {/* Subcategory badge - bottom left */}
                    {vehicle.vehicle_subcategories?.name && (
                      <Badge variant="outline" className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-foreground border-0 shadow-lg font-medium">
                        {vehicle.vehicle_subcategories.name}
                      </Badge>
                    )}
                    
                    {/* Price badge - bottom right */}
                    <div className="absolute bottom-3 right-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
                      <span className="text-lg font-bold text-primary">
                        KES {Number(vehicle.daily_rate).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">/day</span>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {vehicle.model}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-3">
                      <span>{vehicle.year}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {vehicle.capacity} seats
                      </span>
                      {vehicle.registration_number && (
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                          {vehicle.registration_number}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-3">
                    {vehicle.features && vehicle.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {vehicle.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {vehicle.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{vehicle.features.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <Button asChild className="w-full">
                      <Link to={`/safari-vehicles/${vehicle.id}`}>
                        View Details
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
