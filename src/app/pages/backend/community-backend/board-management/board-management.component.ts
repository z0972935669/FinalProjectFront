import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BoardService, Board } from '../../../../services/community/board.service';
import Swal from 'sweetalert2';

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
      error: (err) => {
        console.error('載入看板失敗:', err);
        Swal.fire({
          icon: 'error',
          title: '載入失敗',
          text: '無法載入看板列表，請稍後再試',
          confirmButtonText: '確定',
        });
      },
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
    const file = event?.target?.files?.[0];
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
            Swal.fire({
              icon: 'success',
              title: '更新成功',
              text: '看板已成功更新',
              timer: 2000,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            console.error('更新失敗', err);
            if (err?.status === 409 && err?.error?.message) {
              Swal.fire({
                icon: 'warning',
                title: '名稱重複',
                text: err.error.message,
                confirmButtonText: '確定',
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: '更新失敗',
                text: '看板更新失敗，請稍後再試',
                confirmButtonText: '確定',
              });
            }
          },
        });
    } else {
      // 新增模式：呼叫 POST
      this.boardService.createBoard(formData).subscribe({
        next: () => {
          this.loadBoards();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: '新增成功',
            text: '看板已成功新增',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          console.error('新增失敗', err);
          if (err?.status === 409 && err?.error?.message) {
            Swal.fire({
              icon: 'warning',
              title: '名稱重複',
              text: err.error.message,
              confirmButtonText: '確定',
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: '新增失敗',
              text: '看板新增失敗，請稍後再試',
              confirmButtonText: '確定',
            });
          }
        },
      });
    }
  }

  // 切換看板狀態
  toggleBoardStatus(board: Board): void {
    if (!board) return;

    const newStatus = board.boardStatus === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? '啟用' : '停用';

    Swal.fire({
      icon: 'question',
      title: '確認操作',
      text: `確定要${actionText}這個看板嗎？`,
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      confirmButtonColor: newStatus === 'active' ? '#28a745' : '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.boardService.toggleBoardStatus(board.boardId, newStatus).subscribe({
          next: () => {
            board.boardStatus = newStatus;
            Swal.fire({
              icon: 'success',
              title: '操作成功',
              text: `看板已${actionText}`,
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            console.error('狀態切換失敗', err);
            Swal.fire({
              icon: 'error',
              title: '操作失敗',
              text: `看板${actionText}失敗，請稍後再試`,
              confirmButtonText: '確定',
            });
          },
        });
      }
    });
  }

  // 停用看板
  deactivateBoard(boardId: number): void {
    Swal.fire({
      icon: 'warning',
      title: '確認停用',
      text: '確定要停用這個看板嗎？',
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.boardService.deactivateBoard(boardId).subscribe({
          next: () => {
            const board = this.boards.find((b) => b.boardId === boardId);
            if (board) board.boardStatus = 'inactive';
            Swal.fire({
              icon: 'success',
              title: '停用成功',
              text: '看板已停用',
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            console.error('停用失敗', err);
            Swal.fire({
              icon: 'error',
              title: '停用失敗',
              text: '看板停用失敗，請稍後再試',
              confirmButtonText: '確定',
            });
          },
        });
      }
    });
  }
}
