export type EventStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'EXPIRED';

export interface PublicFrameDto {
  id: string;
  name: string;
  previewUrl?: string;
  overlayUrl?: string;
  thumbnailColor?: string;
}

export interface PublicEventDto {
  id: string;
  name: string;
  status: string;
  primaryColor?: string;
  logoUrl?: string;
  frames: PublicFrameDto[];
}

export interface EventItemResponseDto {
  id: string;
  title: string;
  status: EventStatus;
  description?: string;
  uniqueCode: string;
  qrToken: string;
  galleryToken: string;
  hostName: string;
  hostPhone?: string;
  hostEmail?: string;
  totalPhotos: number;
  totalPrints: number;
  date: string | Date;
  location: string;
  coverGradient?: string;
  maxPhotosPerGuest?: number;
  maxPrintsPerGuest?: number;
  galleryRetentionDays?: number;
}

export interface CreateEventDto {
  name: string;
  description?: string;
  hostName: string;
  hostPhone?: string;
  hostEmail?: string;
  location?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  maxPhotosPerGuest?: number;
  maxPrintsPerGuest?: number;
  galleryRetentionDays?: number;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  hostName?: string;
  hostPhone?: string;
  hostEmail?: string;
  location?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  maxPhotosPerGuest?: number;
  maxPrintsPerGuest?: number;
  galleryRetentionDays?: number;
  status?: EventStatus;
}
