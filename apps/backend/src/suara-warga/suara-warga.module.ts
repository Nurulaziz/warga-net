import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PostsController } from './posts/posts.controller';
import { PostsService } from './posts/posts.service';
import { MediaController } from './posts/media.controller';
import { CommentsController } from './comments/comments.controller';
import { CommentsService } from './comments/comments.service';
import { MentionsController } from './mentions/mentions.controller';
import { MentionsService } from './mentions/mentions.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';
import { ProfilePostsController } from './posts/profile-posts.controller';

@Module({
  imports: [UsersModule],
  controllers: [
    PostsController,
    CommentsController,
    MediaController,
    MentionsController,
    ReportsController,
    ProfilePostsController,
  ],
  providers: [PostsService, CommentsService, MentionsService, ReportsService],
  exports: [PostsService, CommentsService, MentionsService],
})
export class SuaraWargaModule {}
