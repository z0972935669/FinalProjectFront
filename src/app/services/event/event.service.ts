import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventList, EventTemplateDto } from '../../interfaces/event/event-list';

@Injectable({ providedIn: 'root' })
export class EventService {
  // 直接打後端，不用 proxy
  private readonly apiRoot = 'https://localhost:7124/api';

  constructor(private httpClient: HttpClient) {}

  getEventTemplates() {
    return this.httpClient.get<any[]>(
      'https://localhost:7124/api/EventTemplate/list'
    );
  }
  private readonly base = 'https://localhost:7124/api/EventTemplate';

  /** 單筆：/api/EventTemplate/{id}（直接回 DTO） */
  getEventByBatch(batchId: number | string): Observable<EventTemplateDto> {
    return this.httpClient.get<EventTemplateDto>(
      `${this.apiRoot}/EventTemplate/by-batch/${batchId}`
    );
  }

  //新增報名資料
  register(body: {
    eventBatchId: number;
    memberId: number;
    amountDue?: number | null;
    registrationDateTime?: string;
    currentStatus: number;
    internalRemarks?: string | null;
  }) {
    return this.httpClient.post<{
      registrationId: number;
      registrationNum: string;
    }>(`${this.base}/api/EventRegistration`, body);
  }
}
