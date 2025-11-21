import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, ExternalLink } from "lucide-react";

interface Company {
  id: string;
  company_name: string;
  company_registration_number: string;
  company_pin: string;
  full_name: string;
  phone: string;
  directors: Array<{
    full_name: string;
    id_number: string;
    position: string;
  }>;
  documents: Array<{
    document_type: string;
    file_path: string;
    verified_by_admin: boolean;
  }>;
}

interface PendingCompanyApprovalsProps {
  companies: Company[];
  onUpdate: () => void;
}

export const PendingCompanyApprovals = ({ companies, onUpdate }: PendingCompanyApprovalsProps) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const handleVerify = async (companyId: string) => {
    setProcessing(companyId);
    try {
      const { error } = await supabase
        .from('company_documents')
        .update({
          verified_by_admin: true,
          verified_at: new Date().toISOString()
        })
        .eq('company_id', companyId);

      if (error) throw error;

      toast.success("Company verified successfully!");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to verify company");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (companyId: string) => {
    const reason = rejectReason[companyId];
    if (!reason) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(companyId);
    try {
      // TODO: Send rejection email with reason
      toast.success("Company rejected");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject company");
    } finally {
      setProcessing(null);
    }
  };

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No pending company approvals
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {companies.map((company) => (
        <Card key={company.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{company.company_name}</CardTitle>
                <CardDescription>
                  Reg: {company.company_registration_number} | PIN: {company.company_pin}
                </CardDescription>
              </div>
              <Badge variant="outline">Pending Verification</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Contact Person:</span>
                  <p className="font-medium">{company.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{company.phone}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Company Directors</h4>
              <div className="space-y-2">
                {company.directors.map((director, idx) => (
                  <div key={idx} className="text-sm border rounded p-2">
                    <span className="font-medium">{director.full_name}</span>
                    <span className="text-muted-foreground"> ({director.position})</span>
                    <span className="text-muted-foreground"> - ID: {director.id_number}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Documents</h4>
              <div className="space-y-2">
                {company.documents.map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border rounded p-2">
                    <span className="capitalize">
                      {doc.document_type.replace(/_/g, ' ')}
                    </span>
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Rejection Reason (if rejecting):
              </label>
              <Textarea
                placeholder="Provide reason for rejection..."
                value={rejectReason[company.id] || ''}
                onChange={(e) => setRejectReason({ ...rejectReason, [company.id]: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleVerify(company.id)}
                disabled={processing === company.id}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Verify
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReject(company.id)}
                disabled={processing === company.id}
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
