-- Railway.app MySQL Veritabanı Tabloları
-- Bu SQL scriptini Railway MySQL servisinde "Query" sekmesinde çalıştırın

-- 1. Products Tablosu
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `urunAdi` VARCHAR(255) NOT NULL,
  `urunKodu` VARCHAR(255) NOT NULL UNIQUE,
  `kategori` VARCHAR(255) NOT NULL,
  `urunFiyati` DECIMAL(10, 2) NOT NULL,
  `bayiFiyati` DECIMAL(10, 2) NOT NULL,
  `bedenler` JSON DEFAULT NULL,
  `renkler` JSON DEFAULT NULL,
  `renkKombinasyonlari` JSON DEFAULT NULL,
  `varyantlar` JSON DEFAULT NULL,
  `oneCikan` BOOLEAN NOT NULL DEFAULT FALSE,
  `aciklama` TEXT DEFAULT NULL,
  `urunDetaylari` TEXT DEFAULT NULL,
  `stokSayisi` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_urunKodu` (`urunKodu`),
  INDEX `idx_kategori` (`kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Colors Tablosu
CREATE TABLE IF NOT EXISTS `colors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(255) NOT NULL DEFAULT '',
  `imageUrl` VARCHAR(255) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Categories Tablosu
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `subcategories` JSON DEFAULT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Dealers Tablosu
CREATE TABLE IF NOT EXISTS `dealers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `contactName` VARCHAR(255) DEFAULT NULL,
  `contactEmail` VARCHAR(255) DEFAULT NULL,
  `contactPhone` VARCHAR(255) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(255) DEFAULT NULL,
  `district` VARCHAR(255) DEFAULT NULL,
  `country` VARCHAR(255) DEFAULT 'Türkiye',
  `establishmentYear` INT DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `taxNumber` VARCHAR(255) DEFAULT NULL,
  `taxOffice` VARCHAR(255) DEFAULT NULL,
  `taxCertificatePath` VARCHAR(255) DEFAULT NULL,
  `tradeRegistryGazettePath` VARCHAR(255) DEFAULT NULL,
  `signatureCircularPath` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `externalMetadata` JSON DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_code` (`code`),
  INDEX `idx_status` (`status`),
  INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Orders Tablosu
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderNumber` VARCHAR(255) NOT NULL UNIQUE,
  `dealerName` VARCHAR(255) DEFAULT NULL,
  `dealerCode` VARCHAR(255) DEFAULT NULL,
  `contactName` VARCHAR(255) DEFAULT NULL,
  `contactEmail` VARCHAR(255) DEFAULT NULL,
  `contactPhone` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `items` JSON NOT NULL DEFAULT '[]',
  `totalQuantity` INT NOT NULL DEFAULT 0,
  `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(255) NOT NULL DEFAULT 'TRY',
  `notes` TEXT DEFAULT NULL,
  `externalMetadata` JSON DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_orderNumber` (`orderNumber`),
  INDEX `idx_dealerCode` (`dealerCode`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Size Guides Tablosu
CREATE TABLE IF NOT EXISTS `size_guides` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Başarılı!
SELECT 'Tüm tablolar başarıyla oluşturuldu!' AS 'Durum';

