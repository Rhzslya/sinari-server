import type {
  ServiceLog,
  ServiceLogAction,
  User,
} from "../../generated/prisma/client";

export type ServiceLogResponse = {
  id: number;
  service_id: number;
  action: ServiceLogAction;
  description: string;
  created_at: Date;
  user: {
    username: string;
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
      username: log.user.username,
      role: log.user.role,
    },
  };
}
