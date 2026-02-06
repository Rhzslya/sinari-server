/*
  Warnings:

  - The values [TECHNICIAN] on the enum `users_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('CUSTOMER', 'ADMIN', 'OWNER') NOT NULL DEFAULT 'CUSTOMER';
