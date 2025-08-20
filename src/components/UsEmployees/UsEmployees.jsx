import React, { useState, useCallback } from "react";
import { Button, MenuItem, TextField, Stack } from "@mui/material";
import CustomTable from "../../ui-lib/CustomTable";
import getEmployeeColumns from "./EmployeeTableColumnConfig";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";
import { CustomModal } from "../../ui-lib/CustomModal";

const UsEmployees = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formValues, setFormValues] = useState({ role: "", status: "" });

  const BASE_URL = "https://mymulya.com";

  // ✅ Server-side fetch
  const fetchData = useCallback(async ({ page = 1, pageSize = 10 }) => {
    try {
      setLoading(true);
      const apiPage = Math.max(page - 1, 0);

      const response = await fetch(
        `${BASE_URL}/hotlist/user/allUsers?page=${apiPage}&size=${pageSize}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const result = await response.json();
      setLoading(false);

      const data = result?.data?.content ?? [];
      const total = result?.data?.totalElements ?? data.length;

      return { data, total };
    } catch (error) {
      setLoading(false);
      console.error("Error fetching employees:", error);
      showErrorToast("Failed to load employees");
      return { data: [], total: 0 };
    }
  }, []);

  // ✅ Delete
  const handleDelete = useCallback((row) => {
    const deleteAction = async () => {
      try {
        const response = await fetch(
          `http://192.168.0.115:8092/hotlist/user/${row.employeeId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to delete employee");
        }

        const result = await response.json();
        showSuccessToast(result.message || "Employee deleted successfully");
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Delete error:", error);
        showErrorToast("Failed to delete employee");
      }
    };

    showDeleteConfirm(deleteAction, row.userName || "this employee");
  }, []);

  const handleCreateNew = () => {
    showInfoToast("Create new employee clicked");
  };

  // ✅ Open Edit Dialog
  const handleEdit = (row) => {
    setSelectedEmployee(row);
    setFormValues({
      role: row.roles || "",
      status: row.status || "",
    });
    setOpenEdit(true);
  };

  // ✅ Save Edit
  const handleSave = async () => {
    try {
      // merge: keep all existing fields from selectedEmployee,
      // overwrite with formValues
      const payload = {
        ...selectedEmployee,
        ...formValues,
        roles: [formValues.roles], // ensure roles is an array
      };

      // Remove unwanted fields
      delete payload.password;
      delete payload.confirmPassword;

      const response = await fetch(
        `${BASE_URL}/users/update/${selectedEmployee.userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update employee");
      }

      const result = await response.json();
      showSuccessToast(result.message || "Employee updated successfully");

      setOpenEdit(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Update error:", error);
      showErrorToast("Failed to update employee");
    }
  };

  const columns = getEmployeeColumns({ handleEdit, handleDelete, loading });

  return (
    <>
      <CustomTable
        refreshKey={refreshKey}
        columns={columns}
        fetchData={fetchData}
        title="US Employees"
        onCreateNew={handleCreateNew}
        loading={loading}
      />

      {/* ✅ Edit Dialog */}
      <CustomModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title={`Edit Employee - ${selectedEmployee?.userName}`}
        actions={
          <>
            <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>
              Save
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Role"
            value={formValues.roles}
            onChange={(e) =>
              setFormValues({ ...formValues, roles: e.target.value })
            }
            fullWidth
          >
            <MenuItem value="EMPLOYEE">Employee</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="SUPERADMIN">SuperAdmin</MenuItem>
            <MenuItem value="TEAMLEAD">Team Lead</MenuItem>
            <MenuItem value="RECRUITER">Recruiter</MenuItem>
          </TextField>

          <TextField
            select
            label="Status"
            value={formValues.status}
            onChange={(e) =>
              setFormValues({ ...formValues, status: e.target.value })
            }
            fullWidth
          >
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </TextField>
        </Stack>
      </CustomModal>
    </>
  );
};

export default UsEmployees;
