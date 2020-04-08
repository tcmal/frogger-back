import {
  repository,
  Count,
} from '@loopback/repository';
import {
  post,
  param,
  getModelSchemaRef,
  patch,
  del,
  requestBody,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {Subforum} from '../models';
import {inject} from '@loopback/core';
import {SubforumRepository} from '../repositories';
import {LOGGED_IN} from '../spec/';

export class SubforumController {
  constructor(
    @repository(SubforumRepository)
    public subforumRepository : SubforumRepository,
  ) {}

  @post('/subs', {
    security: LOGGED_IN,
    responses: {
      '200': {
        description: 'Subforum instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Subforum)
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Subforum, {exclude: ['ownerName']}),
        },
      },
    })
    subforum: Subforum,
    @inject(SecurityBindings.USER)
    profile: UserProfile,
  ): Promise<Subforum> {
    return this.subforumRepository.create({
      ...subforum,
      ownerName: profile.name
    });
  }

  @patch('/subs/{id}', {
    security: LOGGED_IN,
    responses: {
      '204': {
        description: 'Subforum PATCH success',
      },
    },
  })
  @authenticate('jwt')
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              description: {type: 'string'},
            },
          },
        },
      },
    })
    updateTo: Subforum,
    @inject(SecurityBindings.USER)
    profile: UserProfile,
  ): Promise<Count> {
    return this.subforumRepository.updateAll(updateTo, {name: id, ownerName: profile.name});
  }

  @del('/subs/{id}', {
    security: LOGGED_IN,
    responses: {
      '204': {
        description: 'Subforum DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('id') id: string,
    @inject(SecurityBindings.USER)
    profile: UserProfile,
    ): Promise<void> {
    await this.subforumRepository.deleteAll({name: id, ownerName: profile.name});
  }
}
