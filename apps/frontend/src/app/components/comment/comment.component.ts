import { Component, DestroyRef, Input, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateCommentComponent } from "../create-comment/create-comment.component";
import { Comment } from '../../interfaces/comment.interface';
import { CommentService } from '../../services/comment.service';
import { UserService } from '../../services/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'env-a-comment',
    standalone: true,
    templateUrl: './comment.component.html',
    styleUrls: ['./comment.component.scss'],
    imports: [CommonModule, CreateCommentComponent]
})
export class CommentComponent {
  @Input() comment!: Comment;
  isExpanded = signal(false);
  isReplying = signal(false);
  userService = inject(UserService);
  commentService = inject(CommentService);
  nestedComments = signal<Comment[]>([]);
  private destroyRef = inject(DestroyRef);


  nestedCommentsEffect = effect(() => {
    if (this.isExpanded()) {
      this.commentService.getComments(this.comment._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(comments => {
        this.nestedComments.set(comments);
      })
    };
  });

  toggleReplying(): void {
    this.isReplying.set(!this.isReplying());
    if (this.isReplying()) {
      this.isExpanded.set(true);
    }
  }

  toggleExpanded(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  createComment(formValues: {text: string}): void {
    const {text} = formValues;
    const user = this.userService.getUserFromStorage();
    if (!user) {
        return;
    }
    this.commentService.createComment({
        text,
        userId: user._id,
        parentId: this.comment._id,
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((createdComment) => {
        this.nestedComments.set([createdComment, ...this.nestedComments()]);
    });
  }

  commentTrackBy(_index: number, comment: Comment): string {
    return comment._id;
  }
}
