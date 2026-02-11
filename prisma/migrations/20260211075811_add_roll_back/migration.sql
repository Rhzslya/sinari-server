/*
  Warnings:

  - You are about to drop the column `technician_name` on the `services` table. All the data in the column will be lost.
  - Made the column `technician_id` on table `services` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `services` DROP FOREIGN KEY `services_technician_id_fkey`;

-- DropIndex
DROP INDEX `services_technician_id_fkey` ON `services`;

-- AlterTable
ALTER TABLE `services` DROP COLUMN `technician_name`,
    MODIFY `technician_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_technician_id_fkey` FOREIGN KEY (`technician_id`) REFERENCES `technicians`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
