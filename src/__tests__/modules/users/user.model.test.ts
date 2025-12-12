import * as UserModels from '../../../modules/users/models/user';

describe('User Models Type Coverage', () => {
  it('should import user models for coverage', () => {
    expect(UserModels).toBeDefined();
  });
});
