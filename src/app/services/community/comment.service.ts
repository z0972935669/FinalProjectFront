import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comment {
  commentID: number;
  postID: number;
  authorID: number;
  content: string;
  createdAt: string;
  likes: number;
  parentCommentID?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private apiUrl = 'https://localhost:7124/api/CommunityComments'; // 改成你的後端 API URL

  constructor(private http: HttpClient) {}

  getCommentsByPost(postID: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/post/${postID}`);
  }

  createComment(comment: Comment): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, comment);
  }

  updateComment(comment: Comment): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${comment.commentID}`, comment);
  }

  deleteComment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
