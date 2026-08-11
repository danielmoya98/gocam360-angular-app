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
