import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ComplianceItem {
  id: string;
  entity_type: string;
  entity_id: string;
  document_type: string;
  expiry_date: string;
  daysUntilExpiry: number;
  ownerName?: string;
  ownerEmail?: string;
}

const ComplianceMonitoring = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [expired, setExpired] = useState<ComplianceItem[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<ComplianceItem[]>([]);
  const [compliant, setCompliant] = useState<ComplianceItem[]>([]);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const fourteenDaysFromNow = new Date(today);
      fourteenDaysFromNow.setDate(today.getDate() + 14);

      // Fetch all documents
      const { data: documents, error } = await supabase
        .from("documents")
        .select("*")
        .order("expiry_date", { ascending: true });

      if (error) throw error;

      const expiredList: ComplianceItem[] = [];
      const expiringSoonList: ComplianceItem[] = [];
      const compliantList: ComplianceItem[] = [];

      for (const doc of documents || []) {
        const expiryDate = new Date(doc.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let ownerName = "";
        let ownerEmail = "";

        // Fetch owner info
        if (doc.entity_type === "vehicle") {
          const { data: vehicle } = await supabase
            .from("vehicles")
            .select("owner_id, model")
            .eq("id", doc.entity_id)
            .single();

          if (vehicle) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", vehicle.owner_id)
              .single();

            ownerName = `${profile?.full_name || "Owner"} (${vehicle.model})`;
          }
        } else if (doc.entity_type === "driver") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", doc.entity_id)
            .single();

          ownerName = profile?.full_name || "Driver";
        }

        const item: ComplianceItem = {
          ...doc,
          daysUntilExpiry,
          ownerName,
          ownerEmail,
        };

        if (daysUntilExpiry < 0) {
          expiredList.push(item);
        } else if (daysUntilExpiry <= 14) {
          expiringSoonList.push(item);
        } else {
          compliantList.push(item);
        }
      }

      setExpired(expiredList);
      setExpiringSoon(expiringSoonList);
      setCompliant(compliantList);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runComplianceCheck = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-compliance-alerts");

      if (error) throw error;

      toast({
        title: "Compliance Check Complete",
        description: `Checked ${data.documentsChecked} documents, sent ${data.alertsSent} alerts`,
      });

      await fetchComplianceData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const renderDocumentList = (items: ComplianceItem[], type: "expired" | "expiring" | "compliant") => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No {type === "expired" ? "expired" : type === "expiring" ? "expiring" : "other"} documents
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {type === "expired" && <AlertCircle className="h-4 w-4 text-destructive" />}
                    {type === "expiring" && <Clock className="h-4 w-4 text-warning" />}
                    {type === "compliant" && <CheckCircle className="h-4 w-4 text-success" />}
                    <h4 className="font-medium">{item.ownerName}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Document Type:</span>
                      <p className="font-medium capitalize">{item.document_type.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Entity Type:</span>
                      <p className="font-medium capitalize">{item.entity_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expiry Date:</span>
                      <p className="font-medium">{new Date(item.expiry_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Days Until Expiry:</span>
                      <p className={`font-medium ${
                        item.daysUntilExpiry < 0 ? "text-destructive" :
                        item.daysUntilExpiry <= 3 ? "text-warning" :
                        "text-foreground"
                      }`}>
                        {item.daysUntilExpiry < 0 ? `Expired ${Math.abs(item.daysUntilExpiry)} days ago` : `${item.daysUntilExpiry} days`}
                      </p>
                    </div>
                  </div>
                </div>
                <Badge variant={
                  type === "expired" ? "destructive" :
                  type === "expiring" ? "default" :
                  "secondary"
                }>
                  {type === "expired" ? "Expired" : type === "expiring" ? "Expiring Soon" : "Compliant"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading compliance data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Compliance Monitoring</h2>
          <p className="text-muted-foreground">Track document expiry and compliance status</p>
        </div>
        <Button onClick={runComplianceCheck} disabled={checking}>
          <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking..." : "Run Compliance Check"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expired Documents</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{expired.length}</div>
            <p className="text-xs text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{expiringSoon.length}</div>
            <p className="text-xs text-muted-foreground">Within 14 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{compliant.length}</div>
            <p className="text-xs text-muted-foreground">All good</p>
          </CardContent>
        </Card>
      </div>

      {/* Document Lists */}
      <Tabs defaultValue="expired" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expired">
            Expired ({expired.length})
          </TabsTrigger>
          <TabsTrigger value="expiring">
            Expiring Soon ({expiringSoon.length})
          </TabsTrigger>
          <TabsTrigger value="compliant">
            Compliant ({compliant.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>Expired Documents</CardTitle>
              <CardDescription>Documents that have already expired and need immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {renderDocumentList(expired, "expired")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Soon</CardTitle>
              <CardDescription>Documents expiring within the next 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              {renderDocumentList(expiringSoon, "expiring")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliant">
          <Card>
            <CardHeader>
              <CardTitle>Compliant Documents</CardTitle>
              <CardDescription>Documents with more than 14 days until expiry</CardDescription>
            </CardHeader>
            <CardContent>
              {renderDocumentList(compliant, "compliant")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceMonitoring;
