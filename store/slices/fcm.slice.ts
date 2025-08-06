import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface FcmState {
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: FcmState = {
  token: null,
  status: 'idle',
  error: null,
};

export const updateFcmToken = createAsyncThunk(
  'fcm/updateToken',
  async ({ token, userAgent }: { token: string; userAgent: string }) => {
    // TODO: Gọi API để update token lên server
    console.log('Updating FCM token:', token, userAgent);
    return { token, userAgent };
  }
);

const fcmSlice = createSlice({
  name: 'fcm',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateFcmToken.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateFcmToken.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
      })
      .addCase(updateFcmToken.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Không thể cập nhật FCM token';
      });
  },
});

export default fcmSlice.reducer; 