import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PersonalService,
  CommunityProfileDto,
  UserPost,
} from '../../../services/community/personal.service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-personal-community',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-community.component.html',
  styleUrls: ['./personal-community.component.scss'],
})
export class PersonalCommunityComponent implements OnInit {
  userProfile?: CommunityProfileDto;
  userPosts: UserPost[] = [];
  favoritePosts: UserPost[] = [];
  memberId!: number;
  loading = true;
  error = '';
  isOwnPage = false;
  isShowingFavorites: boolean = false;

  constructor(
    private personalService: PersonalService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('memberId');
      const currentUserId = this.getCurrentUserIdFromJWT();
      const id = idParam ? Number(idParam) : currentUserId;

      if (!id) {
        this.error = '無法取得會員 ID';
        this.loading = false;
        return;
      }

      this.memberId = id;
      this.isOwnPage = id === currentUserId;
      this.loadData();
    });
  }

  private getCurrentUserIdFromJWT(): number | null {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const idStr =
        payload.MemberID ||
        payload[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
        ];
      const id = Number(idStr);
      return isNaN(id) ? null : id;
    } catch {
      return null;
    }
  }

  public loadData() {
    this.loading = true;
    this.error = '';

    const currentUserId = this.getCurrentUserIdFromJWT();

    forkJoin({
      profile: this.personalService.getUserProfile(this.memberId).pipe(
        catchError((err) => {
          this.error = `取得會員資料失敗: ${err.message || '未知錯誤'}`;
          return of(null);
        })
      ),
      posts: this.personalService
        .getUserPosts(this.memberId)
        .pipe(catchError(() => of([]))),
      favorites: currentUserId
        ? this.personalService
            .getFavorites(currentUserId)
            .pipe(catchError(() => of([])))
        : of([]),
    }).subscribe(({ profile, posts, favorites }) => {
      this.userProfile = profile || undefined;

      this.userPosts = (posts as UserPost[]).map((p) => ({
        ...p,
        isFavorited: false,
      }));

      const favPostIds = (favorites as { postId: number }[]).map(
        (f) => f.postId
      );

      if (favPostIds.length === 0) {
        this.favoritePosts = [];
        this.loading = false;
        return;
      }

      this.personalService.getPostsByIds(favPostIds).subscribe({
        next: (favPosts) => {
          favPosts.forEach((fp) => (fp.isFavorited = true));
          this.favoritePosts = favPosts;

          this.userPosts.forEach((p) => {
            if (favPostIds.includes(p.id)) p.isFavorited = true;
          });

          this.loading = false;
        },
        error: () => {
          this.favoritePosts = [];
          this.loading = false;
        },
      });
    });
  }

  toggleFavorite(post: UserPost) {
    const currentUserId = this.getCurrentUserIdFromJWT();
    if (!currentUserId) return;

    if (post.isFavorited) {
      this.personalService.removeFavorite(currentUserId, post.id).subscribe({
        next: () => {
          post.isFavorited = false;
          this.updateFavoritePosts();
        },
        error: (err) => console.error('取消收藏失敗', err),
      });
    } else {
      this.personalService.addFavorite(currentUserId, post.id).subscribe({
        next: () => {
          post.isFavorited = true;
          this.updateFavoritePosts();
        },
        error: (err) => console.error('新增收藏失敗', err),
      });
    }
  }

  private updateFavoritePosts() {
    this.favoritePosts = this.userPosts.filter((p) => p.isFavorited);
  }

  toggleFollow() {
    console.log('Follow/Unfollow clicked!');
  }

  goToPost(post: UserPost) {
    if (!post.boardID) {
      console.error('貼文缺少 boardID 資訊');
      return;
    }

    this.router.navigate([
      'show/community',
      post.boardID,
      'posts',
      post.id.toString(),
    ]);
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== 'assets/img/component/default-avatar.png') {
      target.src = 'assets/img/component/default-avatar.png';
    }
  }
}
