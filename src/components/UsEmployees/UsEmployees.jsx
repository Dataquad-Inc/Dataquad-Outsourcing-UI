import React, { useState, useCallback } from "react";
import { Button, MenuItem, TextField, Stack, Box } from "@mui/material";
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

const formatDateForInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
};

const UsEmployees = () => {
  const { role } = useSelector((state) => state.auth);
  const canManageEmployees = role !== "COORDINATOR";
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formValues, setFormValues] = useState({
    userName: "",
    joiningDate: "",
    phoneNumber: "",
    personalemail: "",
    roles: "",
    status: "",
  });

  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  
  // ✅ Split into two separate filters
  const [statusFilter, setStatusFilter] = useState("active"); // "active", "inactive", "isolated", or "all"
  const [typeFilter, setTypeFilter] = useState("internal"); // "internal" or "external"

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
      
      // Build category query based on both filters
      let categoryQuery = "";
      if (statusFilter && statusFilter !== "all") {
        categoryQuery += `&category=${encodeURIComponent(statusFilter)}`;
      }
      if (typeFilter) {
        categoryQuery += `&type=${encodeURIComponent(typeFilter)}`;
      }

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
  }, [page, rowsPerPage, search, statusFilter, typeFilter]);

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

  // ✅ Separate handlers for each filter
  const handleStatusFilterChange = (filterKey) => {
    setStatusFilter(filterKey);
    setPage(0);
    setRefreshKey((prev) => prev + 1);
  };

  const handleTypeFilterChange = (filterKey) => {
    setTypeFilter(filterKey);
    setPage(0);
    setRefreshKey((prev) => prev + 1);
  };

  /** ---------------- Edit ---------------- */
  const handleEdit = (row) => {
    const currentRole = Array.isArray(row.roles) ? row.roles[0] || "" : row.roles || "";
    setSelectedEmployee(row);
    setFormValues({
      userName: row.userName || "",
      joiningDate: formatDateForInput(row.joiningDate),
      phoneNumber: row.phoneNumber || "",
      personalemail: row.personalemail || "",
      roles: currentRole,
      status: row.status || "",
    });
    setOpenEdit(true);
  };

  const handleEditFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: field === "phoneNumber" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!formValues.userName.trim()) {
        showErrorToast("Name is required");
        return;
      }

      if (!formValues.joiningDate) {
        showErrorToast("Joining date is required");
        return;
      }

      if (!/^\d{10}$/.test(formValues.phoneNumber)) {
        showErrorToast("Phone number must be 10 digits");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.personalemail)) {
        showErrorToast("Enter a valid personal email");
        return;
      }

      const payload = {
        ...selectedEmployee,
        ...formValues,
        roles: formValues.roles,
        phoneNumber: formValues.phoneNumber.replace(/\D/g, ""),
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
      {/* ✅ Filter Buttons with Separate Groups */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, mt: 1 }}>
        <Stack 
          direction="row" 
          spacing={1} 
          flexWrap="wrap" 
          justifyContent="center"
          alignItems="center"
        >
          {/* 🔹 Status Group - All/Active/Inactive/Isolated */}
          <Button
            variant={statusFilter === "all" ? "contained" : "outlined"}
            onClick={() => handleStatusFilterChange("all")}
            sx={{ 
              textTransform: "none", 
              minWidth: 80,
              backgroundColor: statusFilter === "all" ? "#F26322" : "transparent",
              color: statusFilter === "all" ? "white" : "inherit",
              borderColor: statusFilter === "all" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              '&:hover': {
                backgroundColor: statusFilter === "all" ? "#F26322" : "rgba(242, 99, 34, 0.04)",
                borderColor: statusFilter === "all" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              }
            }}
          >
            All
          </Button>

          <Button
            variant={statusFilter === "active" ? "contained" : "outlined"}
            onClick={() => handleStatusFilterChange("active")}
            sx={{ 
              textTransform: "none", 
              minWidth: 100,
              backgroundColor: statusFilter === "active" ? "#F26322" : "transparent",
              color: statusFilter === "active" ? "white" : "inherit",
              borderColor: statusFilter === "active" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              '&:hover': {
                backgroundColor: statusFilter === "active" ? "#F26322" : "rgba(242, 99, 34, 0.04)",
                borderColor: statusFilter === "active" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              }
            }}
          >
            Active
          </Button>
          
          <Button
            variant={statusFilter === "inactive" ? "contained" : "outlined"}
            onClick={() => handleStatusFilterChange("inactive")}
            sx={{ 
              textTransform: "none", 
              minWidth: 100,
              backgroundColor: statusFilter === "inactive" ? "#F26322" : "transparent",
              color: statusFilter === "inactive" ? "white" : "inherit",
              borderColor: statusFilter === "inactive" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              '&:hover': {
                backgroundColor: statusFilter === "inactive" ? "#F26322" : "rgba(242, 99, 34, 0.04)",
                borderColor: statusFilter === "inactive" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              }
            }}
          >
            In-Active
          </Button>

          <Button
            variant={statusFilter === "isolated" ? "contained" : "outlined"}
            onClick={() => handleStatusFilterChange("isolated")}
            sx={{ 
              textTransform: "none", 
              minWidth: 100,
              backgroundColor: statusFilter === "isolated" ? "#F26322" : "transparent",
              color: statusFilter === "isolated" ? "white" : "inherit",
              borderColor: statusFilter === "isolated" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              '&:hover': {
                backgroundColor: statusFilter === "isolated" ? "#F26322" : "rgba(242, 99, 34, 0.04)",
                borderColor: statusFilter === "isolated" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              }
            }}
          >
            Isolated
          </Button>

          {/* Divider */}
          <Box sx={{ width: 16 }} />

          {/* 🔹 Type Group - Internal/External (No "All" button) */}
          <Button
            variant={typeFilter === "internal" ? "contained" : "outlined"}
            onClick={() => handleTypeFilterChange("internal")}
            sx={{ 
              textTransform: "none", 
              minWidth: 100,
              backgroundColor: typeFilter === "internal" ? "#F26322" : "transparent",
              color: typeFilter === "internal" ? "white" : "inherit",
              borderColor: typeFilter === "internal" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              '&:hover': {
                backgroundColor: typeFilter === "internal" ? "#F26322" : "rgba(242, 99, 34, 0.04)",
                borderColor: typeFilter === "internal" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              }
            }}
          >
            Internal
          </Button>
          
          <Button
            variant={typeFilter === "external" ? "contained" : "outlined"}
            onClick={() => handleTypeFilterChange("external")}
            sx={{ 
              textTransform: "none", 
              minWidth: 100,
              backgroundColor: typeFilter === "external" ? "#F26322" : "transparent",
              color: typeFilter === "external" ? "white" : "inherit",
              borderColor: typeFilter === "external" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              '&:hover': {
                backgroundColor: typeFilter === "external" ? "#F26322" : "rgba(242, 99, 34, 0.04)",
                borderColor: typeFilter === "external" ? "#F26322" : "rgba(0, 0, 0, 0.23)",
              }
            }}
          >
            External
          </Button>
        </Stack>
      </Box>

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
            label="Name"
            value={formValues.userName}
            onChange={handleEditFieldChange("userName")}
            fullWidth
          />

          <TextField
            label="Joining Date"
            type="date"
            value={formValues.joiningDate}
            onChange={handleEditFieldChange("joiningDate")}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Phone Number"
            value={formValues.phoneNumber}
            onChange={handleEditFieldChange("phoneNumber")}
            inputProps={{ maxLength: 10 }}
            fullWidth
          />

          <TextField
            label="Personal Email"
            type="email"
            value={formValues.personalemail}
            onChange={handleEditFieldChange("personalemail")}
            fullWidth
          />

          <TextField
            select
            label="Role"
            value={formValues.roles}
            onChange={handleEditFieldChange("roles")}
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
            onChange={handleEditFieldChange("status")}
            fullWidth
          >
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="ISOLATED">Isolated</MenuItem>
          </TextField>
        </Stack>
      </CustomModal>
    </>
  );
};

export default UsEmployees;