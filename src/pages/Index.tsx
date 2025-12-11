import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Truck, Users, Shield, Calendar as CalendarIcon, MapPin, Car, Bus, ArrowRight, Facebook, Twitter, Instagram, Mail, Phone, User, Building, DollarSign, Gavel, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage1 from "@/assets/hero-safari.jpg";
import heroImage2 from "@/assets/hero-safari-2.jpg";
import heroImage3 from "@/assets/hero-safari-3.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState<string>("");
  const [vehicleSubCategory, setVehicleSubCategory] = useState<string>("");
  const [startLocation, setStartLocation] = useState<string>("");
  const [featuredVehicles, setFeaturedVehicles] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedVehicles();
    fetchHeroSlides();
    fetchCategories();
    fetchSubCategories();
  }, []);

  // Filter subcategories when vehicle type (category) changes
  useEffect(() => {
    if (vehicleType) {
      const filtered = subCategories.filter(sub => sub.category_id === vehicleType);
      setFilteredSubCategories(filtered);
      // Reset subcategory if it doesn't belong to the selected category
      if (vehicleSubCategory && !filtered.find(sub => sub.id === vehicleSubCategory)) {
        setVehicleSubCategory("");
      }
    } else {
      setFilteredSubCategories(subCategories);
    }
  }, [vehicleType, subCategories]);

  const fetchCategories = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: catError } = await supabase
        .from("vehicle_categories")
        .select("*")
        .order("name", { ascending: true });

      if (catError) throw catError;

      // Fetch vehicle counts per category via subcategories
      const { data: vehiclesData, error: vehError } = await supabase
        .from("vehicles")
        .select(`
          id,
          vehicle_subcategories!inner(category_id)
        `)
        .eq("status", "available")
        .eq("is_compliant", true);

      if (vehError) throw vehError;

      // Merge counts into categories
      const categoriesWithCounts = (categoriesData || []).map(cat => ({
        ...cat,
        vehicle_count: (vehiclesData || []).filter(v => 
          v.vehicle_subcategories?.category_id === cat.id
        ).length
      }));

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicle_subcategories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setSubCategories(data || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchHeroSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      // Fallback to default slide if no slides exist
      if (!data || data.length === 0) {
        setHeroSlides([{
          id: "default",
          title: "Adventure Awaits",
          subtitle: "Premium Safari Vehicle Hire",
          description: "Explore the wild with our top-quality safari vehicles. Professional drivers and well-maintained fleet for your unforgettable journey.",
          image_url: heroImage1,
          button_text: "Browse Vehicles",
          button_link: "/vehicles",
          secondary_button_text: "Learn More",
          secondary_button_link: "/about",
        }]);
      } else {
        setHeroSlides(data);
      }
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      // Fallback on error
      setHeroSlides([{
        id: "default",
        title: "Adventure Awaits",
        subtitle: "Premium Safari Vehicle Hire",
        description: "Explore the wild with our top-quality safari vehicles.",
        image_url: heroImage1,
        button_text: "Browse Vehicles",
        button_link: "/vehicles",
        secondary_button_text: "Learn More",
        secondary_button_link: "/about",
      }]);
    }
  };

  const fetchFeaturedVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_subcategories(name, vehicle_categories(name))
        `)
        .eq("status", "available")
        .eq("is_compliant", true)
        .limit(8);

      if (error) throw error;
      setFeaturedVehicles(data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };


  const blogPosts = [
    {
      title: "Top Safari Destinations in Kenya for 2024",
      category: "Travel Guide",
      excerpt: "Discover the best safari destinations and plan your perfect wildlife adventure across Kenya's stunning national parks.",
      date: "15.11.2024",
      image: heroImage1,
    },
    {
      title: "Choosing the Right Vehicle for Your Safari",
      category: "Vehicle Guide",
      excerpt: "Learn how to select the perfect safari vehicle based on your destination, group size, and adventure requirements.",
      date: "10.11.2024",
      image: heroImage2,
    },
    {
      title: "Safari Safety Tips: What Every Traveler Should Know",
      category: "Safety & Tips",
      excerpt: "Essential safety guidelines and tips to ensure a safe and memorable safari experience in the wild.",
      date: "05.11.2024",
      image: heroImage3,
    },
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (vehicleType) params.set("vehicleType", vehicleType);
    if (vehicleSubCategory) params.set("vehicleSubCategory", vehicleSubCategory);
    if (startLocation) params.set("startLocation", startLocation);
    
    navigate(`/vehicles?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Carousel Section */}
      <section className="relative overflow-hidden">
        <Carousel className="w-full" opts={{ loop: true }}>
          <CarouselContent>
            {heroSlides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="relative h-[70vh] flex items-center justify-center">
                  <div 
                    className="absolute inset-0 bg-cover"
                    style={{ 
                      backgroundImage: `url(${slide.image_url})`,
                      backgroundPosition: `${slide.image_position_x ?? 50}% ${slide.image_position_y ?? 50}%`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  
                  <div className="relative z-10 container mx-auto px-4 text-center">
                    <Badge className="mb-6 bg-accent text-accent-foreground">
                      {slide.subtitle}
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                      {slide.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
                      {slide.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link to="/auth?role=driver">
                          <Car className="w-5 h-5 mr-2" />
                          Driver Login
                        </Link>
                      </Button>
                      <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link to="/auth?role=owner">
                          <Building className="w-5 h-5 mr-2" />
                          Fleet Owner Login
                        </Link>
                      </Button>
                      <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link to="/auth?role=client_individual">
                          <User className="w-5 h-5 mr-2" />
                          Client Login
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>

        {/* Search Bar */}
        <div className="container mx-auto px-4 -mt-16 relative z-20">
          <Card className="p-4 shadow-xl bg-card">
            <div className="flex flex-wrap items-end gap-3">
              {/* Start Location */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Start Location"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Vehicle Type (Category) */}
              <div className="flex-1 min-w-[160px]">
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vehicle Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Sub Category */}
              <div className="flex-1 min-w-[180px]">
                <Select value={vehicleSubCategory} onValueChange={setVehicleSubCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sub Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubCategories.map((subCat) => (
                      <SelectItem key={subCat.id} value={subCat.id}>
                        {subCat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <div className="flex-shrink-0">
                <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                  Search
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose Our Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive vehicle hire management with built-in compliance tracking
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Verified Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All vehicles undergo compliance checks including insurance, inspection, and licensing
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Licensed Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  NTSA-verified professional drivers with up-to-date licenses
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Compliance Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automated alerts for expiring documents and licenses
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Easy Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Book with or without drivers, flexible dates, and instant confirmation
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Hire by Category Section */}
      <section className="bg-background pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find the perfect vehicle for your safari adventure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id}
                className="group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 shadow-lg"
                onClick={() => navigate(`/vehicles?category=${category.id}`)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <Car className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Vehicle count badge - top right */}
                  <Badge className="absolute top-3 right-3 bg-accent/90 backdrop-blur-sm text-accent-foreground font-semibold shadow-lg">
                    {category.vehicle_count || 0} {category.vehicle_count === 1 ? 'Vehicle' : 'Vehicles'}
                  </Badge>
                  
                  {/* Category name - bottom left */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-white/80 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vehicles Section */}
      <section className="bg-secondary">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-2">
                Featured Vehicles
              </h2>
              <p className="text-lg text-muted-foreground">
                Popular choices from verified owners
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/vehicles">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading vehicles...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredVehicles.map((vehicle) => (
                <Card 
                  key={vehicle.id}
                  className="group hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border-0 shadow-md"
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                >
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
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Empty Legs Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-600 text-white">
                <DollarSign className="w-3 h-3 mr-1" />
                Special Offers
              </Badge>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Empty Legs - Save Up to 50%
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Book discounted trips on empty return journeys. Great deals on one-way trips when drivers are returning to their base.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="text-center border-2 border-green-600/20 hover:border-green-600/40 transition-colors">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-green-600/10 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Huge Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Save up to 50% on regular rates for empty return trips
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center border-2 border-green-600/20 hover:border-green-600/40 transition-colors">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-green-600/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Popular Routes</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Nairobi-Mombasa, Safari parks returns, and more
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center border-2 border-green-600/20 hover:border-green-600/40 transition-colors">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-green-600/10 flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Same Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Same professional service and verified vehicles at lower prices
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                <Link to="/empty-legs">
                  <MapPin className="w-5 h-5 mr-2" />
                  Browse Empty Legs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bid Request Section */}
      <section className="bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary">
                <Gavel className="w-3 h-3 mr-1" />
                For Clients
              </Badge>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Request for Bids
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Post your trip requirements and let drivers compete with their best offers. Get the best value for your journey.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Gavel className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Post Your Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Describe your trip needs, dates, and preferences
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Compare Offers</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Review competitive bids from qualified drivers and owners
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Choose the Best</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Select the offer that matches your budget and requirements
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button asChild size="lg">
                <Link to="/client/create-bid-request">
                  <Gavel className="w-5 h-5 mr-2" />
                  Request Bids for Your Trip
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blogs Section */}
      <section className="bg-background pb-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-2">
                Latest from Our Blog
              </h2>
              <p className="text-lg text-muted-foreground">
                Expert insights and safari travel guides
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/blog">
                View All Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post, index) => (
              <Card 
                key={index}
                className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary">
                    {post.category}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{post.date}</span>
                    <Button variant="ghost" size="sm" className="group-hover:text-primary">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="text-xl font-bold mb-4">Safari Hire</h3>
              <p className="text-muted-foreground mb-4">
                Kenya's premier platform for safari vehicle hire, connecting clients with verified owners and professional drivers.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/vehicles" className="text-muted-foreground hover:text-primary transition-colors">
                    Browse Vehicles
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                    List Your Vehicle
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                    Become a Driver
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Safety Guidelines
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a href="mailto:info@safarihire.co.ke" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      info@safarihire.co.ke
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a href="tel:+254700000000" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      +254 700 000 000
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2024 Safari Hire. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
