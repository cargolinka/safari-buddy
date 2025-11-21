import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";

interface Invitation {
  id: string;
  fleet_owner_id: string;
  vehicle_id: string;
  status: string;
  permissions: any;
  invited_at: string;
  vehicles: {
    model: string;
    type: string;
  };
  profiles: {
    full_name: string;
    phone: string;
  };
}

export default function PendingInvitations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .from('driver_vehicle_assignments')
      .select(`
        id,
        fleet_owner_id,
        vehicle_id,
        status,
        permissions,
        invited_at,
        vehicles (model, type)
      `)
      .eq('driver_id', user.id)
      .eq('status', 'pending')
      .order('invited_at', { ascending: false });

    if (error || !data) {
      toast.error("Failed to fetch invitations");
      setLoading(false);
      return;
    }

    // Fetch owner profiles separately
    const ownerIds = [...new Set(data.map(inv => inv.fleet_owner_id))];
    const { data: ownerProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', ownerIds);

    const profileMap = new Map(ownerProfiles?.map(p => [p.id, p]) || []);

    const enrichedData = data.map(inv => ({
      ...inv,
      profiles: profileMap.get(inv.fleet_owner_id) || { full_name: 'Unknown', phone: '' }
    }));

    if (error) {
      toast.error("Failed to fetch invitations");
      setLoading(false);
      return;
    }

    setInvitations(enrichedData);
    setLoading(false);
  };

  const handleResponse = async (invitationId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('driver_vehicle_assignments')
        .update({
          status: accept ? 'active' : 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success(accept ? "Invitation accepted!" : "Invitation rejected");
      fetchInvitations();
    } catch (error: any) {
      toast.error(error.message || "Failed to respond to invitation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading invitations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/driver/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-2">Pending Invitations</h1>
        <p className="text-muted-foreground mb-6">
          Respond to invitations from fleet owners
        </p>

        {invitations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No pending invitations</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {invitation.vehicles.model}
                      </CardTitle>
                      <CardDescription>
                        From: {invitation.profiles.full_name}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{invitation.vehicles.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Granted Permissions:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {invitation.permissions.can_add_vehicles && (
                          <div className="text-sm text-muted-foreground">✓ Add vehicles</div>
                        )}
                        {invitation.permissions.can_edit_vehicles && (
                          <div className="text-sm text-muted-foreground">✓ Edit vehicles</div>
                        )}
                        {invitation.permissions.can_view_earnings && (
                          <div className="text-sm text-muted-foreground">✓ View earnings</div>
                        )}
                        {invitation.permissions.can_manage_drivers && (
                          <div className="text-sm text-muted-foreground">✓ Manage drivers</div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Invited: {new Date(invitation.invited_at).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleResponse(invitation.id, true)}
                        className="flex-1"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResponse(invitation.id, false)}
                        className="flex-1"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
