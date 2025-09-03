import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import httpService from "../Services/httpService";

export const filterBenchListByDateRange = createAsyncThunk(
    'benchList/filterByDateRange',
    async({startDate, endDate}, {rejectWithValue}) => {
        try{
          const response = await httpService.get(`/candidate/bench/filter-by-date?startDate=${startDate}&endDate=${endDate}`);
          
          return response.data ||[];
        }catch(error){
          console.log(error);
          return rejectWithValue(error);
        }
       }
)


const benchSlice =  createSlice({
    name: "bench",
    initialState: {
        loading: false,
        filteredBenchList: [],
        isFilteredDataRequested: false,
        error: null
    },
    reducers: {
        setFilteredDataRequested: (state, action) => {
            state.isFilteredDataRequested = action.payload;
        }

    }, extraReducers: (builder) => {
        builder
          // Filter Bench List By date Range
          .addCase(filterBenchListByDateRange.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(filterBenchListByDateRange.fulfilled, (state, action) => {
            state.loading = false;
            state.filteredBenchList = action.payload;
          })
          .addCase(filterBenchListByDateRange.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload.message;
            
          })
        }
})

export const { setFilteredDataRequested } = benchSlice.actions;
export default benchSlice.reducer;