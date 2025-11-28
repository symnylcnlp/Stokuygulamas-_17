-- Railway.app PostgreSQL Veritabanı Tabloları
-- Bu SQL scriptini Railway PostgreSQL servisinde "Query" sekmesinde çalıştırın

-- 1. Products Tablosu
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  "urunAdi" VARCHAR(255) NOT NULL,
  "urunKodu" VARCHAR(255) NOT NULL UNIQUE,
  kategori VARCHAR(255) NOT NULL,
  "urunFiyati" DECIMAL(10, 2) NOT NULL,
  "bayiFiyati" DECIMAL(10, 2) NOT NULL,
  bedenler JSONB DEFAULT NULL,
  renkler JSONB DEFAULT NULL,
  "renkKombinasyonlari" JSONB DEFAULT NULL,
  varyantlar JSONB DEFAULT NULL,
  "oneCikan" BOOLEAN NOT NULL DEFAULT FALSE,
  aciklama TEXT DEFAULT NULL,
  "urunDetaylari" TEXT DEFAULT NULL,
  "stokSayisi" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_urunKodu ON products("urunKodu");
CREATE INDEX IF NOT EXISTS idx_products_kategori ON products(kategori);

-- 2. Colors Tablosu
CREATE TABLE IF NOT EXISTS colors (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL DEFAULT '',
  "imageUrl" VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_colors_isActive ON colors("isActive");

-- 3. Categories Tablosu
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subcategories JSONB DEFAULT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_isActive ON categories("isActive");

-- 4. Dealers Tablosu
CREATE TABLE IF NOT EXISTS dealers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  "contactName" VARCHAR(255) DEFAULT NULL,
  "contactEmail" VARCHAR(255) DEFAULT NULL,
  "contactPhone" VARCHAR(255) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  city VARCHAR(255) DEFAULT NULL,
  district VARCHAR(255) DEFAULT NULL,
  country VARCHAR(255) DEFAULT 'Türkiye',
  "establishmentYear" INTEGER DEFAULT NULL,
  website VARCHAR(255) DEFAULT NULL,
  "taxNumber" VARCHAR(255) DEFAULT NULL,
  "taxOffice" VARCHAR(255) DEFAULT NULL,
  "taxCertificatePath" VARCHAR(255) DEFAULT NULL,
  "tradeRegistryGazettePath" VARCHAR(255) DEFAULT NULL,
  "signatureCircularPath" VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "externalMetadata" JSONB DEFAULT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dealers_code ON dealers(code);
CREATE INDEX IF NOT EXISTS idx_dealers_status ON dealers(status);
CREATE INDEX IF NOT EXISTS idx_dealers_isActive ON dealers("isActive");

-- 5. Orders Tablosu
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  "orderNumber" VARCHAR(255) NOT NULL UNIQUE,
  "dealerName" VARCHAR(255) DEFAULT NULL,
  "dealerCode" VARCHAR(255) DEFAULT NULL,
  "contactName" VARCHAR(255) DEFAULT NULL,
  "contactEmail" VARCHAR(255) DEFAULT NULL,
  "contactPhone" VARCHAR(255) DEFAULT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  "totalQuantity" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(255) NOT NULL DEFAULT 'TRY',
  notes TEXT DEFAULT NULL,
  "externalMetadata" JSONB DEFAULT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON orders("orderNumber");
CREATE INDEX IF NOT EXISTS idx_orders_dealerCode ON orders("dealerCode");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 6. Size Guides Tablosu
CREATE TABLE IF NOT EXISTS size_guides (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_size_guides_isActive ON size_guides("isActive");

-- UpdatedAt için Trigger Fonksiyonu (PostgreSQL'de ON UPDATE CURRENT_TIMESTAMP yok)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Her tablo için trigger oluştur
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_colors_updated_at BEFORE UPDATE ON colors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dealers_updated_at BEFORE UPDATE ON dealers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_size_guides_updated_at BEFORE UPDATE ON size_guides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Başarılı!
SELECT 'Tüm tablolar başarıyla oluşturuldu!' AS durum;

