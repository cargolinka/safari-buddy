import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Users as Bus, Truck, Home } from "lucide-react";

const vehicleTypes = [
  { id: "land_cruiser", name: "Land Cruiser", icon: Car, description: "Robust 4x4 for safari adventures" },
  { id: "tour_van", name: "Tour Van", icon: Truck, description: "Spacious vans for group tours" },
  { id: "bus", name: "Bus", icon: Bus, description: "Large capacity for big groups" },
  { id: "saloon", name: "Saloon", icon: Home, description: "Comfortable sedans for city travel" },
];

const ManageCategories = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Vehicle Categories</h2>
        <p className="text-muted-foreground">Manage vehicle types and categories</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Vehicle Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicleTypes.map((type) => (
              <div key={type.id} className="p-4 border rounded-lg hover:border-primary transition-colors">
                <div className="flex items-start gap-3">
                  <type.icon className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{type.name}</h3>
                      <Badge variant="outline">{type.id}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageCategories;
