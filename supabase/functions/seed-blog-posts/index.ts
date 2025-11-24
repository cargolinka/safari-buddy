import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get categories
    const { data: categories } = await supabaseClient
      .from('blog_categories')
      .select('*');

    if (!categories || categories.length === 0) {
      throw new Error('No categories found');
    }

    // Get admin user
    const { data: adminProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!adminProfile) {
      throw new Error('No admin profile found');
    }

    const blogPosts = [
      {
        title: 'Top 10 Safari Destinations in Kenya',
        slug: 'top-10-safari-destinations-kenya',
        excerpt: 'Discover the most breathtaking safari destinations that Kenya has to offer, from the Masai Mara to Amboseli National Park.',
        content: `Kenya is home to some of the most spectacular wildlife viewing opportunities in the world. The country's diverse landscapes support an incredible variety of animals and provide unforgettable experiences for safari enthusiasts.

1. Masai Mara National Reserve
The Masai Mara is perhaps Kenya's most famous safari destination, known for the annual wildebeest migration. Over 1.5 million wildebeest, zebras, and gazelles cross the Mara River between July and October, creating one of nature's most spectacular events.

2. Amboseli National Park
Famous for its large elephant herds and stunning views of Mount Kilimanjaro, Amboseli offers excellent wildlife viewing opportunities year-round. The park's varied habitats support diverse wildlife including lions, cheetahs, and hundreds of bird species.

3. Tsavo National Parks
Divided into Tsavo East and Tsavo West, this is one of the world's largest wildlife sanctuaries. Known for its red elephants (colored by the red dust), the park offers a more remote and rugged safari experience.

4. Lake Nakuru National Park
A birdwatcher's paradise, Lake Nakuru is famous for its flamingos and other water birds. The park also hosts black and white rhinos, making it an excellent destination for endangered species viewing.

5. Samburu National Reserve
Located in Kenya's arid north, Samburu offers unique wildlife not found elsewhere, including the Grevy's zebra, reticulated giraffe, and the beisa oryx. The landscape is dramatically different from the Mara, with rugged terrain and the Ewaso Ng'iro River.

The remaining destinations include Laikipia Plateau, Ol Pejeta Conservancy, Nairobi National Park, Meru National Park, and Hell's Gate National Park, each offering unique experiences and wildlife viewing opportunities.`,
        category_id: categories.find(c => c.slug === 'destination-spotlights')?.id || categories[0].id,
        tags: ['Kenya', 'Wildlife', 'National Parks', 'Safari Planning'],
        featured_image_url: '/placeholder.svg',
        is_published: true,
        published_at: new Date('2024-03-15').toISOString(),
        reading_time: 8,
        author_id: adminProfile.id,
      },
      {
        title: 'Choosing the Right Vehicle for Your Safari',
        slug: 'choosing-right-vehicle-safari',
        excerpt: 'Learn how to select the perfect safari vehicle based on your group size, destination, and adventure preferences.',
        content: `Selecting the right safari vehicle is crucial for ensuring a comfortable and successful wildlife viewing experience. Your choice will depend on several factors including group size, terrain, season, and budget.

Vehicle Types:

1. 4x4 Safari Land Cruiser
The most popular choice for safaris, the Toyota Land Cruiser is reliable, spacious, and can handle rough terrain. With pop-up roofs for excellent game viewing, these vehicles typically accommodate 6-7 passengers.

2. Safari Van/Minibus
More economical for larger groups, safari vans offer good visibility but may have limited off-road capability. Best suited for established parks with good road networks.

3. Open-Sided Game Drive Vehicles
Used in private conservancies and for game drives within lodges, these vehicles offer unobstructed views and excellent photography opportunities but are not suitable for long-distance travel.

Key Considerations:

- Group Size: Ensure adequate space for all passengers
- Photography: Look for vehicles with charging ports and stable platforms
- Terrain: Match vehicle capability to your destinations
- Season: Consider weather conditions and road accessibility
- Comfort: Long game drives require comfortable seating and good suspension

Additional Features to Look For:
- Pop-up or removable roof for standing
- Binoculars and guide books
- Cooler for refreshments
- First aid kit and emergency equipment
- Communication equipment (radio/satellite phone)`,
        category_id: categories.find(c => c.slug === 'vehicle-guide')?.id || categories[0].id,
        tags: ['Safari Vehicles', 'Planning', 'Equipment'],
        featured_image_url: '/placeholder.svg',
        is_published: true,
        published_at: new Date('2024-03-10').toISOString(),
        reading_time: 6,
        author_id: adminProfile.id,
      },
      {
        title: 'Best Time to Visit East African National Parks',
        slug: 'best-time-visit-east-africa',
        excerpt: 'A comprehensive guide to planning your safari around the best weather and wildlife viewing seasons.',
        content: `Timing your safari correctly can make the difference between a good trip and an extraordinary one. East Africa's wildlife viewing opportunities vary throughout the year, influenced by rainfall patterns and animal migrations.

General Seasons:

Dry Season (June to October):
This is peak safari season in most East African parks. Vegetation is sparse, making wildlife easier to spot as animals congregate around water sources. Roads are more accessible, and mosquitoes are less prevalent.

Wet Season (November to May):
Often called the "green season," this period offers its own advantages. Landscapes are lush and beautiful, bird watching is exceptional, and lodges offer lower rates. However, some roads may be impassable, and wildlife is more dispersed.

Regional Variations:

Kenya's Masai Mara:
- July-October: Peak migration viewing
- December-March: Excellent general game viewing
- April-May: Heavy rains, some camps close

Tanzania's Serengeti:
- December-March: Southern plains calving season
- June-July: Western corridor river crossings
- August-October: Northern Serengeti migration

Uganda/Rwanda:
- June-September: Best for gorilla trekking
- December-February: Alternative dry season

Specialized Viewing:

Bird Watching: November-April when European migrants are present
Baby Animals: December-March during calving season
Predator Action: Dry season when prey is concentrated
Photography: Early dry season for best light and conditions

Consider booking well in advance for peak season (especially migration viewing) as camps and lodges fill up quickly.`,
        category_id: categories.find(c => c.slug === 'safari-planning')?.id || categories[0].id,
        tags: ['Planning', 'Seasons', 'Weather', 'Migration'],
        featured_image_url: '/placeholder.svg',
        is_published: true,
        published_at: new Date('2024-03-05').toISOString(),
        reading_time: 7,
        author_id: adminProfile.id,
      },
      {
        title: 'Wildlife Photography Tips for Safari Enthusiasts',
        slug: 'wildlife-photography-tips',
        excerpt: 'Essential photography techniques and equipment recommendations for capturing stunning wildlife moments.',
        content: `Capturing the magic of African wildlife requires both technical skill and an understanding of animal behavior. Here's a comprehensive guide to help you take your safari photography to the next level.

Essential Equipment:

Camera Body:
While professional DSLRs and mirrorless cameras offer the best results, modern smartphones can capture impressive images. Key features to look for:
- Fast autofocus
- Good high ISO performance
- Weather sealing
- Burst mode capability

Lenses:
- 70-200mm: Versatile for general wildlife
- 100-400mm or 150-600mm: Ideal for distant subjects
- Wide angle (16-35mm): For landscapes and context shots

Accessories:
- Beanbag for vehicle support
- Extra batteries and memory cards
- Lens cleaning kit
- Polarizing filter

Camera Settings:

Shutter Speed:
Use at least 1/1000s for action shots, faster for birds in flight. Enable your camera's sports or continuous autofocus mode.

Aperture:
f/5.6-f/8 provides good depth of field while maintaining sharpness. Use wider apertures (f/2.8-f/4) for portraits with blurred backgrounds.

ISO:
Start at ISO 400-800, adjusting as needed. Modern cameras handle high ISOs well, so don't be afraid to increase if necessary.

Composition Techniques:

1. Rule of Thirds: Place subjects off-center for more dynamic images
2. Eye Contact: Focus on the animal's eyes
3. Fill the Frame: Get close (safely) or zoom in
4. Action Shots: Anticipate behavior and be ready
5. Context: Include habitat to tell a story
6. Golden Hours: Shoot during early morning and late afternoon
7. Patience: Wait for the right moment

Ethical Considerations:
- Never disturb animals for a photo
- Respect park rules and distances
- Support conservation through responsible tourism
- Share images to promote wildlife protection

Post-Processing:
Basic edits can enhance your images:
- Adjust exposure and contrast
- Enhance colors naturally
- Crop for better composition
- Sharpen appropriately
- Remove distractions carefully`,
        category_id: categories.find(c => c.slug === 'photography')?.id || categories[0].id,
        tags: ['Photography', 'Equipment', 'Techniques', 'Wildlife'],
        featured_image_url: '/placeholder.svg',
        is_published: true,
        published_at: new Date('2024-02-28').toISOString(),
        reading_time: 10,
        author_id: adminProfile.id,
      },
    ];

    const { data: insertedPosts, error } = await supabaseClient
      .from('blog_posts')
      .insert(blogPosts)
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully created ${insertedPosts.length} blog posts`,
        posts: insertedPosts 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
