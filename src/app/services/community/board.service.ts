import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Board {
  boardId: number;
  boardName: string;
  boardDescription?: string;
  boardUrl?: string;
  moderatorId?: number;
  createdAt: string;
  boardStatus: string;
}

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private apiUrl = 'https://localhost:7124/api/CommunityBoards'; // 後端 API URL

  constructor(private http: HttpClient) {}

  // 取得所有看板
  getBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(this.apiUrl);
  }

  // 取得單一看板
  getBoard(id: number): Observable<Board> {
    return this.http.get<Board>(`${this.apiUrl}/${id}`);
  }

  // 新增看板
  saveBoard(formData: FormData): Observable<Board> {
    return this.http.post<Board>(this.apiUrl, formData);
  }

  createBoard(formData: FormData) {
    return this.http.post(this.apiUrl, formData);
  }
  // 更新看板
  updateBoard(boardId: number, formData: FormData) {
    return this.http.put(`${this.apiUrl}/${boardId}`, formData);
  }

  toggleBoardStatus(boardId: number, status: string) {
    return this.http.put(`${this.apiUrl}/status/${boardId}`, {
      boardStatus: status,
    });
  }

  // 停用看板
  deactivateBoard(boardId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/deactivate/${boardId}`, {});
  }
}
