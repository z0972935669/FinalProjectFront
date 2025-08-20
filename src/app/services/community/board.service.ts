import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Board {
  boardID: number;
  boardName: string;
  boardDescription?: string;
  moderatorID?: number;
  createdAt: string;
  boardStatus: string;
}

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private apiUrl = 'https://localhost:7124/api/CommunityBoards'; // 改成你的後端 API URL

  constructor(private http: HttpClient) {}

  getBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(this.apiUrl);
  }

  getBoard(id: number): Observable<Board> {
    return this.http.get<Board>(`${this.apiUrl}/${id}`);
  }

  createBoard(board: Board): Observable<Board> {
    return this.http.post<Board>(this.apiUrl, board);
  }

  updateBoard(board: Board): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${board.boardID}`, board);
  }

  deleteBoard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
