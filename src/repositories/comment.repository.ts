import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {Comment, CommentRelations, CommentVote} from '../models';
import {DbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {CommentVoteRepository} from './comment-vote.repository';

export class CommentRepository extends DefaultCrudRepository<
  Comment,
  typeof Comment.prototype.commentId,
  CommentRelations
> {

  public readonly replies: HasManyRepositoryFactory<Comment, typeof Comment.prototype.commentId>;

  public readonly votes: HasManyRepositoryFactory<CommentVote, typeof Comment.prototype.commentId>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('CommentVoteRepository') protected commentVoteRepositoryGetter: Getter<CommentVoteRepository>,
  ) {
    super(Comment, dataSource);
    this.votes = this.createHasManyRepositoryFactoryFor('votes', commentVoteRepositoryGetter,);
    this.replies = this.createHasManyRepositoryFactoryFor('replies', Getter.fromValue(this));
    this.registerInclusionResolver('replies', this.replies.inclusionResolver);
  }
}
