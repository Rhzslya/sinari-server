/*
  Warnings:

  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('CUSTOMER', 'ADMIN', 'TECHNICIAN') NOT NULL DEFAULT 'CUSTOMER';
