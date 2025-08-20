import React, { useEffect, useCallback } from "react";
import { Box, useTheme } from "@mui/material";
import CustomTable from "../../ui-lib/CustomTable";
import getHotListColumns from "./hotListColumns";
import CreateConsultant from "./CreateConsultant"; // Import the CreateHotListUser component
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";



// Redux imports
import {
  fetchConsultants,
  fetchTeamConsultants,
  deleteConsultant,
  setShowCreateForm,
  setEditingConsultant,
  clearEditingConsultant,
  clearErrors,
  selectConsultants,
  selectTotal,
  selectLoading,
  selectError,
  selectIsDeleting,
  selectDeleteError,
  selectShowCreateForm,
  selectEditingConsultant,
} from "../../redux/hotlist"; // Adjust path as needed


const HotList = React.memo(() => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Selectors
  const { userId , role } = useSelector((state) => state.auth);
  const consultants = useSelector(selectConsultants);
  const total = useSelector(selectTotal);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const isDeleting = useSelector(selectIsDeleting);
  const deleteError = useSelector(selectDeleteError);
  const showCreateForm = useSelector(selectShowCreateForm);
  const editingConsultant = useSelector(selectEditingConsultant);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const navigate = useNavigate()

  // Error handling
  useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
    if (deleteError) {
      showErrorToast(deleteError);
    }
  }, [error, deleteError]);

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  const handleEdit = useCallback(
    (row) => {
      const { teamleadName, recruiterName,consultantAddedTimeStamp,updatedTimeStamp, ...rest } = row;
      dispatch(setEditingConsultant(rest));
    },
    [dispatch]
  );

  const handleCreateNew = useCallback(() => {
    dispatch(setEditingConsultant(null));
    dispatch(setShowCreateForm(true));
  }, [dispatch]);

  const handleFormCancel = useCallback(() => {
    dispatch(clearEditingConsultant());
  }, [dispatch]);

  const handleFormSuccess = useCallback(
    (data, action) => {
      dispatch(clearEditingConsultant());

      const message =
        action === "create"
          ? "Consultant created successfully!"
          : "Consultant updated successfully!";
      showSuccessToast(message);

      // Refresh the data by fetching again
      dispatch(
        fetchConsultants({
          userId,
          page: 0,
          size: 10,
        })
      );
    },
    [dispatch, userId]
  );

  const fetchData = useCallback(
    async ({ page = 1, pageSize = 10, filters = {}, sort = {} }) => {
      try {
        const apiPage = Math.max(page - 1, 0);
        const result = await dispatch(
          fetchConsultants({
            userId,
            page: apiPage,
            size: pageSize,
            filters,
            sort,
          })
        ).unwrap();

        return {
          data: result.data,
          total: result.total,
        };
      } catch (error) {
        console.error("Error fetching hotlist data:", error);
        return {
          data: [],
          total: 0,
        };
      }
    },
    [dispatch, userId]
  );

  const handleDelete = useCallback(
    (row) => {
      const deleteConsultantAction = async () => {
        try {
          const result = await dispatch(
            deleteConsultant(row.consultantId)
          ).unwrap();
          showSuccessToast(result.message);

          // 🔁 Trigger table refresh
          setRefreshKey((prevKey) => prevKey + 1);
        } catch (error) {
          console.error("Delete error:", error);
        }
      };

      showDeleteConfirm(
        deleteConsultantAction,
        row.name || "this consultant"
      );
    },
    [dispatch]
  );

  const handleNavigate = (consultantId)=>{
    navigate(`/dashboard/hotlist/consultants/${consultantId}`)
  }

  const columns = getHotListColumns({
    handleNavigate,
    handleEdit,
    handleDelete,
    loading: isDeleting,
  });

  return (
    <Box>
      {showCreateForm ? (
        <CreateConsultant
          initialValues={editingConsultant || {}}
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
        />
      ) : (
        <CustomTable
          refreshKey={refreshKey}
          columns={columns}
          fetchData={fetchData}
          title="My Assigned Hotlist"
          onCreateNew={handleCreateNew} // Pass this if your CustomTable supports it
          loading={loading}
        />
      )}
    </Box>
  );
});

HotList.displayName = "HotList";

export default HotList;
