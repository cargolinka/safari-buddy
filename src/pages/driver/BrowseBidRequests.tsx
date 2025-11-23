import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

interface BidRequest {
  id: string;
  title: string;
  description: string;
  origin: string;
  destination: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string | null;
  return_time: string | null;
  passengers: number;
  vehicle_type: string | null;
  with_driver: boolean;
  budget_range_min: number | null;
  budget_range_max: number | null;
  created_at: string;
}

const BrowseBidRequests = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const { data: bidRequests, isLoading } = useQuery({
    queryKey: ["browse-bid-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_requests")
        .select("*")
        .eq("status", "open")
        .gte("pickup_date", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BidRequest[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Bid Requests</h1>
          <p className="text-muted-foreground text-lg">
            Find trip requests and submit competitive bids
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading requests...</div>
        ) : bidRequests && bidRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No Active Requests</h3>
              <p className="text-muted-foreground">
                Check back later for new bid requests from clients
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bidRequests?.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{request.title}</CardTitle>
                      <CardDescription className="text-base">
                        {request.description}
                      </CardDescription>
                    </div>
                    <Badge variant="default">Open for Bids</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{request.origin}</div>
                        <div className="text-xs text-muted-foreground">→ {request.destination}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(request.pickup_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">{request.pickup_time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{request.passengers} passengers</div>
                        <div className="text-xs text-muted-foreground">Capacity needed</div>
                      </div>
                    </div>
                    {request.vehicle_type && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {request.vehicle_type.replace("_", " ")}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {request.with_driver && (
                    <Badge variant="secondary" className="mb-4">
                      Driver Required
                    </Badge>
                  )}

                  {request.budget_range_min && request.budget_range_max && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg mb-4">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        Client Budget: KES {request.budget_range_min.toLocaleString()} - {request.budget_range_max.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {request.return_date && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Return: {new Date(request.return_date).toLocaleDateString()} {request.return_time || ""}
                    </p>
                  )}

                  <Button
                    onClick={() => navigate(`/driver/submit-bid/${request.id}`)}
                    className="w-full md:w-auto"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Bid
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrowseBidRequests;
