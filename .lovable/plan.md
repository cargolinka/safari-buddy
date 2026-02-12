

# Redesigned Blog Page - Magazine-Style Layout

Inspired by the reference site's clean card-based design, the blog page at `/safari-hire-blog` will be redesigned with a more engaging, magazine-style layout featuring a prominent featured/latest post hero and improved visual hierarchy.

## What Changes

### 1. Featured/Latest Post Hero Section
- Replace the current static hero image with a **dynamic featured post hero** that showcases the most recent blog post
- Full-width card with large image, overlay gradient, category badge, title, excerpt, author, date, and "Read Full Article" button (uses the existing `FeaturedPost` component)

### 2. Improved Blog Card Design
- Update `BlogCard` compact variant to match the reference site style: horizontal card layout with image on left, content on right (similar to the reference's subcategory cards)
- Add article count badges and cleaner typography
- Improve hover effects with subtle shadow elevation

### 3. Restructured Page Layout
The new page structure:
1. **Header** (existing)
2. **Featured Latest Post** - large hero showcasing the newest published post
3. **Sticky Filter Bar** - category pills + search (kept from current design)
4. **Blog Grid** - remaining posts in a responsive 3-column grid (no sidebar on main listing)
5. **Sidebar** - categories, recent posts, archive, tags (moved below on mobile, right side on desktop)
6. **Pagination** (existing)
7. **Newsletter CTA** - a call-to-action banner before footer
8. **Footer** (existing)

### 4. Newsletter CTA Section
- Add a visually appealing "Subscribe to our blog" banner between blog grid and footer
- Connects to the existing `newsletter_subscriptions` table

## Technical Details

### Files Modified
- **`src/pages/Blog.tsx`** - Restructure layout: extract latest post for featured hero, pass remaining posts to grid, add newsletter CTA section
- **`src/components/blog/BlogCard.tsx`** - Refine compact card styling with improved image ratio, better spacing, and hover shadow effects
- **`src/components/blog/FeaturedPost.tsx`** - Already exists and will be integrated into the blog listing page

### Files Created
- **`src/components/blog/NewsletterCTA.tsx`** - New component for newsletter subscription banner with email input and submit button, inserting into `newsletter_subscriptions` table

### Data Flow
- The first post from the query becomes the featured hero post
- Remaining posts populate the grid below
- No database changes needed - all existing tables and queries are sufficient

