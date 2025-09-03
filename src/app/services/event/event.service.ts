import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';
import {
  EventList,
  EventTemplateDto,
  RegistrationCreateDto,
  RegistrationResDto,
  RegistrationListDto,
  MyRegistrationDto,
  CancelRegistrationReq,
  CancelRegistrationRes,
} from '../../interfaces/event/event-list';

@Injectable({ providedIn: 'root' })
export class EventService {
  // 直接打後端，不用 proxy
  private readonly apiRoot = 'https://localhost:7124/api';

  constructor(private httpClient: HttpClient) {}

  getEventTemplates() {
    return this.httpClient.get<any[]>(
      `${this.apiRoot}/EventTemplate/list`
      // 'https://localhost:7124/api/EventTemplate/list'
    );
  }
  // private readonly base = 'https://localhost:7124';

  /** 單筆：/api/EventTemplate/{id}（直接回 DTO） */
  getEventByBatch(batchId: number | string): Observable<EventTemplateDto> {
    return this.httpClient.get<EventTemplateDto>(
      `${this.apiRoot}/EventTemplate/by-batch/${batchId}`
    );
  }

  //新增報名資料
  register(body: RegistrationCreateDto): Observable<RegistrationResDto> {
    //https://localhost:7124/api/EventRegistration
    return this.httpClient.post<RegistrationResDto>(
      `${this.apiRoot}/EventRegistration`,
      body
    );
  }
  //抓取報名資料
  getEventRegistration() {
    return this.httpClient.get<any[]>(
      `${this.apiRoot}/EventTemplate/list`
      //https://localhost:7124/api/EventTemplate/list
    );
  }
  //取消報名
  cancelRegistration(memberId: number, batchId: number, reason?: string) {
    const url = `${this.apiRoot}/EventRegistration/cancel`; // 路由前綴見後端控制器
    const body: CancelRegistrationReq = {
      memberId,
      eventBatchId: batchId,
      reason,
    };
    return this.httpClient.put<CancelRegistrationRes>(url, body);
  }

  //抓取報名資料 (可搜尋狀態 活動批次 使用者id)
  /** ✅ 1) 單批次是否已報名（只看 status=1） */
  getHasRegistered(memberId: number, batchId: number): Observable<boolean> {
    return this.httpClient
      .get<RegistrationListDto[]>(
        `${this.apiRoot}/EventRegistration/memberId/${memberId}?batchId=${batchId}&status=1`
      )
      .pipe(
        map((list) => Array.isArray(list) && list.length > 0),
        catchError(() => of(false))
      );
  }

  /** ✅ 2) 取該會員的報名清單（可選狀態篩選），並做快取 */
  private registrationsCache = new Map<
    string,
    Observable<RegistrationListDto[]>
  >();

  getMyRegistrations(memberId: number): Observable<MyRegistrationDto[]> {
    return this.httpClient.get<MyRegistrationDto[]>(
      `${this.apiRoot}/EventRegistration/memberId/${memberId}`
    );
  }

  //抓取折價卷資料
  getEventCoupon(memberId: number) {
    return this.httpClient.get<any[]>(
      `${this.apiRoot}/EventCoupon/list/${memberId}`
      //https://localhost:7124/api/EventCoupon/list/1018
    );
  }
}
