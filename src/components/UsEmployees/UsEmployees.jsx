import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Button,
  MenuItem,
  TextField,
  Stack,
  Box,
  CircularProgress,
} from "@mui/material";
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
import httpService from "../../Services/httpService";

// ============================================================
// TEST EMPLOYEE IDs to be filtered out
// ============================================================
const TEST_EMPLOYEE_IDS = [
  "ADRTIN9099",
  "ADRTIN9092",
  "ADRTIN3333",
  "ADRTIN3131",
  "ADRTIN2121",
  "ADRTIN004",
  "ADRTIN9940",
  "ADRTUS9988",
  "ADRTIN1235",
  "ADRTIN9123",
  "ADRTIN9229",
  "ADRTUS5007",
  "ADRTUS0100",
  "ADRTUS0990",
  "ADRTUS5000",
  "ADRTUS5001",
  "ADRTUS5002",
  "ADRTUS5003",
  "ADRTUS5004",
  "ADRTUS0041",
];

// ============================================================
// Helpers
// ============================================================
const getBody = (response) => response?.data || response || {};

const normalizeArrayPayload = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  const body = getBody(value);
  const payload = body?.payload || body?.data || body;
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload?.users)) return payload.users.filter(Boolean);
  if (Array.isArray(payload?.employees)) return payload.employees.filter(Boolean);
  if (Array.isArray(payload?.data)) return payload.data.filter(Boolean);
  return [];
};

const getEmployeeId = (user) => user?.employeeId || user?.userId || "";

const formatDateForInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
};

/**
 * Normalize a single user row coming from /users/employee API.
 * The API already provides: designation, reportingManager, roles (as string), etc.
 */
