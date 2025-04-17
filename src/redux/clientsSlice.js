// src/redux/slices/clientSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import httpService from '../Services/httpService';
import { showToast } from '../utils/ToastNotification';

// Async thunks for API calls
export const fetchAllClients = createAsyncThunk(
    'clients/fetchAll',
    async (_, { rejectWithValue }) => {
      try {
        const response = await httpService.get('/requirements/bdm/getAll');
  
        // Access the clients array from the response
        const clientsArray = response.data?.data;
  
        if (!Array.isArray(clientsArray)) {
          throw new Error("Expected 'data' to be an array of clients");
        }
  
        return clientsArray; // this gets returned to your Redux state
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || error.message || 'Failed to load clients';
        return rejectWithValue(errorMessage);
      }
    }
  );
  

export const downloadClientDocs = createAsyncThunk(
  'clients/downloadDocs',
  async (clientId, { rejectWithValue }) => {
    try {
      const response = await httpService.get(`/requirements/bdm/${clientId}/downloadAll`, {
        responseType: "arraybuffer",
      });

      return { data: response.data, clientId };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to download documents";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ clientId, updatedData }, { rejectWithValue }) => {
    try {
      const response = await httpService.put(`/requirements/bdm/${clientId}`, updatedData);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update client");
      }

      return { clientId, updatedData };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update client";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteClient = createAsyncThunk(
  'clients/delete',
  async (clientId, { rejectWithValue }) => {
    try {
      const response = await httpService.delete(`/requirements/bdm/delete/${clientId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete client");
      }

      return clientId;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete client";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await httpService.post('/requirements/bdm/addClient', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to create client");
      }

      return response.data.data; // Assuming the API returns the new client data
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create client";
      return rejectWithValue(errorMessage);
    }
  }
);

// Helper function to validate client data
const validateClientData = (data) => {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(client =>
    client.id &&
    client.clientName &&
    typeof client.netPayment === 'number' &&
    Array.isArray(client.clientSpocName)
  );
};

// Create the client slice
const clientSlice = createSlice({
  name: 'clients',
  initialState: {
    list: [],
    loading: false,
    error: null,
    downloadStatus: 'idle',
    updateStatus: 'idle',
    deleteStatus: 'idle',
    createStatus: 'idle',
  },
  reducers: {
    resetStatus: (state) => {
      state.downloadStatus = 'idle';
      state.updateStatus = 'idle';
      state.deleteStatus = 'idle';
      state.createStatus = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all clients
      .addCase(fetchAllClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllClients.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        showToast(action.payload, "error");
      })

      // Download client documents
      .addCase(downloadClientDocs.pending, (state) => {
        state.downloadStatus = 'loading';
      })
      .addCase(downloadClientDocs.fulfilled, (state) => {
        state.downloadStatus = 'succeeded';
        showToast("Documents downloaded successfully!", "success");
      })
      .addCase(downloadClientDocs.rejected, (state, action) => {
        state.downloadStatus = 'failed';
        state.error = action.payload;
        showToast(`Download failed: ${action.payload}`, "error");
      })

      // Update client
      .addCase(updateClient.pending, (state) => {
        state.updateStatus = 'loading';
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        const { clientId, updatedData } = action.payload;
        state.list = state.list.map(client =>
          client.id === clientId ? { ...client, ...updatedData } : client
        );
        showToast("Client updated successfully!", "success");
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.error = action.payload;
        showToast(action.payload, "error");
      })

      // Delete client
      .addCase(deleteClient.pending, (state) => {
        state.deleteStatus = 'loading';
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        state.list = state.list.filter(client => client.id !== action.payload);
        showToast("Client deleted successfully!", "success");
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.error = action.payload;
        showToast(action.payload, "error");
      })

      // Create client
      .addCase(createClient.pending, (state) => {
        state.createStatus = 'loading';
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.list.push(action.payload);
        showToast("New client added successfully!", "success");
      })
      .addCase(createClient.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = action.payload;
        showToast(action.payload, "error");
      });
  }
});

export const { resetStatus } = clientSlice.actions;
export default clientSlice.reducer;