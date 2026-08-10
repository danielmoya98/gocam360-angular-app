import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = environment.apiUrl;

  /**
   * Petición GET centralizada
   */
  get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }
    return this._http.get<T>(`${this._baseUrl}${this.formatEndpoint(endpoint)}`, { params: httpParams });
  }

  /**
   * Petición POST centralizada
   */
  post<T>(endpoint: string, body: unknown, headers?: HttpHeaders): Observable<T> {
    return this._http.post<T>(`${this._baseUrl}${this.formatEndpoint(endpoint)}`, body, { headers });
  }

  /**
   * Petición PUT centralizada
   */
  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this._http.put<T>(`${this._baseUrl}${this.formatEndpoint(endpoint)}`, body);
  }

  /**
   * Petición PATCH centralizada
   */
  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this._http.patch<T>(`${this._baseUrl}${this.formatEndpoint(endpoint)}`, body);
  }

  /**
  /**
   * Petición DELETE centralizada (con soporte opcional para body)
   */
  delete<T>(endpoint: string, body?: unknown): Observable<T> {
    return this._http.delete<T>(`${this._baseUrl}${this.formatEndpoint(endpoint)}`, { body });
  }

  /**
   * Helper para asegurar la barra inclinada en el endpoint
   */
  private formatEndpoint(endpoint: string): string {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
}
