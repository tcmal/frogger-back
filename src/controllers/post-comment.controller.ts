import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
  Inclusion,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
  HttpErrors,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, UserProfile, securityId} from '@loopback/security';
import {inject} from '@loopback/core';

import {
  Post,
  PostWithVotes,
  Comment,
  CommentWithRelations,
} from '../models';
import {PostRepository, PostVoteRepository, CommentVoteRepository, CommentRepository} from '../repositories';
import {LOGGED_IN} from '../spec';

export class PostCommentController {
  constructor(
    @repository(PostRepository) protected postRepository: PostRepository,
    @repository(CommentRepository) protected commentRepository: CommentRepository,
    @repository(PostVoteRepository) protected postVoteRepository: PostVoteRepository,
    @repository(CommentVoteRepository) protected commentVoteRepository: CommentVoteRepository,
  ) { }

  @get('/posts/{id}/comments', {
    responses: {
      '200': {
        description: 'Post with comments',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              items: {
                comments: getModelSchemaRef(Comment, {includeRelations: true}),
                post: getModelSchemaRef(Post, {includeRelations: true}),
              }
            },
          },
        },
      },
    },
  })
  @authenticate('jwt', {optional: true})
  async find(
    @param.path.number('id') id: number,
    @param.query.number('limit', {default: 20}) limit: number,
    @inject(SecurityBindings.USER)
    profile: UserProfile,
    @param.query.dateTime('after') after?: Date,
  ): Promise<{comments: CommentWithRelations[], post: PostWithVotes}> {
    const post = await this.postRepository.findById(id, {
      include: [{relation: "subforum"}]
    });
    const postWithVotes = await post.withUserVote(this.postVoteRepository, profile);

    let scopeRecurse: any = {relation: "replies", scope: {}};
    scopeRecurse.scope.include = [scopeRecurse];

    const filter: Filter = {
      where: {
        replyTo: null,
        createdAt: after ? {lt: after} : undefined,
      },
      limit,
      order: ["createdAt DESC"],
      include: [scopeRecurse]
    }

    const comments: CommentWithRelations[] = await Promise.all(
      (await this.postRepository.comments(id).find(filter))
        .map(x => x.withUserVote(this.commentVoteRepository, profile))
    );

    return {
      post: postWithVotes,
      comments,
    }
  }

  @post('/posts/{id}/comments', {
    security: LOGGED_IN,
    responses: {
      '200': {
        description: 'Comment to post',
        content: {'application/json': {schema: getModelSchemaRef(Comment)}},
      },
    },
  })
  @authenticate('jwt')
  async create(
    @param.path.number('id') id: typeof Post.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Comment, {
            title: 'NewCommentInPost',
            exclude: ['postId', 'userName', 'createdAt', 'commentId'],
          }),
        },
      },
    }) comment: Partial<Comment>,
    @inject(SecurityBindings.USER)
    profile: UserProfile,
  ): Promise<Comment> {
    if (comment.replyTo) {
      const parent = await this.commentRepository.findById(comment.replyTo);

      if (parent.postId !== comment.postId)
        throw new HttpErrors.BadRequest("postId should match postId of parent comment");
    }

    return this.postRepository.comments(id).create({
      ...comment,
      userName: profile[securityId],
      postId: id,
    });
  }

  @del('/posts/{id}/comments', {
    security: LOGGED_IN,
    responses: {
      '200': {
        description: 'Post.Comment DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  @authenticate('jwt')
  async delete(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              commentId: {type: 'number'},
            },
          },
        },
      },
    }) comment: {commentId: number},
    @inject(SecurityBindings.USER)
    profile: UserProfile,
  ): Promise<Count> {
    const post = await this.postRepository.findById(id, {include: [{relation: "subforum"}]});
    if (post.subforum.ownerName != profile[securityId])
      throw new HttpErrors.BadRequest("You don't own the subforum of this post");

    return this.postRepository.comments(id).delete({
      commentId: comment.commentId
    });
  }
}
