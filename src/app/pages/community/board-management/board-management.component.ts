import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BoardService, Board } from '../../../services/community/board.service';

declare var bootstrap: any;

@Component({
  selector: 'app-board-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './board-management.component.html',
  styleUrls: ['./board-management.component.scss'],
})
export class BoardManagementComponent implements OnInit {
  boards: Board[] = [];
  currentBoard: Board = this.resetBoard();
  showForm = false;
  isEdit = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  boardModal: any;

  constructor(private boardService: BoardService) {}

  ngOnInit(): void {
    this.loadBoards();
    // 初始化 Bootstrap Modal
    this.boardModal = new bootstrap.Modal(
      document.getElementById('boardModal'),
      {
        backdrop: 'static',
        keyboard: false,
      }
    );
  }

  // 初始化空板
  resetBoard(): Board {
    return {
      boardId: 0,
      boardName: '',
      boardDescription: '',
      boardUrl: '',
      createdAt: new Date().toISOString(),
      boardStatus: 'active',
    };
  }

  // 打開 Modal
  openModal(): void {
    this.boardModal.show();
  }

  // 關閉 Modal
  closeModal(): void {
    this.boardModal.hide();
    this.cancelForm(); // 同時重置表單
  }

  // 讀取所有看板
  loadBoards(): void {
    this.boardService.getBoards().subscribe({
      next: (data) => {
        this.boards = data.map((b) => ({
          ...b,
          boardUrl: b.boardUrl
            ? b.boardUrl.startsWith('http')
              ? b.boardUrl
              : `https://localhost:7124${b.boardUrl}`
            : 'https://localhost:7124/images/community/board/default.png',
        }));
      },
      error: (err) => console.error(err),
    });
  }

  // 顯示新增看板表單
  newBoard(): void {
    this.currentBoard = this.resetBoard();
    this.selectedFile = null;
    this.imagePreview = null;
    this.isEdit = false;
    this.showForm = true;
  }

  // 編輯選擇的看板
  editBoard(board: Board): void {
    this.currentBoard = { ...board };
    this.selectedFile = null;
    this.imagePreview = board.boardUrl
      ? board.boardUrl.startsWith('http')
        ? board.boardUrl
        : `https://localhost:7124${board.boardUrl}`
      : 'https://localhost:7124/images/community/board/default.png';
    this.isEdit = true;
    this.showForm = true;
  }

  // 取消新增/編輯
  cancelForm(): void {
    this.currentBoard = this.resetBoard();
    this.selectedFile = null;
    this.imagePreview = null;
    this.showForm = false;
    this.isEdit = false;
  }

  // 上傳圖片選擇
  onBoardImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => (this.imagePreview = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  // 新增或更新看板
  saveBoard(): void {
    console.log('Current board:', this.currentBoard);
    console.log('Is edit mode:', this.isEdit);
    console.log('Board ID:', this.currentBoard.boardId);

    const formData = new FormData();
    formData.append('boardName', this.currentBoard.boardName || '');
    formData.append(
      'boardDescription',
      this.currentBoard.boardDescription || ''
    );
    formData.append('boardStatus', this.currentBoard.boardStatus || 'active');
    formData.append('moderatorId', String(this.currentBoard.moderatorId || 0));

    if (this.selectedFile) {
      formData.append('boardImage', this.selectedFile, this.selectedFile.name);
    }

    // Debug: 顯示 FormData 內容
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    if (this.isEdit && this.currentBoard.boardId > 0) {
      // 編輯模式：呼叫 PUT
      this.boardService
        .updateBoard(this.currentBoard.boardId, formData)
        .subscribe({
          next: () => {
            this.loadBoards(); // 重新載入看板列表
            this.closeModal(); // 關閉 Modal
          },
          error: (err) => {
            if (err.status === 409 && err.error?.message) {
              alert(err.error.message); // 顯示名稱衝突訊息
            } else {
              console.error('更新失敗', err);
            }
          },
        });
    } else {
      // 新增模式：呼叫 POST
      this.boardService.createBoard(formData).subscribe({
        next: () => {
          this.loadBoards();
          this.closeModal();
        },
        error: (err) => {
          if (err.status === 409 && err.error?.message) {
            alert(err.error.message);
          } else {
            console.error('新增失敗', err);
          }
        },
      });
    }
  }

  // 切換看板狀態
  toggleBoardStatus(board: Board): void {
    const newStatus = board.boardStatus === 'active' ? 'inactive' : 'active';

    if (
      !confirm(`確定要${newStatus === 'active' ? '啟用' : '停用'}這個看板嗎？`)
    )
      return;

    this.boardService.toggleBoardStatus(board.boardId, newStatus).subscribe({
      next: () => (board.boardStatus = newStatus),
      error: (err) => console.error(err),
    });
  }

  // 停用看板
  deactivateBoard(boardId: number): void {
    if (!confirm('確定要停用這個看板嗎？')) return;

    this.boardService.deactivateBoard(boardId).subscribe({
      next: () => {
        const board = this.boards.find((b) => b.boardId === boardId);
        if (board) board.boardStatus = 'inactive';
      },
      error: (err) => console.error(err),
    });
  }
}
