/*
  Warnings:

  - Added the required column `quantity_change` to the `product_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product_logs` ADD COLUMN `quantity_change` INTEGER NOT NULL;
