import React, { useState, useCallback } from "react";
import { Button, MenuItem, TextField, Stack } from "@mui/material";
import CustomDataTable from "../../ui-lib/CustomDataTable"; // ✅ use same table as MasterHotlist
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
  const [formValues, setFormValues] = useState({ roles: "", status: "" });

  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");

  const BASE_URL = "https://mymulya.com";

  /** ---------------- Fetch Employees ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const apiPage = Math.max(page, 0);

      const response = await fetch(
        `${BASE_URL}/hotlist/user/allUsers?page=${apiPage}&size=${rowsPerPage}&keyword=${search}`
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
  }, [page, rowsPerPage, search]);

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

  /** ---------------- Edit ---------------- */
  const handleEdit = (row) => {
    setSelectedEmployee(row);
    setFormValues({
      roles: row.roles || "",
      status: row.status || "",
    });
    setOpenEdit(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...selectedEmployee,
        ...formValues,
        roles: [formValues.roles], // ensure roles is array
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
  const columns = getEmployeeColumns({ handleEdit, handleDelete, loading });

  /** ---------------- Render ---------------- */
  return (
    <>
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
            <Button onClick={() => setOpenEdit(false)} variant="outlined">Cancel</Button>
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
            <MenuItem value="EMPLOYEE">Employee</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="SUPERADMIN">SuperAdmin</MenuItem>
            <MenuItem value="TEAMLEAD">Team Lead</MenuItem>
            <MenuItem value="RECRUITER">Recruiter</MenuItem>
            <MenuItem value="SALESEXECUTIVE">Sales Executive</MenuItem>
            <MenuItem value="GRANDSALES">Grand Sales</MenuItem>
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
