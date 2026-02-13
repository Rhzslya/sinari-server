/*
  Warnings:

  - You are about to alter the column `action` on the `product_logs` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(5))`.

*/
-- AlterTable
ALTER TABLE `product_logs` MODIFY `action` ENUM('CREATED', 'UPDATED', 'RESTOCK', 'SALE_OFFLINE', 'ADJUST_DAMAGE', 'ADJUST_LOST', 'ADJUST_OPNAME') NOT NULL;
