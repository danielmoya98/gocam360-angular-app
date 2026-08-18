export type EventStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'EXPIRED';

export interface FrameDto {
  id: string;
  name: string;
  previewImage: string;
  overlayImage: string;
  createdBy?: string;
  active: boolean;
  createdAt: string | Date;
}

export interface EventFrameDto {
  eventId: string;
  frameId: string;
  displayOrder: number;
  frame?: FrameDto;
}

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
  description?: string;
  coverImage?: string;
  logoUrl?: string;
  primaryColor?: string;
  hostName?: string;
  location?: string;
  maxPhotosPerGuest?: number;
  maxPrintsPerGuest?: number;
  status: string;
  frames: PublicFrameDto[];
}

export interface EventItemResponseDto {
  id: string;
  adminId?: string;
  name: string;
  title: string; // Alias UI
  status: EventStatus;
  description?: string;
  hostName: string;
  hostPhone?: string;
  hostEmail?: string;
  location?: string;
  coverImage?: string;
  eventDate: string | Date;
  date: string | Date; // Alias UI
  startTime: string | Date;
  endTime: string | Date;
  accessCode: string;
  uniqueCode: string; // Alias UI
  qrToken: string;
  galleryToken: string;
  maxPhotosPerGuest: number;
  maxPrintsPerGuest: number;
  galleryRetentionDays: number;
  primaryColor?: string;
  logoUrl?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Métricas dinámicas calculadas por el backend
  totalPhotos: number;
  totalPrints: number;
  coverGradient?: string;
  eventFrames?: EventFrameDto[];
}

export interface CreateFrameItemDto {
  name: string;
  overlayBase64: string;
}

export interface CreateEventDto {
  name: string;
  description?: string;
  hostName: string;
  hostPhone?: string;
  hostEmail?: string;
  location?: string;
  coverImage?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  maxPhotosPerGuest?: number;
  maxPrintsPerGuest?: number;
  galleryRetentionDays?: number;
  primaryColor?: string;
  logoUrl?: string;
  frames?: CreateFrameItemDto[];
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  hostName?: string;
  hostPhone?: string;
  hostEmail?: string;
  location?: string;
  coverImage?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  maxPhotosPerGuest?: number;
  maxPrintsPerGuest?: number;
  galleryRetentionDays?: number;
  primaryColor?: string;
  logoUrl?: string;
  status?: EventStatus;
  frames?: CreateFrameItemDto[];
  keepFrameIds?: string[];
}
