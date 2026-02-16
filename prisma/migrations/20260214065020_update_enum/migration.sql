/*
  Warnings:

  - The values [UPDATED,UPDATED_COST,UPDATED_PRICE] on the enum `product_logs_action` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `product_logs` MODIFY `action` ENUM('CREATED', 'UPDATE_INFO', 'UPDATE_COST', 'UPDATE_PRICE', 'RESTOCK', 'SALE_OFFLINE', 'ADJUST_DAMAGE', 'ADJUST_LOST', 'ADJUST_OPNAME') NOT NULL;
