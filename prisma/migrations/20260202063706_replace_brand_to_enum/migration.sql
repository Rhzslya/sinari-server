/*
  Warnings:

  - You are about to alter the column `brand` on the `services` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `services` MODIFY `brand` ENUM('APPLE', 'SAMSUNG', 'XIAOMI', 'OPPO', 'VIVO', 'REALME', 'INFINIX', 'TECNO', 'ITEL', 'ASUS', 'HUAWEI', 'SONY', 'GOOGLE', 'NOKIA', 'LENOVO', 'UNIVERSAL', 'OTHER') NOT NULL DEFAULT 'OTHER';
