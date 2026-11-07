
/* src/contexts/auth-context.tsx */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { setAccessTokenProvider } from '@/config/api';
import { getPostAuthRoute } from '@/utils/auth-navigation';

import { authService } from '@/services/auth-service';
import type {
  AuthUser,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/types/auth';
import axios from 'axios';

/* ======================================================
   STORAGE
====================================================== */

const STORAGE_KEY_USER = 'dantify_auth_user';
const STORAGE_KEY_TOKEN = 'dantify_auth_token';

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(STORAGE_KEY_TOKEN);
  }

  return SecureStore.getItemAsync(STORAGE_KEY_TOKEN);
}

async function saveStoredToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(STORAGE_KEY_TOKEN, token);
    return;
  }

  await SecureStore.setItemAsync(STORAGE_KEY_TOKEN, token);
}

async function removeStoredToken(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
    return;
  }

  await SecureStore.deleteItemAsync(STORAGE_KEY_TOKEN);
}

async function clearStoredSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEY_USER),
    removeStoredToken(),
  ]);
}

/* ======================================================
   CONTEXT TYPES
====================================================== */

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  postAuthRoute: string | null;
};

type AuthContextValue = AuthState & {
  loginWithCredentials: (
    email: string,
    password: string,
  ) => Promise<LoginResponse>;

  registerWithCredentials: (
    payload: RegisterRequest,
  ) => Promise<RegisterResponse>;

  applyLogin: (payload: LoginResponse) => Promise<void>;
  applyRegister: (payload: RegisterResponse) => Promise<void>;

  logout: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => Promise<void>;
};

/* ======================================================
   CONTEXT
====================================================== */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setAccessTokenProvider(getStoredToken);
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  const [postAuthRoute, setPostAuthRoute] = useState<string | null>(null);

  /* ======================================================
     PERSIST SESSION
  ====================================================== */

  const persistSession = useCallback(
    async (nextUser: AuthUser, nextToken: string) => {
      // Persist the token first; don't mark the session active
      // if secure token storage fails.
      await saveStoredToken(nextToken);

      try {
        await AsyncStorage.setItem(
          STORAGE_KEY_USER,
          JSON.stringify(nextUser),
        );
      } catch (error) {
        await removeStoredToken();
        throw error;
      }

      setUser(nextUser);
      setToken(nextToken);
    },
    [],
  );

  /* ======================================================
     RESTORE AND VALIDATE SESSION
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const storedToken = await getStoredToken();

        if (!storedToken) {
          await AsyncStorage.removeItem(STORAGE_KEY_USER);
          return;
        }

        // Validate the saved token with Laravel.
        const currentUser = await authService.me(storedToken);

        if (cancelled) return;

        if (currentUser.is_active === false) {
          await clearStoredSession();
          return;
        }

        await AsyncStorage.setItem(
          STORAGE_KEY_USER,
          JSON.stringify(currentUser),
        );

        setUser(currentUser);
        setToken(storedToken);
      } catch (error) {
        if (!cancelled) {
          const isUnauthorized =
            axios.isAxiosError(error) &&
            error.response?.status === 401;

          if (isUnauthorized) {
            console.warn(
              '[Auth] Stored session is invalid or expired. Clearing session.',
            );

            try {
              await clearStoredSession();
            } catch (storageError) {
              console.warn(
                '[Auth] Could not clear stored session.',
                storageError,
              );
            }
          } else {
            console.warn(
              '[Auth] Session restoration failed due to a network or server error.',
              error,
            );
          }

          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ======================================================
     APPLY LOGIN RESPONSE
  ====================================================== */

  const applyLogin = useCallback(
    async (payload: LoginResponse) => {
      if (!payload.token || !payload.user) {
        throw new Error('Invalid login response from the server.');
      }

      await persistSession(payload.user, payload.token);

      setPostAuthRoute(
        getPostAuthRoute(payload.user, payload.next_step),
      );
    },
    [persistSession],
  );

  /* ======================================================
     APPLY REGISTRATION RESPONSE
  ====================================================== */

  const applyRegister = useCallback(
    async (payload: RegisterResponse) => {
      // Registration might not automatically log the user in.
      if (payload.token) {
        await persistSession(payload.user, payload.token);
      } else {
        await clearStoredSession();
        setUser(null);
        setToken(null);
      }
    },
    [persistSession],
  );

  /* ======================================================
     API ACTIONS
  ====================================================== */

  const loginWithCredentials = useCallback(
    async (email: string, password: string): Promise<LoginResponse> => {
      const response = await authService.login(email, password);
      await applyLogin(response);
      return response;
    },
    [applyLogin],
  );

  const registerWithCredentials = useCallback(
    async (payload: RegisterRequest) => {
      const response = await authService.register(payload);
      await applyRegister(response);
      return response;
    },
    [applyRegister],
  );

  /* ======================================================
     LOGOUT
  ====================================================== */

  const logout = useCallback(async () => {
    const currentToken = token;

    // Clear local credentials even if the server request fails.
    try {
      if (currentToken) {
        await authService.logout(currentToken);
      }
    } catch (error) {
      console.warn('[Auth] Server logout failed.', error);
    } finally {
      setUser(null);
      setToken(null);
      setPostAuthRoute(null);
      await clearStoredSession();
    }
  }, [token]);

  /* ======================================================
     UPDATE USER
  ====================================================== */

  const updateUser = useCallback(
    async (partial: Partial<AuthUser>) => {
      if (!user) return;

      const updatedUser = { ...user, ...partial };

      await AsyncStorage.setItem(
        STORAGE_KEY_USER,
        JSON.stringify(updatedUser),
      );

      setUser(updatedUser);
    },
    [user],
  );

  /* ======================================================
     CONTEXT VALUE
  ====================================================== */

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      loginWithCredentials,
      registerWithCredentials,
      applyLogin,
      applyRegister,
      logout,
      updateUser,
      postAuthRoute,
    }),
    [
      user,
      token,
      isLoading,
      loginWithCredentials,
      registerWithCredentials,
      applyLogin,
      applyRegister,
      logout,
      updateUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/* ======================================================
   HOOK
====================================================== */

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
};
