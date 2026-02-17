import {
  ServiceStatus,
  UserRole,
  type Prisma,
  type User,
} from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";
import type { Pageable } from "../model/page-model";
import {
  toListTechnicianResponse,
  toTechnicianResponse,
  type CheckTechnicianExistRequest,
  type CreateTechnicianRequest,
  type DeleteTechnicianRequest,
  type GetDetailedTechnicianRequest,
  type ListTechnicianResponse,
  type RestoreTechnicianRequest,
  type SearchTechnicianRequest,
  type TechnicianResponse,
  type UpdateTechnicianRequest,
} from "../model/technician-model";
import { isValidFile } from "../utils/cloudinary-guard";
import { TechnicianValidation } from "../validation/technician-validation";
import { Validation } from "../validation/validation";
import { CloudinaryService } from "./cloudinary-service";

export class TechnicianService {
  static async create(
    user: User,
    request: CreateTechnicianRequest,
  ): Promise<TechnicianResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const createRequest = Validation.validate(
      TechnicianValidation.CREATE,
      request,
    );

    let imageUrl = "";

    if (isValidFile(request.signature)) {
      const sanitizedName = createRequest.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");

      const fileName = `${sanitizedName}-${Date.now()}`;

      imageUrl = await CloudinaryService.uploadImageSignature(
        request.signature,
        "sinari-cell/technicians",
        fileName,
      );
    }

    const technician = await prismaClient.technician.create({
      data: {
        name: createRequest.name,
        signature_url: imageUrl,
        is_active: createRequest.is_active,
      },
    });

