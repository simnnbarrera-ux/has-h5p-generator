-- Store the private Storage object key for each ready H5P package.
-- Existing rows remain NULL and can be migrated with scripts/migrate-package-storage.js.
ALTER TABLE public.has_projects
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

COMMENT ON COLUMN public.has_projects.storage_path IS
  'Private object key in has-h5p-store; never a public URL. NULL indicates an unmigrated legacy artifact.';