const normalizeUserRow = (user) => {
  const rolesValue = user.roles || user.role || "";
  const roles = Array.isArray(rolesValue)
    ? rolesValue
    : String(rolesValue)
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

  return {
    ...user,
    userId: user.employeeId || user.userId || "",
    userName: user.userName || user.name || "",
    roles,
    designation: user.designation || "",
    reportingManager: user.reportingManager || "",
    department: user.department || "",
    personalemail: user.personalemail || user.personalEmail || "",
    phoneNumber: user.phoneNumber || user.phone || "",
  };
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

  // statusFilter: "all" | "active" | "inactive" | "isolated"
  const [statusFilter, setStatusFilter] = useState("active");
  // typeFilter: "internal" | "external" | "" (empty = none selected, only when All)
  const [typeFilter, setTypeFilter] = useState("internal");

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

  // ============================================================
  // ✅ API endpoint selection
  //   - "All" tab → generic /users/employee (no status/type)
  //   - Otherwise → dynamic endpoint based on status + type
  // ============================================================
  const getEndpoint = useCallback(() => {
    // When "All" is selected, use the generic endpoint
    if (statusFilter === "all") {
      return "/users/employee";
    }

    const isExternal = typeFilter === "external";

    if (statusFilter === "active") {
      return isExternal
        ? "/users/active-external/employee"
        : "/users/active-internal/employee";
    }
    if (statusFilter === "inactive") {
      return isExternal
        ? "/users/inactive-external/employee"
        : "/users/inactive-internal/employee";
    }
    if (statusFilter === "isolated") {
      return isExternal
        ? "/users/isolated-external/employee"
        : "/users/isolated-internal/employee";
    }
    // Fallback
    return "/users/employee";
  }, [statusFilter, typeFilter]);

  // ============================================================
  // ✅ SINGLE API CALL — dynamic endpoint based on tabs
  // ============================================================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const endpoint = getEndpoint();
      const response = await httpService.get(endpoint, {
        entity: "US",
      });

      const rawUsers = normalizeArrayPayload(response);

      // 1) Remove test accounts
      const withoutTestAccounts = rawUsers.filter((user) => {
        const id = getEmployeeId(user);
        return !TEST_EMPLOYEE_IDS.includes(id);
      });

      // 2) Apply internal / external filter ONLY when a type is selected
      //    (i.e., not on "All" tab where typeFilter is "")
      const byType = withoutTestAccounts.filter((user) => {
        if (!typeFilter) return true;

        const userRoles = Array.isArray(user.roles)
          ? user.roles
          : String(user.roles || "")
              .split(",")
              .map((r) => r.trim());
        const isExternalRole = userRoles.some((r) =>
          String(r).toUpperCase().includes("EXTERNALEMPLOYEE")
        );
        const isCandidate =
          String(user.designation || "").toLowerCase() === "candidate";
        return typeFilter === "external"
          ? isExternalRole || isCandidate
          : !isExternalRole;
      });

      // 3) Normalize rows for the table
      const normalized = byType.map(normalizeUserRow);

      setEmployees(normalized);
      setTotal(normalized.length);
    } catch (error) {
      if (error?.response?.status === 204) {
        setEmployees([]);
        setTotal(0);
      } else {
        console.error("Error fetching employees:", error);
        showErrorToast("Failed to load employees");
        setEmployees([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [getEndpoint, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // ============================================================
  // Client-side search
  // ============================================================
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter((user) => {
      const blob = [
        user.userId,
        user.employeeId,
        user.userName,
        user.email,
        user.personalemail,
        user.phoneNumber,
        user.status,
        user.designation,
        user.reportingManager,
        user.department,
        Array.isArray(user.roles) ? user.roles.join(" ") : user.roles,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [employees, search]);

  // ============================================================
  // Paginated rows
  // ============================================================
  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredEmployees.slice(start, start + rowsPerPage);
  }, [filteredEmployees, page, rowsPerPage]);

  /** ---------------- Delete ---------------- */
  const handleDelete = useCallback((row) => {
    const deleteAction = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/users/delete/${row.userId || row.employeeId}`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error("Failed to delete employee");
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

  // ✅ When "All" is selected, deselect both Internal and External
  const handleStatusFilterChange = (key) => {
    setStatusFilter(key);
    if (key === "all") {
      setTypeFilter("");
    } else if (!typeFilter) {
      // If a specific status is chosen and no type was selected, default to internal
      setTypeFilter("internal");
    }
    setPage(0);
  };

  const handleTypeFilterChange = (key) => {
    // Toggle: clicking the same type again deselects it
    if (typeFilter === key) {
      setTypeFilter("");
    } else {
      setTypeFilter(key);
    }
    setPage(0);
  };

  /** ---------------- Edit ---------------- */
  const handleEdit = (row) => {
    const currentRole = Array.isArray(row.roles)
      ? row.roles[0] || ""
      : row.roles || "";

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
    setFormValues((prev) => ({
      ...prev,
      [field]:
        field === "phoneNumber"
          ? value.replace(/\D/g, "").slice(0, 10)
          : value,
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
      if (!response.ok) throw new Error("Failed to update employee");
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
      {/* Filter buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2, mt: 1 }}>
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent="center"
          alignItems="center"
        >
          {[
            { key: "all", label: "All", minWidth: 80 },
            { key: "active", label: "Active", minWidth: 100 },
            { key: "inactive", label: "In-Active", minWidth: 100 },
            { key: "isolated", label: "Isolated", minWidth: 100 },
          ].map(({ key, label, minWidth }) => (
            <Button
              key={key}
              variant={statusFilter === key ? "contained" : "outlined"}
              onClick={() => handleStatusFilterChange(key)}
              sx={{
                textTransform: "none",
                minWidth,
                backgroundColor:
                  statusFilter === key ? "#F26322" : "transparent",
                color: statusFilter === key ? "white" : "inherit",
                borderColor:
                  statusFilter === key ? "#F26322" : "rgba(0, 0, 0, 0.23)",
                "&:hover": {
                  backgroundColor:
                    statusFilter === key
                      ? "#F26322"
                      : "rgba(242, 99, 34, 0.04)",
                  borderColor:
                    statusFilter === key ? "#F26322" : "rgba(0, 0, 0, 0.23)",
                },
              }}
            >
              {label}
            </Button>
          ))}

          <Box sx={{ width: 16 }} />

          {[
            { key: "internal", label: "Internal" },
            { key: "external", label: "External" },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={typeFilter === key ? "contained" : "outlined"}
              onClick={() => handleTypeFilterChange(key)}
              // ✅ Disable type buttons when "All" is selected
              disabled={statusFilter === "all"}
              sx={{
                textTransform: "none",
                minWidth: 100,
                backgroundColor:
                  typeFilter === key ? "#F26322" : "transparent",
                color: typeFilter === key ? "white" : "inherit",
                borderColor:
                  typeFilter === key ? "#F26322" : "rgba(0, 0, 0, 0.23)",
                "&:hover": {
                  backgroundColor:
                    typeFilter === key
                      ? "#F26322"
                      : "rgba(242, 99, 34, 0.04)",
                  borderColor:
                    typeFilter === key ? "#F26322" : "rgba(0, 0, 0, 0.23)",
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              {label}
            </Button>
          ))}
        </Stack>
      </Box>

      <CustomDataTable
        title="US Employees"
        columns={columns}
        rows={paginatedRows}
        total={filteredEmployees.length}
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
        debounceDelay={500}
      />

      {/* Edit Dialog */}
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