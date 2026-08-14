export interface AuditLogDto {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  details?: string;
  ipAddress?: string;
  createdAt: string | Date;
}

export interface AuditLogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAuditLogsResponse {
  data: AuditLogDto[];
  meta: AuditLogMeta;
}
