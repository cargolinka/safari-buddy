-- Add SEO fields to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS meta_keywords text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS canonical_url text,
ADD COLUMN IF NOT EXISTS og_image_url text;