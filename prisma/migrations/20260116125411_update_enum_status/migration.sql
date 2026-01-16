/*
  Warnings:

  - You are about to alter the column `status` on the `services` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `services` MODIFY `status` ENUM('PENDING', 'PROCESS', 'FINISHED', 'CANCELLED', 'TAKEN') NOT NULL DEFAULT 'PENDING';
