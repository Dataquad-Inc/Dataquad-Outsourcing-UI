import React, { useEffect, useCallback } from "react";
import { Box, useTheme } from "@mui/material";
import CustomTable from "../../ui-lib/CustomTable";
import getHotListColumns from "./hotListColumns";
import CreateConsultant from "./CreateConsultant";
import { useNavigate } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchTeamConsultants,
  fetchAllConsultants,
  deleteConsultant,
  setShowCreateForm,
  setEditingConsultant,
  clearEditingConsultant,
  clearErrors,
  selectTeamConsultants,
  selectTeamConsultantsTotal,
  selectTeamConsultantsLoading,
  selectTeamConsultantsError,
  selectAllConsultants,
  selectAllConsultantsTotal,
  selectAllConsultantsLoading,
  selectAllConsultantsError,
  selectIsDeleting,
  selectDeleteError,
  selectShowCreateForm,
  selectEditingConsultant,
} from "../../redux/hotlist";

const TeamConsultantsHotlist = React.memo(() => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Selectors
  const { userId, role } = useSelector((state) => state.auth);
  const isSuperAdmin = role === "SUPERADMIN";
  const navigate = useNavigate()
  
  // Conditional selectors based on role
  const consultants = useSelector(
    isSuperAdmin ? selectAllConsultants : selectTeamConsultants
  );
  const total = useSelector(
    isSuperAdmin ? selectAllConsultantsTotal : selectTeamConsultantsTotal
  );
  const loading = useSelector(
    isSuperAdmin ? selectAllConsultantsLoading : selectTeamConsultantsLoading
  );
  const error = useSelector(
    isSuperAdmin ? selectAllConsultantsError : selectTeamConsultantsError
  );
  
  const isDeleting = useSelector(selectIsDeleting);
  const deleteError = useSelector(selectDeleteError);
  const showCreateForm = useSelector(selectShowCreateForm);
  const editingConsultant = useSelector(selectEditingConsultant);

  const [refreshKey, setRefreshKey] = React.useState(0);

  // Error handling
  useEffect(() => {
    if (error) showErrorToast(error);
    if (deleteError) showErrorToast(deleteError);
  }, [error, deleteError]);

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  const handleEdit = useCallback(
    (row) => {
      const { teamleadName, recruiterName, consultantAddedTimeStamp, updatedTimeStamp, ...rest } = row;
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

      // Refresh data based on role
      if (isSuperAdmin) {
        dispatch(
          fetchAllConsultants({
            page: 0,
            size: 10,
          })
        );
      } else {
        dispatch(
          fetchTeamConsultants({
            userId,
            page: 0,
            size: 10,
          })
        );
      }
    },
    [dispatch, userId, isSuperAdmin]
  );

  const fetchData = useCallback(
    async ({ page = 1, pageSize = 10, filters = {}, sort = {} }) => {
      try {
        const apiPage = Math.max(page - 1, 0);
        
        let result;
        if (isSuperAdmin) {
          result = await dispatch(
            fetchAllConsultants({
              page: apiPage,
              size: pageSize,
              filters,
              sort,
            })
          ).unwrap();
        } else {
          result = await dispatch(
            fetchTeamConsultants({
              userId,
              page: apiPage,
              size: pageSize,
              filters,
              sort,
            })
          ).unwrap();
        }
        
        console.log(result);

        return {
          data: result.data,
          total: result.total,
        };
      } catch (error) {
        console.error("Error fetching hotlist data:", error);
        return { data: [], total: 0 };
      }
    },
    [dispatch, userId, isSuperAdmin]
  );

  const handleDelete = useCallback(
    (row) => {
      const deleteConsultantAction = async () => {
        try {
          const result = await dispatch(
            deleteConsultant(row.consultantId)
          ).unwrap();
          showSuccessToast(result.message);
          setRefreshKey((prevKey) => prevKey + 1);
        } catch (error) {
          console.error("Delete error:", error);
        }
      };

      showDeleteConfirm(deleteConsultantAction, row.name || "this consultant");
    },
    [dispatch]
  );

    const handleNavigate = (consultantId)=>{
    navigate(`/dashboard/hotlist/team-consultants/${consultantId}`)
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
          title={isSuperAdmin ? "Master Hotlist" : "My Team Hotlist"}
          onCreateNew={handleCreateNew}
          loading={loading}
        />
      )}
    </Box>
  );
});

export default TeamConsultantsHotlist;