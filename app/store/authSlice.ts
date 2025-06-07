import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  username: string;
  searchCount: number;
  lastSearchDate: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    incrementSearchCount: (state) => {
      if (state.user) {
        state.user.searchCount += 1;
      }
    },
    resetSearchCount: (state) => {
      if (state.user) {
        state.user.searchCount = 0;
        state.user.lastSearchDate = new Date().toDateString();
      }
    },
  },
});

export const { login, logout, incrementSearchCount, resetSearchCount } = authSlice.actions;
export default authSlice.reducer; 