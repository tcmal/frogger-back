import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
  HttpErrors
} from '@loopback/rest';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {PostVote} from '../models';
import {SecurityBindings, UserProfile, securityId} from '@loopback/security';
import {PostVoteRepository} from '../repositories';
import {LOGGED_IN} from '../spec';

type CreateVote = {
  objectType: string, // post
  objectId: number,
  vote: string, // up|down|clear
};

export class ObjectVoteController {
  constructor(
    @repository(PostVoteRepository)
    public postVoteRepository : PostVoteRepository,
  ) {}

  @post('/votes', {
    security: LOGGED_IN,
    responses: {
      '204': {
        description: 'Vote submitted',
      },
    },
  })
  @authenticate('jwt')
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              objectType: {type: 'string'},
              objectId: {type: 'number'},
              vote: {type: 'string'}
            }
          }
        },
      },
    })
    body: CreateVote,
    @inject(SecurityBindings.USER)
    profile: UserProfile,
  ): Promise<void> {
    if (body.objectType === "post") {
      if (body.vote === "clear") {
        await this.postVoteRepository.deleteAll({
          userName: profile[securityId],
          postId: body.objectId,
        });
      } else {
        const val = {
          postId: body.objectId,
          userName: profile[securityId],
          isUpvote: body.vote === "up",
          compoundKey: profile[securityId] + "|" + body.objectId
        };
        try {
          await this.postVoteRepository.replaceById(val.compoundKey, val);
        } catch {
          await this.postVoteRepository.create(val);
        }
      }
    } else {
      throw new HttpErrors.BadRequest("objectType should be post or comment");
    }
  }
}