/*
  Warnings:

  - A unique constraint covering the columns `[service_id]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `service_id` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `services` ADD COLUMN `service_id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `services_service_id_key` ON `services`(`service_id`);
