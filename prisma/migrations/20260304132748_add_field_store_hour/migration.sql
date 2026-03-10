/*
  Warnings:

  - Added the required column `store_hours` to the `store_settings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `store_settings` ADD COLUMN `store_hours` TEXT NOT NULL;
