import type { User, AuthState } from '../types/auth';
import { userStorage, accessTokenStorage } from '../utils/storage';
import { AUTH_ACTIONS } from './authActions';

// Initial state - check existing auth data
const existingUser = userStorage.get();
const existingToken = accessTokenStorage.get();

export const initialState: AuthState = {
  user: existingUser,
  token: existingToken,
  isAuthenticated: !!(existingUser && existingToken),
  isLoading: false,
  error: null,
};

// Action types
type AuthAction = 
  | { type: typeof AUTH_ACTIONS.LOGIN_START }
  | { type: typeof AUTH_ACTIONS.LOGIN_SUCCESS; payload: { user: User; token: string } }
  | { type: typeof AUTH_ACTIONS.LOGIN_FAILURE; payload: { error: string } }
  | { type: typeof AUTH_ACTIONS.REGISTER_START }
  | { type: typeof AUTH_ACTIONS.REGISTER_SUCCESS }
  | { type: typeof AUTH_ACTIONS.REGISTER_FAILURE; payload: { error: string } }
  | { type: typeof AUTH_ACTIONS.LOGOUT }
  | { type: typeof AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS; payload: { token: string } }
  | { type: typeof AUTH_ACTIONS.CLEAR_ERROR }
  | { type: typeof AUTH_ACTIONS.SET_LOADING; payload: { isLoading: boolean } };

// Reducer function
export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        token: action.payload.token,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };

    default:
      return state;
  }
};