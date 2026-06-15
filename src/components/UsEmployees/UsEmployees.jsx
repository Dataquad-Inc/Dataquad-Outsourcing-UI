import React, { useState, useCallback } from "react";
import { Button, MenuItem, TextField, Stack } from "@mui/material";
import { useSelector } from "react-redux";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getEmployeeColumns from "./EmployeeTableColumnConfig";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";
import { CustomModal } from "../../ui-lib/CustomModal";

const UsEmployees = () => {
  const { role } = useSelector((state) => state.auth);
  const canManageEmployees = role !== "COORDINATOR";
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formValues, setFormValues] = useState({ roles: "", status: "" });

  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const BASE_URL = "https://mymulya.com";
  const roleOptions = [
    { value: "EMPLOYEE", label: "Employee" },
    { value: "ADMIN", label: "Admin" },
    { value: "SUPERADMIN", label: "SuperAdmin" },
    { value: "TEAMLEAD", label: "Team Lead" },
    { value: "RECRUITER", label: "Recruiter" },
    { value: "SALESEXECUTIVE", label: "Sales Executive" },
    { value: "GRANDSALES", label: "Grand Sales" },
    { value: "COORDINATOR", label: "Coordinator" },
    { value: "HRMS", label: "HRMS" },
  ];

  /** ---------------- Fetch Employees ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const apiPage = Math.max(page, 0);
      const categoryQuery =
        selectedFilter && selectedFilter !== "all"
          ? `&category=${encodeURIComponent(selectedFilter)}`
          : "";

      const response = await fetch(
        `${BASE_URL}/hotlist/user/allUsers?page=${apiPage}&size=${rowsPerPage}&search=${encodeURIComponent(
          search
        )}${categoryQuery}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const result = await response.json();

      const data = result?.data?.content ?? [];
      const totalElements = result?.data?.totalElements ?? data.length;

      setEmployees(data);
      setTotal(totalElements);

    } catch (error) {
      console.error("Error fetching employees:", error);
      showErrorToast("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, selectedFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  /** ---------------- Delete ---------------- */
  const handleDelete = useCallback((row) => {
    const deleteAction = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/users/delete/${row.userId}`,
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

  /** ---------------- Create ---------------- */
  const handleCreateNew = () => {
    showInfoToast("Create new employee clicked");
  };

  const handleCategoryFilterChange = (filterKey) => {
    setSelectedFilter(filterKey);
    setPage(0);
    setRefreshKey((prev) => prev + 1);
  };

  /** ---------------- Edit ---------------- */
  const handleEdit = (row) => {
    const currentRole = Array.isArray(row.roles) ? row.roles[0] || "" : row.roles || "";
    setSelectedEmployee(row);
    setFormValues({
      roles: currentRole,
      status: row.status || "",
    });
    setOpenEdit(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...selectedEmployee,
        ...formValues,
        // ✅ FIX: Send roles as string, not array
        roles: formValues.roles,
      };

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

  /** ---------------- Columns ---------------- */
  const columns = getEmployeeColumns({
    handleEdit,
    handleDelete,
    loading,
    canManage: canManageEmployees,
  });

  /** ---------------- Render ---------------- */
  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }} marginTop={1}>
        {[
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "inactive", label: "In-Active" },
          { key: "internal", label: "Internal" },
          { key: "external", label: "External" },
          // { key: "external-placed", label: "External Placed" },
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={selectedFilter === filter.key ? "contained" : "outlined"}
            onClick={() => handleCategoryFilterChange(filter.key)}
            sx={{ textTransform: "none", minWidth: 150 }}
          >
            {filter.label}
          </Button>
        ))}
      </Stack>

      <CustomDataTable
        title="US Employees"
        columns={columns}
        rows={employees}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        search={search}
        loading={loading}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        onSearchChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        onSearchClear={() => {
          setSearch("");
          setPage(0);
        }}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        onCreateNew={handleCreateNew}
      />

      {/* ✅ Edit Dialog */}
      <CustomModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title={`Edit Employee - ${selectedEmployee?.userName}`}
        actions={
          <>
            <Button onClick={() => setOpenEdit(false)} variant="outlined">
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave}>
              Update Employee
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
            {roleOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
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
