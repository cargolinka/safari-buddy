import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, DollarSign, User, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface Bid {
  id: string;
  bid_amount: number;
  message: string | null;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  };
  vehicles: {
    model: string;
    type: string;
    registration_number: string | null;
  } | null;
}

const ViewBids = () => {
  const { requestId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: request } = useQuery({
    queryKey: ["bid-request-details", requestId],
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

  const { data: bids, isLoading } = useQuery({
    queryKey: ["request-bids", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select(`
          *,
          vehicles(model, type, registration_number)
        `)
        .eq("bid_request_id", requestId)
        .order("bid_amount", { ascending: true });

      if (error) throw error;
      
      // Fetch profiles separately
      if (data && data.length > 0) {
        const bidderIds = [...new Set(data.map(bid => bid.bidder_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", bidderIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        return data.map(bid => ({
          ...bid,
          profiles: profilesMap.get(bid.bidder_id) || { full_name: "Unknown", email: "", phone: null }
        })) as Bid[];
      }
      
      return [];
    },
  });

  const updateBidMutation = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: string; status: string }) => {
      const { error } = await supabase
        .from("bids")
        .update({ status })
        .eq("id", bidId);

      if (error) throw error;

      // If accepting, update request status
      if (status === "accepted") {
        const { error: reqError } = await supabase
          .from("bid_requests")
          .update({ status: "awarded" })
          .eq("id", requestId);

        if (reqError) throw reqError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["request-bids", requestId] });
      queryClient.invalidateQueries({ queryKey: ["bid-request-details", requestId] });
      toast({
        title: variables.status === "accepted" ? "Bid Accepted" : "Bid Rejected",
        description: variables.status === "accepted"
          ? "The bidder will be notified. Please coordinate pickup details."
          : "The bidder has been notified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
      withdrawn: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {request && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{request.title}</CardTitle>
                    <CardDescription className="text-base">{request.description}</CardDescription>
                  </div>
                  <Badge variant={request.status === "open" ? "default" : "secondary"}>
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Route:</span>
                    <p className="font-medium">{request.origin} → {request.destination}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-medium">
                      {new Date(request.pickup_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Passengers:</span>
                    <p className="font-medium">{request.passengers}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Bids:</span>
                    <p className="font-medium">{bids?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Received Bids</h2>
            <p className="text-muted-foreground">
              Review and compare bids from drivers and vehicle owners
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading bids...</div>
          ) : bids && bids.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">No Bids Yet</h3>
                <p className="text-muted-foreground">
                  Bids will appear here as drivers and owners respond to your request
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bids?.map((bid) => (
                <Card key={bid.id} className={bid.status === "accepted" ? "border-green-500 border-2" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <CardTitle className="text-xl">{bid.profiles.full_name}</CardTitle>
                          {getStatusBadge(bid.status)}
                        </div>
                        <CardDescription>
                          {bid.profiles.email}
                          {bid.profiles.phone && ` • ${bid.profiles.phone}`}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                          <DollarSign className="w-6 h-6" />
                          KES {bid.bid_amount.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Bid Amount</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bid.vehicles && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {bid.vehicles.model} ({bid.vehicles.type})
                          {bid.vehicles.registration_number && ` - ${bid.vehicles.registration_number}`}
                        </span>
                      </div>
                    )}

                    {bid.message && (
                      <div className="mb-4 p-4 border rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{bid.message}</p>
                      </div>
                    )}

                    {bid.status === "pending" && request?.status === "open" && (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          onClick={() => updateBidMutation.mutate({ bidId: bid.id, status: "accepted" })}
                          disabled={updateBidMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Bid
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateBidMutation.mutate({ bidId: bid.id, status: "rejected" })}
                          disabled={updateBidMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {bid.status === "accepted" && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          ✓ You accepted this bid. Please coordinate with the bidder for trip details.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewBids;
