import type { ServiceLog, User } from "../../generated/prisma/client";

export type ServiceLogResponse = {
  id: number;
  service_id: number;
  action: string;
  description: string;
  created_at: Date;
  user: {
    name: string;
    role: string;
  };
};

export function toServiceLogResponse(
  log: ServiceLog & { user: User },
): ServiceLogResponse {
  return {
    id: log.id,
    service_id: log.service_id,
    action: log.action,
    description: log.description,
    created_at: log.created_at,
    user: {
      name: log.user.name,
      role: log.user.role,
    },
  };
}
