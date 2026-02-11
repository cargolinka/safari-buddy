

## Plan: Replicate Home Page Layout in New Project

### Overview
Copy and configure the home page layout from safari-buddy.lovable.app to your new project, including all components, styling, and database connections.

### Phase 1: Copy Core Layout Files

**Files to copy:**
- `src/pages/Index.tsx` - Main home page (797 lines)
- `src/components/Header.tsx` - Navigation header
- `src/components/Footer.tsx` - Footer with newsletter
- `src/components/NavLink.tsx` - Active-state navigation links

### Phase 2: Copy Required UI Components

Copy the following shadcn/ui components from `src/components/ui/`:
- `card.tsx`, `badge.tsx`, `button.tsx`
- `input.tsx`, `select.tsx`
- `carousel.tsx` (requires embla-carousel-react)
- `sheet.tsx` (for mobile menu)
- `toast.tsx`, `toaster.tsx`, `use-toast.ts`

### Phase 3: Copy Asset Files

**Images to copy:**
- `src/assets/hero-safari.jpg`
- `src/assets/hero-safari-2.jpg`
- `src/assets/hero-safari-3.jpg`
- `public/favicon.jpg`

### Phase 4: Configure Database Tables

Create these tables in your new project's backend:

1. **hero_slides** - Carousel content
   - `id`, `title`, `subtitle`, `description`, `image_url`
   - `image_position_x`, `image_position_y` (for focal point)
   - `button_text`, `button_link`, `display_order`, `is_active`

2. **vehicle_categories** - Category browsing
   - `id`, `name`, `slug`, `description`, `image_url`, `is_active`

3. **vehicle_subcategories** - Search filters
   - `id`, `category_id`, `name`, `slug`

4. **vehicles** - Featured vehicles display
   - `id`, `model`, `daily_rate`, `capacity`, `status`
   - `subcategory_id`, `image_url`, `image_urls`, `is_compliant`

5. **blog_posts** + **blog_categories** - Blog section

6. **newsletter_subscriptions** - Footer newsletter

### Phase 5: Update Routing

In `src/App.tsx`, ensure these routes exist:
```tsx
<Route path="/" element={<Index />} />
<Route path="/safari-vehicles" element={<Vehicles />} />
<Route path="/safari-vehicles/:id" element={<PublicVehicleDetails />} />
<Route path="/empty-legs" element={<BrowseEmptyLegs />} />
<Route path="/about" element={<About />} />
<Route path="/why-us" element={<WhyUs />} />
<Route path="/safari-hire-gallery" element={<Gallery />} />
<Route path="/safari-hire-blog" element={<Blog />} />
<Route path="/safari-hire-blog/:slug" element={<BlogPost />} />
<Route path="/contact" element={<Contact />} />
<Route path="/auth" element={<Auth />} />
```

### Phase 6: Install Required Dependencies

Ensure these packages are installed:
```json
{
  "embla-carousel-react": "^8.6.0",
  "lucide-react": "^0.462.0",
  "@radix-ui/react-select": "^2.2.5",
  "@radix-ui/react-dialog": "^1.1.14"
}
```

### Phase 7: Apply Styling

Copy these style configurations:
- `src/index.css` - Base styles and design system
- `tailwind.config.ts` - Theme colors and animations
- Ensure color variables match (primary, secondary, accent, etc.)

### Phase 8: Verify Database Queries

The home page fetches data from:
1. `hero_slides` - Active slides ordered by display_order
2. `vehicle_categories` - Active categories with vehicle counts
3. `vehicle_subcategories` - All subcategories
4. `vehicles` - Available, compliant vehicles (limit 8)
5. `blog_posts` - Published posts (limit 3)

### Key Layout Specifications

| Section | Background | Grid | Height |
|---------|------------|------|--------|
| Hero Carousel | Image + gradient | Full width | 70vh |
| Search Bar | Card overlay | Flex wrap | Auto |
| Features | bg-secondary | 4 columns | Auto |
| Categories | bg-background | 4 columns | Auto |
| Featured | bg-secondary | 4 columns | Auto |
| Empty Legs | Gradient | 3 columns | Auto |
| Bid Request | bg-background | 3 columns | Auto |
| Blog | bg-background | 3 columns | Auto |

### Outcome
Your new project will have an identical home page layout with:
- Dynamic hero carousel from database
- Vehicle search with category/subcategory filters
- Category browsing gallery
- Featured vehicles grid
- Empty legs promotions
- Bid request CTA
- Latest blog posts
- Newsletter subscription

