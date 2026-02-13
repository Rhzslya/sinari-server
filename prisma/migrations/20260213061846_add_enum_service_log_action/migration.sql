/*
  Warnings:

  - You are about to alter the column `action` on the `service_logs` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `service_logs` MODIFY `action` ENUM('CREATED', 'UPDATE_INFO', 'UPDATE_STATUS', 'UPDATE_TECHNICIAN', 'UPDATE_SERVICE_LIST', 'UPDATE_DISCOUNT', 'UPDATE_DOWN_PAYMENT', 'UPDATE_FINANCIALS', 'DELETED') NOT NULL;
