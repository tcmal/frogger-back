import {DefaultCrudRepository} from '@loopback/repository';
import {PostVote, PostVoteRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class PostVoteRepository extends DefaultCrudRepository<
  PostVote,
  typeof PostVote.prototype.compoundKey,
  PostVoteRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(PostVote, dataSource);
  }
}