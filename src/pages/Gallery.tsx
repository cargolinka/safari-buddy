import Header from "@/components/Header";
import { Card } from "@/components/ui/card";

const Gallery = () => {
  // Placeholder images - in production these would come from a database
  const images = Array(12).fill(null).map((_, i) => ({
    id: i + 1,
    title: `Safari Experience ${i + 1}`,
    category: i % 3 === 0 ? "Vehicles" : i % 3 === 1 ? "Destinations" : "Adventures",
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">Gallery</h1>
            <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
              Explore our collection of safari vehicles and memorable adventures
            </p>
          </div>
        </section>

        <section className="py-16 container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden group cursor-pointer">
                <div className="relative aspect-[4/3] bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{image.category}</p>
                      <p className="font-medium">{image.title}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Gallery;
