import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { CognitoUser, CognitoUserPool, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';

import { authReducer, initialAuthState, type AuthTokens, type AuthUser } from './authReducer';

export type { AuthTokens, AuthUser } from './authReducer';

export interface AuthContextType {
  // State
  user: AuthUser | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Methods
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  getCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  userPoolId: string;
  clientId: string;
  region: string;
  children: React.ReactNode;
}

/**
 * CognitoProvider: Authentication provider using AWS Cognito
 * Manages user signup, login, token refresh, and session persistence
 */
export const CognitoProvider: React.FC<AuthProviderProps> = ({
  userPoolId,
  clientId,
  region,
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Initialize Cognito User Pool
  const userPool = React.useMemo(
    () =>
      new CognitoUserPool({
        UserPoolId: userPoolId,
        ClientId: clientId,
        Region: region,
      } as any),
    [userPoolId, clientId, region]
  );

  // Load persisted session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        const storedTokens = await SecureStore.getItemAsync('auth_tokens');
        if (storedTokens) {
          const tokens: AuthTokens = JSON.parse(storedTokens);
          dispatch({ type: 'SET_TOKENS', payload: tokens });

          // Decode ID token to get user info
          const decoded = JSON.parse(atob(tokens.idToken.split('.')[1]));
          const user: AuthUser = {
            username: decoded['cognito:username'],
            email: decoded.email,
            emailVerified: decoded.email_verified,
            name: decoded.name,
            givenName: decoded.given_name,
            familyName: decoded.family_name,
            phoneNumber: decoded.phone_number,
          };
          dispatch({ type: 'SET_USER', payload: user });
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadSession();
  }, []);

  // Persist tokens to secure storage
  const persistTokens = useCallback(async (tokens: AuthTokens) => {
    await SecureStore.setItemAsync('auth_tokens', JSON.stringify(tokens));
  }, []);

  // Sign up
  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_LOADING', payload: true });

        const attributes = [new CognitoUserAttribute({ Name: 'email', Value: email })];
        if (name) {
          attributes.push(new CognitoUserAttribute({ Name: 'name', Value: name }));
        }

        await new Promise<void>((resolve, reject) => {
          userPool.signUp(email, password, attributes, [], (err, result) => {
            if (err) reject(err);
            else resolve();
          });
        });

        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign up failed';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [userPool]
  );

  // Confirm sign up
  const confirmSignUp = useCallback(
    async (email: string, code: string) => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_LOADING', payload: true });

        const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

        await new Promise<void>((resolve, reject) => {
          cognitoUser.confirmRegistration(code, true, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Confirmation failed';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [userPool]
  );

  // Resend confirmation code
  const resendCode = useCallback(
    async (email: string) => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_LOADING', payload: true });

        const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

        await new Promise<void>((resolve, reject) => {
          cognitoUser.resendConfirmationCode((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Resend code failed';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [userPool]
  );

  // Sign in with SRP
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_LOADING', payload: true });

        const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
        const details = new AuthenticationDetails({ Username: email, Password: password });

        const session = await new Promise<any>((resolve, reject) => {
          cognitoUser.authenticateUser(details, {
            onSuccess: (session) => resolve(session),
            onFailure: (err) => reject(err),
            mfaRequired: () => reject(new Error('MFA required')),
            newPasswordRequired: () => reject(new Error('New password required')),
          });
        });

        // Extract tokens
        const tokens: AuthTokens = {
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
        };

        // Decode ID token to get user info
        const decoded = JSON.parse(atob(tokens.idToken.split('.')[1]));
        const user: AuthUser = {
          username: decoded['cognito:username'],
          email: decoded.email,
          emailVerified: decoded.email_verified,
          name: decoded.name,
          givenName: decoded.given_name,
          familyName: decoded.family_name,
          phoneNumber: decoded.phone_number,
        };

        // Persist tokens
        await persistTokens(tokens);

        dispatch({ type: 'SET_TOKENS', payload: tokens });
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign in failed';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [userPool, persistTokens]
  );

  // Sign out
  const signOut = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }

      await SecureStore.deleteItemAsync('auth_tokens');
      dispatch({ type: 'SIGN_OUT' });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [userPool]);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    try {
      if (!state.tokens) throw new Error('No refresh token available');

      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) throw new Error('No user session');

      const refreshToken = new (require('amazon-cognito-identity-js').CognitoRefreshToken)({
        RefreshToken: state.tokens.refreshToken,
      });

      const tokens = await new Promise<AuthTokens>((resolve, reject) => {
        cognitoUser.refreshSession(refreshToken, (err: any, session: any) => {
          if (err) reject(err);
          else {
            resolve({
              accessToken: session.getAccessToken().getJwtToken(),
              idToken: session.getIdToken().getJwtToken(),
              refreshToken: state.tokens!.refreshToken,
            });
          }
        });
      });

      await persistTokens(tokens);
      dispatch({ type: 'SET_TOKENS', payload: tokens });
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'SIGN_OUT' });
      throw error;
    }
  }, [state.tokens, userPool, persistTokens]);

  // Change password
  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_LOADING', payload: true });

        const cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) throw new Error('No user session');

        await new Promise<void>((resolve, reject) => {
          cognitoUser.changePassword(oldPassword, newPassword, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Change password failed';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [userPool]
  );

  // Reset password
  const resetPassword = useCallback(
    async (email: string) => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_LOADING', payload: true });

        const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

        await new Promise<void>((resolve, reject) => {
          cognitoUser.forgotPassword({
            onSuccess: () => resolve(),
            onFailure: (err) => reject(err),
          });
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Reset password failed';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [userPool]
  );

  // Confirm password reset
  const confirmPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_LOADING', payload: true });

        const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

        await new Promise<void>((resolve, reject) => {
          cognitoUser.confirmPassword(code, newPassword, {
            onSuccess: () => resolve(),
            onFailure: (err) => reject(err),
          });
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Confirm password failed';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [userPool]
  );

  // Get current user
  const getCurrentUser = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }

      await new Promise<void>((resolve, reject) => {
        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            reject(err);
          } else {
            const user: AuthUser = {
              username: cognitoUser.getUsername(),
              email: '',
            };

            attributes?.forEach((attr) => {
              switch (attr.getName()) {
                case 'email':
                  user.email = attr.getValue();
                  break;
                case 'email_verified':
                  user.emailVerified = attr.getValue() === 'true';
                  break;
                case 'name':
                  user.name = attr.getValue();
                  break;
                case 'given_name':
                  user.givenName = attr.getValue();
                  break;
                case 'family_name':
                  user.familyName = attr.getValue();
                  break;
                case 'phone_number':
                  user.phoneNumber = attr.getValue();
                  break;
              }
            });

            dispatch({ type: 'SET_USER', payload: user });
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Get current user failed:', error);
      dispatch({ type: 'SET_USER', payload: null });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [userPool]);

  const value: AuthContextType = {
    // State
    user: state.user,
    tokens: state.tokens,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user && !!state.tokens,

    // Methods
    signUp,
    confirmSignUp,
    resendCode,
    signIn,
    signOut,
    refreshAccessToken,
    changePassword,
    resetPassword,
    confirmPassword,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth: Hook to access authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a CognitoProvider');
  }
  return context;
};
