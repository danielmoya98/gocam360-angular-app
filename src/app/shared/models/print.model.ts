export type PrintStatus = 'PENDING' | 'PRINTING' | 'PRINTED' | 'CANCELLED';

export interface PrintRequestGuestDto {
  id: string;
  name: string;
  phone: string;
}

export interface PrintRequestPhotoDto {
  id: string;
  storagePath: string; // 👈 Asegúrate de que esta propiedad exista aquí
  originalPath?: string; // Opcional por compatibilidad
  renderedPath?: string;
  thumbnailPath?: string;
  width?: number;
  height?: number;
  guest: PrintRequestGuestDto;
  frame?: {
    id: string;
    name: string;
  };
}

export interface PrintRequestItemDto {
  id: string;
  eventId: string;
  photoId: string;
  guestId?: string;
  quantity?: number;
  status: PrintStatus;
  copies?: number;
  requestedAt?: string | Date;
  printedAt?: string | Date;
  createdAt: string | Date;
  updatedAt?: string | Date;
  photo: PrintRequestPhotoDto;
  eventTitle?: string;
}
