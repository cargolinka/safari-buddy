import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface UserRole {
  role: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch all user roles
      const { data: rolesData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error fetching user roles:", error);
        toast({
          title: "Error",
          description: "Failed to load user roles. Please try logging in again.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      if (rolesData && rolesData.length > 0) {
        // Get primary role (admin > driver > owner > client)
        const roles = rolesData.map(r => r.role);
        let primaryRole = roles[0];
        
        if (roles.includes('admin')) primaryRole = 'admin';
        else if (roles.includes('driver')) primaryRole = 'driver';
        else if (roles.includes('owner')) primaryRole = 'owner';
        else if (roles.includes('client_corporate')) primaryRole = 'client_corporate';
        else if (roles.includes('client_individual')) primaryRole = 'client_individual';
        
        setUserRole(primaryRole);
        
        // Redirect to role-specific dashboards
        if (primaryRole === 'admin') {
          navigate('/admin');
          return;
        } else if (primaryRole === 'owner') {
          navigate('/owner/dashboard');
          return;
        } else if (primaryRole === 'driver') {
          navigate('/driver/dashboard');
          return;
        }
      }

      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Safari Hire Platform</h1>
            {userRole && (
              <Badge className="mt-1 bg-primary text-primary-foreground">
                {userRole.replace("_", " ").toUpperCase()}
              </Badge>
            )}
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user?.user_metadata?.full_name || "User"}
          </h2>
          <p className="text-muted-foreground">
            Your {userRole?.replace("_", " ")} dashboard
          </p>
        </div>

        {/* Role-specific content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userRole === "owner" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>My Vehicles</CardTitle>
                  <CardDescription>Manage your fleet</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    List and manage your safari vehicles
                  </p>
                  <Button className="w-full">Add Vehicle</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bookings</CardTitle>
                  <CardDescription>View booking requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track and manage bookings for your vehicles
                  </p>
                  <Button className="w-full" variant="outline">View Bookings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance</CardTitle>
                  <CardDescription>Document status</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track insurance, inspection, and licenses
                  </p>
                  <Button className="w-full" variant="outline">View Status</Button>
                </CardContent>
              </Card>
            </>
          )}

          {userRole === "driver" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>My Trips</CardTitle>
                  <CardDescription>Assigned bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage your assigned trips
                  </p>
                  <Button className="w-full">View Trips</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Profile</CardTitle>
                  <CardDescription>License & verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update your driver profile and documents
                  </p>
                  <Button className="w-full" variant="outline">Edit Profile</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Earnings</CardTitle>
                  <CardDescription>Track your income</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View trip history and earnings
                  </p>
                  <Button className="w-full" variant="outline">View Earnings</Button>
                </CardContent>
              </Card>
            </>
          )}

          {(userRole === "client_individual" || userRole === "client_corporate") && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Browse Vehicles</CardTitle>
                  <CardDescription>Find your perfect ride</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Search and book safari vehicles
                  </p>
                  <Button className="w-full">Browse Now</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Bookings</CardTitle>
                  <CardDescription>Track your reservations</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View active and past bookings
                  </p>
                  <Button className="w-full" variant="outline">View Bookings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>Invoices & receipts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download invoices and view payment history
                  </p>
                  <Button className="w-full" variant="outline">View History</Button>
                </CardContent>
              </Card>
            </>
          )}

          {userRole === "admin" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage all users</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View and manage drivers, owners, and clients
                  </p>
                  <Button className="w-full">Manage Users</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Approvals</CardTitle>
                  <CardDescription>Review vehicle listings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Approve or reject new vehicle listings
                  </p>
                  <Button className="w-full" variant="outline">Review Queue</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Alerts</CardTitle>
                  <CardDescription>System notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View expired licenses and documents
                  </p>
                  <Button className="w-full" variant="outline">View Alerts</Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
