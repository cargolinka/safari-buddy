import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Car, Database } from "lucide-react";

const CreateTestData = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateTestData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-data');
      
      if (error) throw error;

      toast({
        title: "Success!",
        description: `Created ${data.users_created} test users and ${data.vehicles_created} vehicles`,
      });
    } catch (error: any) {
      console.error('Error creating test data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create test data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Test Data Generator</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Generate Test Data
          </CardTitle>
          <CardDescription>
            Create test users, drivers, fleet owners, and vehicles for development and testing purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-4 w-4" />
                  Users (9 total)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold">Fleet Owners (3):</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Safari Adventures Ltd (Company)</li>
                    <li>James Kamau (Individual)</li>
                    <li>Expeditions Africa (Company)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">Drivers (4):</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>John Kariuki</li>
                    <li>Mary Wanjiru</li>
                    <li>Peter Omondi</li>
                    <li>Grace Akinyi</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">Driver-Owners (2):</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>David Mwangi</li>
                    <li>Sarah Njeri</li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Password for all test accounts: <code className="bg-muted px-1 rounded">Test123!@#</code>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="h-4 w-4" />
                  Vehicles (12 total)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>4 Land Cruisers (various models)</li>
                  <li>3 Tour Vans (14-28 capacity)</li>
                  <li>2 Buses (25-45 seater)</li>
                  <li>3 Other vehicles (SUVs, Saloons)</li>
                </ul>
                <div className="mt-4 space-y-1">
                  <p className="font-semibold">Features:</p>
                  <ul className="list-disc list-inside text-muted-foreground text-xs">
                    <li>Realistic registration numbers</li>
                    <li>Valid compliance documents</li>
                    <li>Mix of statuses (available, booked, maintenance)</li>
                    <li>Daily rates: KES 9,000 - 20,000</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This will create real user accounts with authentication. 
              All test accounts will have verified emails and compliant documents with future expiry dates.
              The data can be used immediately for testing bookings, bids, and other features.
            </p>
          </div>

          <Button 
            onClick={handleCreateTestData} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Test Data...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Generate Test Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTestData;
