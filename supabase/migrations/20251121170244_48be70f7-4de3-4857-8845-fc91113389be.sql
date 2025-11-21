-- Add national_id to document_type enum
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'national_id';