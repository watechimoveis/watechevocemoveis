-- Revision 008 | Revises 007
-- Terrenos/lotes: remove rooms/bathrooms/parking, adiciona campos de terreno

-- Pré-requisito: se property_type não existir, aplica 007 inline
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type VARCHAR(20) NOT NULL DEFAULT 'land';
CREATE INDEX IF NOT EXISTS ix_properties_property_type ON properties (property_type);
CREATE INDEX IF NOT EXISTS ix_properties_listing_property_type ON properties (listing_type, property_type);

UPDATE properties SET property_type = 'terreno'
WHERE property_type IS NULL OR property_type NOT IN ('terreno', 'lote');

UPDATE properties SET listing_type = 'sale' WHERE listing_type <> 'sale';

ALTER TABLE properties ALTER COLUMN property_type SET DEFAULT 'terreno';

ALTER TABLE properties DROP COLUMN IF EXISTS rooms;
ALTER TABLE properties DROP COLUMN IF EXISTS bathrooms;
ALTER TABLE properties DROP COLUMN IF EXISTS parking;

ALTER TABLE properties ADD COLUMN IF NOT EXISTS zoning VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS topography VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS frontage NUMERIC(8, 2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS depth NUMERIC(8, 2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS documentation VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gated_community BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS accepts_financing BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_water BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_electricity BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_sewage BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS paved_street BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS development_name VARCHAR(160);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS block VARCHAR(30);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lot_number VARCHAR(30);

CREATE INDEX IF NOT EXISTS ix_properties_zoning ON properties (zoning);
CREATE INDEX IF NOT EXISTS ix_properties_gated_community ON properties (gated_community);

UPDATE alembic_version SET version_num = '008' WHERE version_num IN ('006', '007');
