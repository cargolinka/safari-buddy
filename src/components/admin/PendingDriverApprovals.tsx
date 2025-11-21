import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, FileText } from "lucide-react";

interface Driver {
  id: string;
  license_number: string;
  license_expiry: string;
  id_number: string;
  status: string;
  profiles: {
    full_name: string;
    phone: string;
  };
}

interface PendingDriverApprovalsProps {
  drivers: Driver[];
  onUpdate: () => void;
}

export const PendingDriverApprovals = ({ drivers, onUpdate }: PendingDriverApprovalsProps) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const handleApprove = async (driverId: string) => {
    setProcessing(driverId);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: 'available' as any })
        .eq('id', driverId);

      if (error) throw error;

      toast.success("Driver approved successfully!");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve driver");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (driverId: string) => {
    const reason = rejectReason[driverId];
    if (!reason) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(driverId);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: 'unavailable' as any })
        .eq('id', driverId);

      if (error) throw error;

      // TODO: Send rejection email with reason

      toast.success("Driver rejected");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject driver");
    } finally {
      setProcessing(null);
    }
  };

  if (drivers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No pending driver approvals
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {drivers.map((driver) => (
        <Card key={driver.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{driver.profiles.full_name}</CardTitle>
                <CardDescription>
                  License: {driver.license_number} | ID: {driver.id_number}
                </CardDescription>
              </div>
              <Badge variant="outline">Pending Review</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{driver.profiles.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">License Expiry:</span>
                <p className="font-medium">
                  {new Date(driver.license_expiry).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Rejection Reason (if rejecting):
              </label>
              <Textarea
                placeholder="Provide reason for rejection..."
                value={rejectReason[driver.id] || ''}
                onChange={(e) => setRejectReason({ ...rejectReason, [driver.id]: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(driver.id)}
                disabled={processing === driver.id}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReject(driver.id)}
                disabled={processing === driver.id}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
