-- Revision 007 | Revises 006
-- Adiciona property_type em properties

ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type VARCHAR(20) NOT NULL DEFAULT 'land';

CREATE INDEX IF NOT EXISTS ix_properties_property_type ON properties (property_type);
CREATE INDEX IF NOT EXISTS ix_properties_listing_property_type ON properties (listing_type, property_type);

UPDATE alembic_version SET version_num = '007' WHERE version_num = '006';
