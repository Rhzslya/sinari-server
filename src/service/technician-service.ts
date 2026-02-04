import type { Prisma, User } from "../../generated/prisma/client";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/response-error";
import type { Pageable } from "../model/page-model";
import {
  toTechnicianResponse,
  type CreateTechnicianRequest,
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
    if (user.role !== "admin") {
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

      imageUrl = await CloudinaryService.uploadImage(
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

  static async checkTechnicianExist(id: number): Promise<TechnicianResponse> {
    const technician = await prismaClient.technician.findUnique({
      where: {
        id: id,
      },
    });

    if (!technician) {
      throw new ResponseError(404, "Technician not found");
    }

    return technician;
  }

  static async get(user: User, id: number): Promise<TechnicianResponse | null> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const technician = await this.checkTechnicianExist(id);

    return toTechnicianResponse(technician);
  }

  static async update(
    user: User,
    request: UpdateTechnicianRequest,
  ): Promise<TechnicianResponse> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const updateRequest = Validation.validate(
      TechnicianValidation.UPDATE,
      request,
    );

    const oldTechnician = await this.checkTechnicianExist(updateRequest.id);

    if (updateRequest.name || updateRequest.is_active) {
      const nameCheck = updateRequest.name ?? oldTechnician.name;

      const countExistingTechnician = await prismaClient.technician.count({
        where: {
          name: nameCheck,
          id: {
            not: request.id,
          },
        },
      });

      if (countExistingTechnician > 0) {
        throw new ResponseError(400, "Technician already exists same Name");
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

      imageUrl = await CloudinaryService.uploadImage(
        request.signature,
        "sinari-cell/technicians",
        fileName,
      );
    }

    const product = await prismaClient.technician.update({
      where: {
        id: request.id,
      },
      data: {
        name: updateRequest.name,
        signature_url: imageUrl,
        is_active: updateRequest.is_active,
      },
    });

    return toTechnicianResponse(product);
  }

  static async remove(user: User, id: number): Promise<boolean> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const technician = await this.checkTechnicianExist(id);

    if (technician.signature_url) {
      await CloudinaryService.deleteImage(technician.signature_url);
    }

    await prismaClient.technician.delete({
      where: {
        id: id,
      },
    });

    return true;
  }

  static async search(
    user: User,
    request: SearchTechnicianRequest,
  ): Promise<Pageable<TechnicianResponse>> {
    if (user.role !== "admin") {
      throw new ResponseError(403, "Forbidden: Insufficient permissions");
    }

    const searchRequest = Validation.validate(
      TechnicianValidation.SEARCH,
      request,
    );

    const skip = (searchRequest.page - 1) * searchRequest.size;

    const andFilters: Prisma.TechnicianWhereInput[] = [];

    if (searchRequest.name) {
      andFilters.push({
        OR: [{ name: { contains: searchRequest.name } }],
      });
    }

    if (searchRequest.is_active) {
      andFilters.push({
        is_active: searchRequest.is_active,
      });
    }

    const whereClause: Prisma.TechnicianWhereInput = {
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
