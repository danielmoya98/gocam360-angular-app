export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'DISCARDED';

export interface CrmLeadDto {
  id: string;
  name: string;
  phone: string;
  eventId?: string;
  eventType?: string;
  estimatedDate?: string;
  notes?: string;
  status: LeadStatus;
  createdAt: string | Date;
  event?: {
    name: string;
  };
}
