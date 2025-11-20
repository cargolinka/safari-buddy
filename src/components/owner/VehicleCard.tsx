import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Car, Users, Calendar, AlertTriangle, CheckCircle } from "lucide-react";

interface VehicleCardProps {
  vehicle: any;
  onUpdate: () => void;
}

export default function VehicleCard({ vehicle, onUpdate }: VehicleCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "default";
      case "booked":
        return "secondary";
      case "maintenance":
        return "outline";
      case "unavailable":
        return "destructive";
      default:
        return "default";
    }
  };

  const isExpiringSoon = (date: string) => {
    const expiry = new Date(date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 14 && daysUntilExpiry >= 0;
  };

  const hasExpired = (date: string) => {
    return new Date(date) < new Date();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl">{vehicle.model}</CardTitle>
          <Badge variant={getStatusColor(vehicle.status)}>
            {vehicle.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Car className="h-4 w-4" />
          <span>{vehicle.type}</span>
          <Users className="h-4 w-4 ml-2" />
          <span>{vehicle.capacity} seats</span>
        </div>
      </CardHeader>

      <CardContent>
        {vehicle.image_url && (
          <div className="mb-4 rounded-md overflow-hidden">
            <img 
              src={vehicle.image_url} 
              alt={vehicle.model}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Daily Rate:</span>
            <span className="text-lg font-bold">KES {Number(vehicle.daily_rate).toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            {vehicle.is_compliant ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Compliant</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Non-Compliant</span>
              </>
            )}
          </div>

          {!vehicle.is_compliant && (
            <div className="space-y-1 text-xs text-muted-foreground">
              {hasExpired(vehicle.insurance_expiry) && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Insurance expired</span>
                </div>
              )}
              {hasExpired(vehicle.inspection_expiry) && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Inspection expired</span>
                </div>
              )}
              {hasExpired(vehicle.road_license_expiry) && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Road license expired</span>
                </div>
              )}
              {isExpiringSoon(vehicle.insurance_expiry) && !hasExpired(vehicle.insurance_expiry) && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Calendar className="h-3 w-3" />
                  <span>Insurance expires soon</span>
                </div>
              )}
              {isExpiringSoon(vehicle.inspection_expiry) && !hasExpired(vehicle.inspection_expiry) && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Calendar className="h-3 w-3" />
                  <span>Inspection expires soon</span>
                </div>
              )}
              {isExpiringSoon(vehicle.road_license_expiry) && !hasExpired(vehicle.road_license_expiry) && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Calendar className="h-3 w-3" />
                  <span>Road license expires soon</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => navigate(`/owner/vehicles/${vehicle.id}`)}
        >
          View Details
        </Button>
        <Button 
          className="flex-1"
          onClick={() => navigate(`/owner/vehicles/edit/${vehicle.id}`)}
        >
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}
