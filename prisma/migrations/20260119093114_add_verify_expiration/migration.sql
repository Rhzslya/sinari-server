/*
  Warnings:

  - You are about to alter the column `brand` on the `products` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(1))`.
  - You are about to alter the column `category` on the `products` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `products` ADD COLUMN `manufacturer` VARCHAR(100) NOT NULL DEFAULT 'ORIGINAL',
    MODIFY `brand` ENUM('APPLE', 'SAMSUNG', 'XIAOMI', 'OPPO', 'VIVO', 'REALME', 'INFINIX', 'TECNO', 'ITEL', 'ASUS', 'HUAWEI', 'SONY', 'GOOGLE', 'NOKIA', 'LENOVO', 'UNIVERSAL', 'OTHER') NOT NULL DEFAULT 'OTHER',
    MODIFY `category` ENUM('LCD', 'BATTERY', 'CONNECTOR', 'FLEXIBLE', 'CAMERA', 'SPEAKER', 'BACKDOOR', 'GLASS', 'IC', 'ACCESSORY', 'OTHER') NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `verify_expires_at` DATETIME(3) NULL;
