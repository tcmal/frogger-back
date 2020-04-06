import {
  repository,
} from '@loopback/repository';
import {
  get,
  post,
  getModelSchemaRef,
  del,
  requestBody,
} from '@loopback/rest';
import {User, Credentials} from '../models';
import {UserRepository} from '../repositories';
import {PasswordHasher} from '../services';
import {inject} from '@loopback/core';
import {
  TokenServiceBindings,
  PasswordHasherBindings,
  UserServiceBindings,
} from '../keys';
import {SecurityBindings, UserProfile, securityId} from "@loopback/security";
import {UserService, TokenService, authenticate} from "@loopback/authentication";
import {LOGGED_IN} from '../spec/';

type AuthResponse = {
  token: string,
  expires: Date
  user: User,
}

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository : UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public tokenService: TokenService,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
    public expiresIn: number,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<User, Credentials>
  ) {}

  @post('/users', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: getModelSchemaRef(User, {exclude: ['password']})}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {exclude: ['createdAt']}),
        },
      },
    })
    user: User,
  ): Promise<User> {
    const password = await this.passwordHasher.hashPassword(
      user.password,
    );

    return this.userRepository.create({
      ...user,
      password
    });
  }

  @post('/users/auth', {
    responses: {
      '200': {
        description: 'User model instance and JWT token',
        content: {'application/json': {
          schema: {
            token: 'string',
            expires: 'date',
            user: getModelSchemaRef(User, {exclude: ['password']})
          },
        }}
      }
    }
  })
  async auth(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: {
                type: 'string',
              },
              password: {
                type: 'string',
              }
            }
          }
        }
      }
    }) creds: Credentials,
    ): Promise<AuthResponse> {

    const user = await this.userService.verifyCredentials(creds);

    const profile = this.userService.convertToUserProfile(user);

    const token = await this.tokenService.generateToken(profile);

    let expires = new Date();
    expires.setTime(expires.getTime() + (this.expiresIn * 1000));

    return {
      token,
      expires,
      user
    }
  }

  @get('/users/renewToken', {
    security: LOGGED_IN,
    responses: {
      '200': {
        description: 'Renewed JWT token',
        content: {'application/json': {
          schema: {
            token: 'string',
            expires: 'date',
            user: getModelSchemaRef(User, {exclude: ['password']})
          },
        }}
      }
    }
  })
  @authenticate('jwt')
  async renewToken(
    @inject(SecurityBindings.USER) profile: UserProfile,
  ): Promise<AuthResponse> {

    const user = await this.userRepository.findById(profile[securityId]);

    const newProfile = this.userService.convertToUserProfile(user);

    const token = await this.tokenService.generateToken(newProfile);

    let expires = new Date();
    expires.setTime(expires.getTime() + (this.expiresIn * 1000));

    return {
      token,
      expires,
      user
    }
  }

  @del('/users/', {
    title: 'Delete the logged in user',
    security: LOGGED_IN,
    responses: {
      '204': {
        description: 'User DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteMe(
    @inject(SecurityBindings.USER) profile: UserProfile,
  ): Promise<void> {
    await this.userRepository.deleteById(profile.id);
  }
}
