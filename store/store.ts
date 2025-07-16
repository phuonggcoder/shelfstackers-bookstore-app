import { configureStore } from '@reduxjs/toolkit';
import fcmReducer from './slices/fcm.slice';

export const store = configureStore({
  reducer: {
    fcm: fcmReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 