import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PendingDriverApprovals } from "@/components/admin/PendingDriverApprovals";
import { PendingCompanyApprovals } from "@/components/admin/PendingCompanyApprovals";
import { ClipboardCheck } from "lucide-react";

export default function PendingApprovals() {
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);

      // Fetch pending drivers (those not yet compliant)
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .or('is_compliant.is.null,is_compliant.eq.false')
        .eq('status', 'unavailable');

      if (driversError) throw driversError;

      // Fetch profiles for these drivers
      let driversWithProfiles: any[] = [];
      if (driversData && driversData.length > 0) {
        const driverIds = driversData.map(d => d.id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', driverIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        driversWithProfiles = driversData.map(driver => ({
          ...driver,
          profiles: profilesMap.get(driver.id) || { full_name: 'Unknown', phone: null }
        }));
      }

      // Fetch pending companies (with unverified documents)
      const { data: companiesData, error: companiesError } = await supabase
        .from('profiles')
        .select(`
          *,
          company_directors (*),
          company_documents (*)
        `)
        .eq('entity_type', 'company')
        .not('company_documents', 'is', null);

      if (companiesError) throw companiesError;

      // Filter companies with unverified documents
      const pendingCompaniesFiltered = companiesData?.filter(company => 
        company.company_documents?.some((doc: any) => !doc.verified_by_admin)
      ) || [];

      setPendingDrivers(driversWithProfiles);
      setPendingCompanies(pendingCompaniesFiltered);
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

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const totalPending = pendingDrivers.length + pendingCompanies.length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Pending Approvals</h1>
          {totalPending > 0 && (
            <Badge variant="destructive" className="text-sm">
              {totalPending} pending
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Review and approve driver registrations and company documents
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading pending approvals...</p>
          </CardContent>
        </Card>
      ) : totalPending === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No pending approvals at this time
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="drivers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="drivers" className="relative">
              Driver Registrations
              {pendingDrivers.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingDrivers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="companies" className="relative">
              Company Documents
              {pendingCompanies.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingCompanies.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Driver Registration Reviews</CardTitle>
                <CardDescription>
                  Review driver details, documents, and approve or reject applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingDriverApprovals 
                  drivers={pendingDrivers}
                  onUpdate={fetchPendingApprovals}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Document Verification</CardTitle>
                <CardDescription>
                  Verify company registration documents, PIN, and director information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingCompanyApprovals 
                  companies={pendingCompanies}
                  onUpdate={fetchPendingApprovals}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
