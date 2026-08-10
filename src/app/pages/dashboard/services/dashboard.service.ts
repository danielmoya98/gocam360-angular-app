import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/services/api-client.service';

export interface AdminCardMetrics {
  total: number;
  active: number;
  inactive: number;
}

export interface EventCardMetrics {
  total: number;
  active: number;
  finished: number;
}

export interface PhotoCardMetrics {
  total: number;
  today: number;
}

export interface PrintCardMetrics {
  total: number;
  week: number;
}

export interface CloudinaryStorageUsage {
  usedGB: number;
  limitGB: number;
  storageUsedPercent: number;
}

export interface SuperAdminCardsMetrics {
  admins: AdminCardMetrics;
  events: EventCardMetrics;
  photos: PhotoCardMetrics;
  prints: PrintCardMetrics;
  storage: CloudinaryStorageUsage;
}

export interface RecentActivityFeedItem {
  type: 'EVENT_CREATED' | 'PHOTO_UPLOADED' | 'PRINT_REQUESTED';
  description: string;
  timestamp: string | Date;
  location?: string;
  status?: string;
}

export interface ActivityTrendPoint {
  month: string;
  photos: number;
  prints: number;
}

export interface SuperAdminMetricsResponseDto {
  cards: SuperAdminCardsMetrics;
  recentActivity: RecentActivityFeedItem[];
  activityTrends?: ActivityTrendPoint[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly _api = inject(ApiClientService);

  getSuperAdminMetrics(): Observable<SuperAdminMetricsResponseDto> {
    return this._api.get<SuperAdminMetricsResponseDto>('/dashboard/super-admin-metrics');
  }
}
