

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpService from "../Services/httpService";
import { Toast } from "bootstrap";
import ToastService from "../Services/toastService";
import { fetchRTRInterviews } from "./interviewSlice";


export const addtoPlacementHandler = createAsyncThunk(
    '/addPlacement',
    async(data, {rejectWithValue,dispatch,getState}) => {
      const state = getState();
      const userId = state.auth.userId;

        try{
            const url = `/candidate/placement/create-placement/${userId}`;
            const response = await httpService.post(url, data);
            console.log("response: ", response);
            return response.data;
        }catch(error){
          console.log(error);
          return rejectWithValue(error);
        }
       }
)

export const addtoUsPlacementHandler = createAsyncThunk(
    '/addUsPlacement',
    async(data, {rejectWithValue,dispatch,getState}) => {
      const state = getState();
      const userId = state.auth.userId;

        try{
            const url = `/candidate/us-placement/create-placement/${userId}`;
            // const response = await httpService.post(url, data);
//  const candidateContactNo =
//           data.candidateContactNo ||
//           data.contactNumber ||
//           data.mobileNumber ||
//           data.phone ||
//           data.candidateContactNumber ||
//           data.consultantId ||
//           "";
console.log("Data being sent to placement API:", data);
             const payload = {
          ...data,
          candidateContactNo:
            data.candidateContactNo || data.contactNumber || data.candidateContactNumber || "",
        };
      //        const dataArr = await fetch(`http://localhost:8085/candidate/us-placement/create-placement/${userId}`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(payload),
      // });
      // const response = await dataArr.json();
        
      const response = await httpService.post(url, data);
      console.log("response: create us placement ", response);
      if((response.success || response.data?.success) && ( response?.data?.data || response?.data)) {
            ToastService.success(response.message || "Added to US Placement successfully");
            dispatch(fetchRTRInterviews());
      }else{
        ToastService.error(response.message || "Failed to add to US Placement");
      }
            console.log("response: ++cmnslice", response);
            return response.data;
        }catch(error){
          console.log(error);
          return rejectWithValue(error);
        }
       }
)

const commonSlice =  createSlice({
    name: "common",
    initialState: {
        loading: false,
        error: null,
        isSuccessful: false,
        newPlacementRecord: {}

    },
    reducers: {

    }, extraReducers: (builder) => {
        builder
          // Filter Requirement List By date Range
          .addCase(addtoPlacementHandler.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(addtoPlacementHandler.fulfilled, (state, action) => {
            state.loading = false;
            state.newPlacementRecord = action.payload;
            console.log("Action.payload: ", action.payload);
            
            if(action.payload.success == true) {
                ToastService.success(action.payload.message) 
            }
          })
          .addCase(addtoPlacementHandler.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload.message;
            ToastService.error(action.payload.message)
            
          })
        }
})

export default commonSlice.reducer;



