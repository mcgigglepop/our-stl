import {
  authReducer,
  initialAuthState,
  type AuthState,
  type AuthTokens,
  type AuthUser,
} from '../authReducer';

const user: AuthUser = {
  username: 'jane@example.com',
  email: 'jane@example.com',
  name: 'Jane Doe',
};

const tokens: AuthTokens = {
  accessToken: 'a',
  idToken: 'i',
  refreshToken: 'r',
};

describe('authReducer', () => {
  it('sets loading', () => {
    expect(authReducer(initialAuthState, { type: 'SET_LOADING', payload: true }).loading).toBe(true);
  });

  it('sets and clears error', () => {
    const errored = authReducer(initialAuthState, { type: 'SET_ERROR', payload: 'oops' });
    expect(errored.error).toBe('oops');
    expect(authReducer(errored, { type: 'SET_ERROR', payload: null }).error).toBeNull();
  });

  it('stores user and tokens on sign in', () => {
    const withUser = authReducer(initialAuthState, { type: 'SET_USER', payload: user });
    const withTokens = authReducer(withUser, { type: 'SET_TOKENS', payload: tokens });
    expect(withTokens.user).toEqual(user);
    expect(withTokens.tokens).toEqual(tokens);
  });

  it('wipes everything on SIGN_OUT', () => {
    const authed: AuthState = { user, tokens, loading: false, error: null };
    expect(authReducer(authed, { type: 'SIGN_OUT' })).toEqual(initialAuthState);
  });

  it('merges updates into existing user', () => {
    const authed: AuthState = { user, tokens, loading: false, error: null };
    const next = authReducer(authed, { type: 'UPDATE_USER', payload: { name: 'Jane D.' } });
    expect(next.user).toEqual({ ...user, name: 'Jane D.' });
  });

  it('ignores UPDATE_USER when no user is set', () => {
    const next = authReducer(initialAuthState, { type: 'UPDATE_USER', payload: { name: 'Nope' } });
    expect(next.user).toBeNull();
  });
});
