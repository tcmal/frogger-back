import {
  repository,
  Count,
  CountSchema,
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
        description: 'Subforum model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Subforum, {exclude: ['ownerName']})
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
          schema: getModelSchemaRef(Subforum),
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
          schema: CountSchema,
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
        content: {
          'application/json': {
            schema: CountSchema
          }
        }
      },
    },
  })
  @authenticate('jwt')
  async deleteById(@param.path.string('id') id: string,
    @inject(SecurityBindings.USER)
    profile: UserProfile,
    ): Promise<Count> {
    return this.subforumRepository.deleteAll({name: id, ownerName: profile.name});
  }
}
