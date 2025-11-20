import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">About SafariHire</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Your trusted partner for safari vehicle rentals across East Africa
            </p>
          </div>
        </section>

        <section className="py-16 container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Founded with a passion for adventure and exploration, SafariHire has been connecting travelers with the perfect safari vehicles for over a decade. We understand that every journey is unique, and we're committed to providing reliable, well-maintained vehicles that make your safari experience unforgettable.
              </p>
              <p className="text-muted-foreground">
                Our platform brings together trusted vehicle owners and professional drivers, ensuring that every rental meets the highest standards of safety, comfort, and compliance.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">500+</div>
                  <p className="text-sm text-muted-foreground">Vehicles</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">1000+</div>
                  <p className="text-sm text-muted-foreground">Happy Clients</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">50+</div>
                  <p className="text-sm text-muted-foreground">Destinations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-sm text-muted-foreground">Support</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
