import React, { useState } from "react";
import { Box, useTheme } from "@mui/material";
import axios from "axios";
import CustomTable from "../../ui-lib/CustomTable";
import getHotListColumns from "./hotListColumns";
import {
  showErrorToast,
  showSuccessToast,
  showLoadingToast,
  dismissToast,
} from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";


const HotList = React.memo(() => {
  const [refreshKey, setRefreshKey] = useState(0);
  const theme = useTheme();


  const handleEdit = (row) => {
   console.log(row);
  }

const fetchData = async ({
  page = 1,
  pageSize = 10,
  filters = {},
  sort = {},
}) => {
  const toastId = showLoadingToast("Fetching hotlist data..."); // 🔹 capture ID

  try {
    const apiPage = Math.max(page - 1, 0);
    const response = await axios.get(
      "http://192.168.0.115:8092/hotlist/allConsultants",
      {
        params: {
          page: apiPage,
          size: pageSize,
          ...filters,
          ...sort,
        },
      }
    );

    const { content = [], totalElements = 0 } = response.data?.data || {};

    dismissToast(toastId); // 🔹 dismiss the loading toast
    showSuccessToast("Hotlist data fetched successfully!");

    return {
      data: content,
      total: totalElements,
    };
  } catch (error) {
    console.error("Error fetching hotlist data:", error);
    dismissToast(toastId); // 🔹 also dismiss on error
    showErrorToast("Failed to fetch hotlist data!");
    return {
      data: [],
      total: 0,
    };
  }
};


  const deleteConsultant = async (consultantId) => {
    try {
      const response = await axios.delete(
        `http://192.168.0.115:8092/hotlist/deleteConsultant/${consultantId}`
      );
      showSuccessToast(response.data?.data?.message || "Consultant deleted!");
      setRefreshKey((prev) => prev + 1); // Refresh table
    } catch (error) {
      showErrorToast(`Failed to delete consultant: ${error.message}`);
    }
  };

  const handleDelete = (row) => {
    showDeleteConfirm(
      () => deleteConsultant(row.consultantId),
      row.consultantName || "this consultant",
      // {
      //   confirmColor: theme.palette.error.main,
      //   cancelColor: theme.palette.primary.main,
      // }
    );
  };

  const columns = getHotListColumns({
    handleNavigate: () => {},
    handleEdit,
    handleDelete,
    loading: false,
  });

  return (
    <CustomTable
      refreshKey={refreshKey}
      columns={columns}
      fetchData={fetchData}
      title="Hotlist Candidates"
    />
  );
});

HotList.displayName = "HotList";

export default HotList;
