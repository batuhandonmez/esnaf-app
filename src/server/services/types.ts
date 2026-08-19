import type { PrismaClient } from "@/generated/prisma/client";
import type { Ctx } from "@/server/ctx";

export type ServiceCtx = Ctx;

export type Db = PrismaClient;
