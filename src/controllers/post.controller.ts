import {
  repository,
} from '@loopback/repository';
import {
  param,
  del,
  HttpErrors
} from '@loopback/rest';
import {PostRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {SecurityBindings, UserProfile, securityId} from '@loopback/security';

export class PostController {
  constructor(
    @repository(PostRepository)
    public postRepository : PostRepository,
  ) {}

  @del('/posts/{id}', {
    responses: {
      '204': {
        description: 'Post DELETE success',
      },
    },
  })
  @authenticate('jwt')
  async deleteById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER)
    profile: UserProfile,
  ): Promise<void> {
    const post = await this.postRepository.findById(id, {
      include: [{relation: "subforum"}]
    });

    if (post.subforum.ownerName !== profile[securityId]) {
      throw new HttpErrors.Unauthorized("You don't own the subreddit this was posted to!");
    }
    
    await this.postRepository.deleteById(id);
  }
}
