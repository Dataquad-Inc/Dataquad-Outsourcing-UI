import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import httpService from "../Services/httpService";

// ✅ Load user from localStorage (if any)
const storedUser = JSON.parse(localStorage.getItem("authUser"));

const initialState = {
  isAuthenticated: !!storedUser,
  userId: storedUser?.userId || null,
  userName: storedUser?.userName || null,
  email: storedUser?.email || null,
  role: storedUser?.role || null,
  entity: storedUser?.entity || null,
  logInTimeStamp: storedUser?.logInTimeStamp || null,
  logoutTimestamp: null,
  status: "idle",
  error: null,
  encryptionKey: storedUser?.encryptionKey || null,
};

// ✅ Login async thunk
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
        entity,
      } = response.data.payload;

      return {
        isAuthenticated: true,
        userId,
        userName,
        email: userEmail,
        role: roleType,
        entity,
        logInTimeStamp: loginTimestamp,
        encryptionKey,
      };
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        const errorMessage =
          data?.error?.errorMessage || "An unexpected error occurred.";

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

// ✅ Logout async thunk
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

// ✅ Auth slice
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
      state.entity = null;
      state.logInTimeStamp = null;
      state.logoutTimestamp = null;
      state.error = null;
      state.status = "idle";
      state.encryptionKey = null;

      // ✅ Remove user from localStorage
      localStorage.removeItem("authUser");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        const payload = action.payload;

        state.status = "succeeded";
        state.isAuthenticated = true;
        state.userId = payload.userId;
        state.userName = payload.userName;
        state.email = payload.email;
        state.role = payload.role;
        state.entity = payload.entity;
        state.logInTimeStamp = payload.logInTimeStamp;
        state.encryptionKey = payload.encryptionKey;

        // ✅ Save user to localStorage
        localStorage.setItem("authUser", JSON.stringify(payload));
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
        state.entity = null;
        state.logInTimeStamp = null;
        state.logoutTimestamp = action.payload.logoutTimestamp;
        state.encryptionKey = null;

        // ✅ Clear localStorage
        localStorage.removeItem("authUser");
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