    return toTechnicianResponse(technician);
  }

  static async checkTechnicianExist(
    request: CheckTechnicianExistRequest,
  ): Promise<TechnicianResponse> {
    const technician = await prismaClient.technician.findUnique({
      where: {
        id: request.id,
        deleted_at: null,
      },
    });

    if (!technician) {
      throw new ResponseError(404, "Technician not found");
    }

    return technician;
  }

  static async get(
    user: User,
    request: GetDetailedTechnicianRequest,
  ): Promise<TechnicianResponse | null> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const technician = await this.checkTechnicianExist({ id: request.id });

    return toTechnicianResponse(technician);
  }

  static async listActive(user: User): Promise<ListTechnicianResponse[]> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }
    const technicians = await prismaClient.technician.findMany({
      where: { is_active: true, deleted_at: null },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            services: {
              where: {
                status: {
                  in: [ServiceStatus.PENDING, ServiceStatus.PROCESS],
                },
              },
            },
          },
        },
      },
    });

    technicians.sort((a, b) => a._count.services - b._count.services);

    return technicians.map((tech) => toListTechnicianResponse(tech));
  }

  static async update(
    user: User,
    request: UpdateTechnicianRequest,
  ): Promise<TechnicianResponse> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const updateRequest = Validation.validate(
      TechnicianValidation.UPDATE,
      request,
    );

    const oldTechnician = await this.checkTechnicianExist({
      id: updateRequest.id,
    });

    if (updateRequest.is_active === false && oldTechnician.is_active === true) {
      const ongoingServiceCount = await prismaClient.service.count({
        where: {
          technician_id: updateRequest.id,
          status: {
            notIn: [
              ServiceStatus.FINISHED,
              ServiceStatus.CANCELLED,
              ServiceStatus.TAKEN,
            ],
          },
          deleted_at: null,
        },
      });

      if (ongoingServiceCount > 0) {
        throw new ResponseError(
          400,
          "Cannot Update To Inactive: Technician has ongoing services",
        );
      }
    }

    let imageUrl = oldTechnician.signature_url;

    if (updateRequest.delete_image === true) {
      if (oldTechnician.signature_url) {
        await CloudinaryService.deleteImage(oldTechnician.signature_url);
      }
      imageUrl = null;
    } else if (isValidFile(request.signature)) {
      const fileName = `${oldTechnician.id}`;

      if (oldTechnician.signature_url) {
        await CloudinaryService.deleteImage(oldTechnician.signature_url);
      }

      imageUrl = await CloudinaryService.uploadImageSignature(
        request.signature,
        "sinari-cell/technicians",
        fileName,
      );
    }

    const technician = await prismaClient.technician.update({
      where: {
        id: request.id,
      },
      data: {
        name: updateRequest.name,
        signature_url: imageUrl,
        is_active: updateRequest.is_active,
      },
    });

    return toTechnicianResponse(technician);
  }

  static async remove(
    user: User,
    request: DeleteTechnicianRequest,
  ): Promise<boolean> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const technician = await this.checkTechnicianExist({ id: request.id });

    const activeOngoingServices = await prismaClient.service.count({
      where: {
        technician_id: request.id,
        deleted_at: null,
        status: {
          notIn: [
            ServiceStatus.FINISHED,
            ServiceStatus.CANCELLED,
            ServiceStatus.TAKEN,
          ],
        },
      },
    });

    if (activeOngoingServices > 0) {
      throw new ResponseError(
        400,
        "Cannot delete technician: They still have active ongoing jobs.",
      );
    }

    if (technician.signature_url) {
      await CloudinaryService.deleteImage(technician.signature_url);
    }

    await prismaClient.technician.update({
      where: { id: request.id },
      data: {
        deleted_at: new Date(),
        is_active: false,
      },
    });

    return true;
  }

  static async restore(
    user: User,
    request: RestoreTechnicianRequest,
  ): Promise<TechnicianResponse> {
    if (user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const restoreRequest = Validation.validate(
      TechnicianValidation.RESTORE,
      request,
    );

    const technicianInTrash = await prismaClient.technician.findFirst({
      where: {
        id: restoreRequest.id,
        deleted_at: { not: null },
      },
    });

    if (!technicianInTrash) {
      throw new ResponseError(
        404,
        "Technician not found in trash bin. It might be active or permanently deleted.",
      );
    }

    const restoredTechnician = await prismaClient.technician.update({
      where: { id: restoreRequest.id },
      data: { deleted_at: null },
    });

    return toTechnicianResponse(restoredTechnician);
  }

  static async search(
    user: User,
    request: SearchTechnicianRequest,
  ): Promise<Pageable<TechnicianResponse>> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const searchRequest = Validation.validate(
      TechnicianValidation.SEARCH,
      request,
    );

    const skip = (searchRequest.page - 1) * searchRequest.size;

    const andFilters: Prisma.TechnicianWhereInput[] = [];

    if (searchRequest.name) {
      const orConditions: Prisma.TechnicianWhereInput[] = [
        { name: { contains: searchRequest.name } },
      ];

      const parsedId = Number(searchRequest.name);

      if (!isNaN(parsedId)) {
        orConditions.push({ id: parsedId });
      }

      andFilters.push({
        OR: orConditions,
      });
    }

    if (searchRequest.is_active !== undefined) {
      andFilters.push({
        is_active: searchRequest.is_active,
      });
    }

    const whereClause: Prisma.TechnicianWhereInput = {
      deleted_at: searchRequest.is_deleted ? { not: null } : null,
      AND: andFilters,
    };

    const technicians = await prismaClient.technician.findMany({
      where: whereClause,
      take: searchRequest.size,
      skip: skip,
      orderBy: {
        [searchRequest.sort_by || "created_at"]:
          searchRequest.sort_order || "desc",
      },
    });

    const totalItems = await prismaClient.technician.count({
      where: whereClause,
    });

    const data = technicians.map((technician) => {
      return toTechnicianResponse(technician);
    });

    return {
      data: data,
      paging: {
        size: searchRequest.size,
        current_page: searchRequest.page,
        total_page: Math.ceil(totalItems / searchRequest.size),
      },
    };
  }
}
