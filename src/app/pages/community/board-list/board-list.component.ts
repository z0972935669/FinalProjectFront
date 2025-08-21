// board-list.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BoardService, Board } from '../../../services/community/board.service';

interface BoardView {
  id: string;
  name: string;
  description: string;
  coverImageUrl: string;
  postCount: number;
}

@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-list.component.html',
  styleUrls: ['./board-list.component.scss'],
})
export class BoardListComponent implements OnInit {
  boards: BoardView[] = [];
  loading: boolean = true;

  constructor(private router: Router, private boardService: BoardService) {}

  ngOnInit(): void {
    this.loadBoards();
  }

  loadBoards(): void {
    this.loading = true;
    this.boardService.getBoards().subscribe({
      next: (boardsFromApi: any[]) => {
        this.boards = boardsFromApi.map((b: any) => ({
          id: b.boardId.toString(),
          name: b.boardName ?? '未知看板',
          description: b.boardDescription ?? '',
          coverImageUrl: b.boardUrl
            ? `https://localhost:7124${b.boardUrl}` // <-- 這裡
            : `/assets/img/component/board-${b.boardId}.png`,
          postCount: 0,
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('取得看板資料失敗', err);
        this.loading = false;
      },
    });
  }

  goToBoardPosts(boardID: string | number) {
    const id = Number(boardID);
    if (isNaN(id) || id <= 0) {
      console.error('無效的 boardID:', boardID);
      return;
    }
    // console.log('點擊的 boardID:', id);
    this.router.navigate(['show/community', id, 'posts']);
  }
}
