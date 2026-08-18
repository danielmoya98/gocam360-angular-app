import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiClientService } from '../../../core/services/api-client.service';
import { PublicEventDto } from '../../../shared/models/event.model';

export interface JoinEventPayload {
  eventCode: string;
  guestName: string;
  guestPhone: string;
}

export interface UploadPhotoPayload {
  eventId: string;
  guestId: string;
  frameId: string;
  photoBase64: string;
}

export interface CrmQuotePayload {
  name: string;
  phone: string;
  eventId?: string;
  notes?: string;
}

export interface MyPhotoDto {
  id: string;
  storagePath: string;
  uploadedAt: string | Date;
  isPrinted: boolean;
  isPendingPrint: boolean;
  hasPrintRequest: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class GuestExperienceService {
  private readonly _api = inject(ApiClientService);

  getPublicEvent(code: string): Observable<PublicEventDto> {
    return this._api.get<PublicEventDto>(`/guest-experience/event/${code}`);
  }

  joinEvent(payload: JoinEventPayload): Observable<any> {
    return this._api.post('/guest-experience/join', payload);
  }

  uploadPhoto(payload: UploadPhotoPayload): Observable<any> {
    return this._api.post('/guest-experience/upload', payload);
  }

  uploadPhotoOnly(payload: UploadPhotoPayload): Observable<any> {
    return this._api.post('/guest-experience/upload-photo', payload);
  }

  getMyPhotos(eventId: string, guestId: string): Observable<MyPhotoDto[]> {
    return this._api.get<MyPhotoDto[]>(`/guest-experience/my-photos?eventId=${eventId}&guestId=${guestId}`);
  }

  requestPrintForPhoto(payload: { photoId: string; guestId: string; eventId: string }): Observable<any> {
    return this._api.post('/guest-experience/request-print', payload);
  }

  sendCrmQuote(payload: CrmQuotePayload): Observable<any> {
    return this._api.post('/crm-leads/public-register', payload);
  }
}
