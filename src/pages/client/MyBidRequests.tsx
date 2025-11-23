import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, Users, DollarSign, Eye } from "lucide-react";
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
  passengers: number;
  status: string;
  budget_range_min: number | null;
  budget_range_max: number | null;
  created_at: string;
  bids: { count: number }[];
}

const MyBidRequests = () => {
  const navigate = useNavigate();

  const { data: bidRequests, isLoading } = useQuery({
    queryKey: ["my-bid-requests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bid_requests")
        .select(`
          *,
          bids(count)
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BidRequest[];
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: "default",
      closed: "secondary",
      awarded: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Bid Requests</h1>
            <p className="text-muted-foreground text-lg">
              Manage your trip requests and review bids
            </p>
          </div>
          <Button onClick={() => navigate("/client/create-bid-request")}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : bidRequests && bidRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No Bid Requests Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first bid request to receive competitive offers
              </p>
              <Button onClick={() => navigate("/client/create-bid-request")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Bid Request
              </Button>
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
                    <div className="flex gap-2">
                      {getStatusBadge(request.status)}
                      <Badge variant="outline">
                        {request.bids[0]?.count || 0} bids
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{request.origin}</div>
                        <div className="text-xs text-muted-foreground">Origin</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{request.destination}</div>
                        <div className="text-xs text-muted-foreground">Destination</div>
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
                        <div className="text-xs text-muted-foreground">Capacity</div>
                      </div>
                    </div>
                  </div>

                  {request.budget_range_min && request.budget_range_max && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Budget: KES {request.budget_range_min.toLocaleString()} - {request.budget_range_max.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => navigate(`/client/bid-request/${request.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Bids ({request.bids[0]?.count || 0})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBidRequests;
