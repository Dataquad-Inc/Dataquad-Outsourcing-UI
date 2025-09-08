// requirementsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { requirementsAPI } from "./api"; // Adjust the import path as needed

// Async thunks for API calls
export const fetchRequirements = createAsyncThunk(
  "requirements/fetchRequirements",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await requirementsAPI.getAllRequirements(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRequirementById = createAsyncThunk(
  "requirements/fetchRequirementById",
  async (requirementId, { rejectWithValue }) => {
    try {
      const response = await requirementsAPI.getRequirementById(requirementId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createRequirement = createAsyncThunk(
  "requirements/createRequirement",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await requirementsAPI.createRequirement(formData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateRequirement = createAsyncThunk(
  "requirements/updateRequirement",
  async ({ requirementId, requirementData }, { rejectWithValue }) => {
    try {
      const response = await requirementsAPI.updateRequirement(
        requirementId,
        requirementData
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateRequirementWithFormData = createAsyncThunk(
  "requirements/updateRequirementWithFormData",
  async ({ requirementId, formData }, { rejectWithValue }) => {
    try {
      const response = await requirementsAPI.updateRequirementWithFormData(
        requirementId,
        formData
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteRequirement = createAsyncThunk(
  "requirements/deleteRequirement",
  async (requirementId, { rejectWithValue }) => {
    try {
      await requirementsAPI.deleteRequirement(requirementId);
      return requirementId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  requirements: [],
  currentRequirement: null,
  loading: false,
  error: null,
};

const requirementsSlice = createSlice({
  name: "usRequirements",
  initialState,

});
