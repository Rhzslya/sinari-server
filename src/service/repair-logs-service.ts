import { UserRole, type User } from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";
import {
  toServiceLogResponse,
  type ServiceLogResponse,
} from "../model/repair-logs-model";
import { CheckExist } from "../utils/check-exist";

export class RepairLogService {
  static async getLogs(
    user: User,
    serviceId: number,
  ): Promise<ServiceLogResponse[]> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    await CheckExist.checkServiceExists({ id: serviceId });

    const logs = await prismaClient.serviceLog.findMany({
      where: {
        service_id: serviceId,
      },
      include: {
        user: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return logs.map(toServiceLogResponse);
  }
}
