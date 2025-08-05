import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import httpService from "../Services/httpService";

const initialState = {
  isAuthenticated: false,
  userId: null,
  userName: null,
  email: null,
  role: null,
  entity: null, // ✅ Added entity field
  logInTimeStamp: null,
  logoutTimestamp: null,
  status: "idle",
  error: null,
  encryptionKey: null
};

// ✅ Updated login thunk to include entity
export const loginAsync = createAsyncThunk(
  "auth/loginAsync",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await httpService.post(
        `/users/login`,
        { email, password },
        { withCredentials: true }
      );

      const { 
        userId, 
        userName, 
        email: userEmail, 
        roleType, 
        loginTimestamp, 
        encryptionKey,
        entity // ✅ Extract entity from response
      } = response.data.payload;

      return {
        isAuthenticated: true,
        userId,
        userName,
        email: userEmail,
        role: roleType,
        entity, // ✅ Include entity in return
        logInTimeStamp: loginTimestamp,
        encryptionKey: encryptionKey
      };
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        const errorMessage = data?.error?.errorMessage || "An unexpected error occurred.";

        if (status === 403) {
          return rejectWithValue("User is not active, please reach out to admin.");
        } else if (status === 400) {
          return rejectWithValue("Invalid credentials or bad request.");
        } else if (status === 201 && data?.success === false) {
          return rejectWithValue(errorMessage || "User is already logged in.");
        } else {
          return rejectWithValue(errorMessage);
        }
      } else if (error.request) {
        return rejectWithValue("Network error. Please try again later.");
      } else {
        return rejectWithValue("An unexpected error occurred.");
      }
    }
  }
);

export const logoutAsync = createAsyncThunk(
  "auth/logoutAsync",
  async (userId, { rejectWithValue }) => {
    try {
      await httpService.put(`/users/logout/${userId}`);
      return { logoutTimestamp: new Date().toISOString() };
    } catch (error) {
      return rejectWithValue("Logout failed. Please try again.");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.userId = null;
      state.userName = null;
      state.email = null;
      state.role = null;
      state.entity = null; // ✅ Reset entity
      state.logInTimeStamp = null;
      state.logoutTimestamp = null;
      state.error = null;
      state.status = "idle";
      state.encryptionKey = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.userId = action.payload.userId;
        state.userName = action.payload.userName;
        state.email = action.payload.email;
        state.role = action.payload.role;
        state.entity = action.payload.entity; // ✅ Set entity
        state.logInTimeStamp = action.payload.logInTimeStamp;
        state.encryptionKey = action.payload.encryptionKey;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(logoutAsync.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = false;
        state.userId = null;
        state.userName = null;
        state.email = null;
        state.role = null;
        state.entity = null; // ✅ Reset entity
        state.logInTimeStamp = null;
        state.logoutTimestamp = action.payload.logoutTimestamp;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;