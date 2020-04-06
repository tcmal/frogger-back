import {DefaultCrudRepository} from '@loopback/repository';
import {CommentVote, CommentVoteRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CommentVoteRepository extends DefaultCrudRepository<
  CommentVote,
  typeof CommentVote.prototype.compoundKey,
  CommentVoteRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(CommentVote, dataSource);
  }
}
