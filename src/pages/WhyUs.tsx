import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, Award, Users, Wrench, MapPin } from "lucide-react";

const WhyUs = () => {
  const features = [
    {
      icon: Shield,
      title: "Fully Compliant Vehicles",
      description: "All vehicles meet strict compliance standards with valid insurance, inspection certificates, and road licenses.",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Round-the-clock customer support to ensure your safari experience is smooth and worry-free.",
    },
    {
      icon: Award,
      title: "Verified Drivers",
      description: "All drivers are professionally licensed and NTSA-verified for your safety and peace of mind.",
    },
    {
      icon: Users,
      title: "Flexible Options",
      description: "Choose to drive yourself or hire a professional driver - we accommodate all preferences.",
    },
    {
      icon: Wrench,
      title: "Well-Maintained Fleet",
      description: "Regular maintenance and inspections ensure every vehicle is in top condition for your journey.",
    },
    {
      icon: MapPin,
      title: "Wide Coverage",
      description: "Access to safari destinations across East Africa with local expertise and support.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Why Choose SafariHire?</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Experience the difference of working with East Africa's most trusted safari vehicle rental platform
            </p>
          </div>
        </section>

        <section className="py-16 container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default WhyUs;
