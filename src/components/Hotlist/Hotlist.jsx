import React, { useState } from "react";
import { Box, useTheme } from "@mui/material";
import axios from "axios";
import CustomTable from "../../ui-lib/CustomTable";
import getHotListColumns from "./hotListColumns";
import CreateConsultant from "./CreateConsultant"; // Import the CreateHotListUser component
import {
  showErrorToast,
  showSuccessToast,
  showLoadingToast,
  dismissToast,
} from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";

const HotList = React.memo(() => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState(null);
  const theme = useTheme();

  const handleEdit = (row) => {
    console.log("Editing consultant:", row);
    
    // Transform the row data to match the form's expected structure
    const initialValues = {
      consultantId: row.consultantId,
      candidateName: row.consultantName,
      email: row.email,
      phone: row.phone,
      location: row.location,
      experience: row.experience,
      currentRole: row.currentRole,
      currentCompany: row.currentCompany,
      skills: row.skills,
      availability: row.availability,
      expectedSalary: row.expectedSalary,
      noticePeriod: row.noticePeriod,
      source: row.source,
      status: row.status,
      // Add any other fields that exist in your form
      ...row // Spread the entire row to capture any additional fields
    };
    
    setEditingConsultant(initialValues);
    setShowCreateForm(true);
  };

  const handleCreateNew = () => {
    setEditingConsultant(null);
    setShowCreateForm(true);
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingConsultant(null);
  };

  const handleFormSuccess = (data, action) => {
    setShowCreateForm(false);
    setEditingConsultant(null);
    setRefreshKey((prev) => prev + 1); // Refresh the table
    
    const message = action === "create" 
      ? "Consultant created successfully!" 
      : "Consultant updated successfully!";
    showSuccessToast(message);
  };

  const fetchData = async ({
    page = 1,
    pageSize = 10,
    filters = {},
    sort = {},
  }) => {
    const toastId = showLoadingToast("Fetching hotlist data...");

    try {
      const apiPage = Math.max(page - 1, 0);
      const response = await axios.get(
        "https://mymulya.com/hotlist/allConsultants",
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

      dismissToast(toastId);
      showSuccessToast("Hotlist data fetched successfully!");

      return {
        data: content,
        total: totalElements,
      };
    } catch (error) {
      console.error("Error fetching hotlist data:", error);
      dismissToast(toastId);
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
        `https://mymulya.com/hotlist/deleteConsultant/${consultantId}`
      );
      showSuccessToast(response.data?.data?.message || "Consultant deleted!");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      showErrorToast(`Failed to delete consultant: ${error.message}`);
    }
  };

  const handleDelete = (row) => {
    showDeleteConfirm(
      () => deleteConsultant(row.consultantId),
      row.consultantName || "this consultant"
    );
  };

  const columns = getHotListColumns({
    handleNavigate: () => {},
    handleEdit,
    handleDelete,
    loading: false,
  });

  // If showing the create/edit form, render it instead of the table
  if (showCreateForm) {
    return (
      <CreateConsultant
        initialValues={editingConsultant || {}}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
      />
    );
  }

  return (
    <Box>
      <CustomTable
        refreshKey={refreshKey}
        columns={columns}
        fetchData={fetchData}
        title="Hotlist Candidates"
        onCreateNew={handleCreateNew} // Pass this if your CustomTable supports it
      />
    </Box>
  );
});

HotList.displayName = "HotList";

export default HotList;