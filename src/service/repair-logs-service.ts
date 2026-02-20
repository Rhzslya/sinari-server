import { UserRole, type User } from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";
import {
  toServiceLogResponse,
  type GetLogRequest,
  type ServiceLogResponse,
} from "../model/repair-logs-model";
import { CheckExist } from "../utils/check-exist";

export class RepairLogService {
  static async getLogs(
    user: User,
    request: GetLogRequest,
  ): Promise<ServiceLogResponse[]> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    await CheckExist.checkServiceExists({ id: request.id });

    const logs = await prismaClient.serviceLog.findMany({
      where: {
        service_id: request.id,
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
