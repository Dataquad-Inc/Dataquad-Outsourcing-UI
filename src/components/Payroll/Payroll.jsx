import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DownloadOutlined,
  ReceiptLongOutlined,
  Refresh,
  Search,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import httpService, { API_BASE_URL } from "../../Services/httpService";
import { showToast } from "../../utils/ToastNotification";

const getEmployeeId = (user) => user?.employeeId || user?.userId || "";

const normalizeArrayPayload = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  const body = value?.data || value;
  const payload = body?.payload || body?.data || body;
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload?.users)) return payload.users.filter(Boolean);
  if (Array.isArray(payload?.employees)) return payload.employees.filter(Boolean);
  if (Array.isArray(payload?.data)) return payload.data.filter(Boolean);
  return [];
};

const TEST_EMPLOYEE_IDS = new Set([
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
]);

const Payroll = () => {
  const { entity, userId: loggedInUserId } = useSelector((state) => state.auth);
  const activeEntity = (entity || "IN").toUpperCase();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [payslipDialog, setPayslipDialog] = useState({
    open: false,
    userId: "",
    name: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });
  const [payslipForm, setPayslipForm] = useState({
    payPeriod: "",
    payableDays: "",
    paymentDate: "",
    grossConsultancyFee: "",
  });
  const [payslipHistory, setPayslipHistory] = useState([]);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [payslipGenerating, setPayslipGenerating] = useState(false);

  const payslipPreview = useMemo(() => {
    const gross = Number(payslipForm.grossConsultancyFee);
    if (!Number.isFinite(gross) || gross <= 0) {
      return { tds: "", net: "" };
    }
    const tds = Math.round(gross * 0.02);
    const net = Math.round((gross - tds) * 100) / 100;
    return {
      tds: tds.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      net: net.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };
  }, [payslipForm.grossConsultancyFee]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [internalRes, externalRes] = await Promise.all([
        httpService.get("/users/active-internal/employee", { entity: activeEntity }),
        httpService.get("/users/active-external/employee", { entity: activeEntity }),
      ]);
      const combined = [
        ...normalizeArrayPayload(internalRes),
        ...normalizeArrayPayload(externalRes),
      ].filter((user) => !TEST_EMPLOYEE_IDS.has(String(getEmployeeId(user)).toUpperCase()));
      setUsers(combined);
    } catch (error) {
      console.error(error);
      showToast("Unable to load employees for payroll", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [activeEntity]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const id = String(getEmployeeId(user)).toLowerCase();
      const name = String(user.userName || user.employeeName || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const designation = String(user.designation || "").toLowerCase();
      return id.includes(q) || name.includes(q) || email.includes(q) || designation.includes(q);
    });
  }, [users, query]);

  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const openPayslipDialog = async (user) => {
    const employeeId = getEmployeeId(user);
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setPayslipDialog({
      open: true,
      userId: employeeId,
      name: user.userName || user.employeeName || "",
      bankName: user.bankName || "",
      accountNumber: user.accountNumber || user.bankAccountNumber || "",
      ifscCode: user.ifscCode || user.ifsc || "",
    });
    setPayslipForm({
      payPeriod: defaultPeriod,
      payableDays: "",
      paymentDate: now.toISOString().slice(0, 10),
      grossConsultancyFee: "",
    });
    setPayslipHistory([]);
    setPayslipLoading(true);
    try {
      const profileRes = await httpService.get(`/users/profile/${employeeId}`);
      const profile = profileRes?.data?.data || profileRes?.data?.payload || profileRes?.data || {};
      setPayslipDialog((prev) => ({
        ...prev,
        bankName: profile.bankName || prev.bankName,
        accountNumber: profile.accountNumber || profile.bankAccountNumber || prev.accountNumber,
        ifscCode: profile.ifscCode || profile.ifsc || prev.ifscCode,
        name: profile.userName || profile.name || prev.name,
      }));
    } catch (_) {
      /* list row values are enough */
    }
    try {
      const response = await httpService.get(`/users/payslips/${employeeId}`);
      const list = response?.data?.data || response?.data || [];
      setPayslipHistory(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to load payslip history", error);
      setPayslipHistory([]);
    } finally {
      setPayslipLoading(false);
    }
  };

  const closePayslipDialog = () => {
    if (payslipGenerating) return;
    setPayslipDialog({
      open: false,
      userId: "",
      name: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
    });
    setPayslipHistory([]);
  };

  const handleGeneratePayslip = async () => {
    const { userId } = payslipDialog;
    const payableDays = Number(payslipForm.payableDays);
    const gross = Number(payslipForm.grossConsultancyFee);
    if (!userId) {
      showToast("Employee ID missing", "error");
      return;
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(payslipForm.payPeriod)) {
      showToast("Pay period must be YYYY-MM", "error");
      return;
    }
    if (!Number.isFinite(payableDays) || payableDays < 1 || payableDays > 31) {
      showToast("Payable days must be between 1 and 31", "error");
      return;
    }
    if (!payslipForm.paymentDate) {
      showToast("Payment date is required", "error");
      return;
    }
    if (!Number.isFinite(gross) || gross <= 0) {
      showToast("Enter a valid gross consultancy fee", "error");
      return;
    }

    setPayslipGenerating(true);
    try {
      const response = await httpService.post("/users/payslips/generate", {
        userId,
        payPeriod: payslipForm.payPeriod,
        payableDays,
        paymentDate: payslipForm.paymentDate,
        grossConsultancyFee: gross,
        createdBy: loggedInUserId || undefined,
      });
      const dto = response?.data?.data || response?.data;
      showToast(response?.data?.message || "Payment advice generated", "success");
      if (dto) {
        setPayslipHistory((prev) => {
          const rest = prev.filter((item) => item.payPeriod !== dto.payPeriod);
          return [dto, ...rest];
        });
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.errorMessage ||
        error?.message ||
        "Failed to generate payment advice";
      showToast(message, "error");
    } finally {
      setPayslipGenerating(false);
    }
  };

  const handleDownloadPayslip = async (payPeriod) => {
    const userId = payslipDialog.userId;
    if (!userId || !payPeriod) return;
    try {
      const response = await fetch(`${API_BASE_URL}/users/payslips/${userId}/${payPeriod}/pdf`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PaymentAdvice_${userId}_${payPeriod}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("Payment advice downloaded", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to download PDF", "error");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" color="primary" fontWeight={700}>
            Payroll
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate and download Payment Advice PDFs for {activeEntity} employees.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
          <TextField
            size="small"
            placeholder="Search employees"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadUsers} disabled={loading}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined">
        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "primary.contrastText" }}>
                      Employee ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "primary.contrastText" }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "primary.contrastText" }}>
                      Designation
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "primary.contrastText" }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "primary.main", color: "primary.contrastText" }}>
                      Status
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, bgcolor: "primary.main", color: "primary.contrastText" }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const employeeId = getEmployeeId(user);
                    return (
                      <TableRow key={employeeId || user.email} hover>
                        <TableCell>{employeeId || "-"}</TableCell>
                        <TableCell>{user.userName || user.employeeName || "-"}</TableCell>
                        <TableCell>{user.designation || "-"}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={user.status || "-"}
                            color={String(user.status).toUpperCase() === "ACTIVE" ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Generate Payment Advice">
                            <IconButton color="primary" size="small" onClick={() => openPayslipDialog(user)}>
                              <ReceiptLongOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!paginatedUsers.length && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Alert severity="info">No employees found{query ? " for this search." : "."}</Alert>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredUsers.length}
              page={page}
              onPageChange={(event, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </>
        )}
      </Paper>

      <Dialog open={payslipDialog.open} onClose={closePayslipDialog} fullWidth maxWidth="sm">
        <DialogTitle>Generate Payment Advice</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Consultant: <strong>{payslipDialog.name || payslipDialog.userId}</strong>
            {payslipDialog.userId ? ` (${payslipDialog.userId})` : ""}
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Pay Period"
              type="month"
              value={payslipForm.payPeriod}
              onChange={(e) => setPayslipForm((prev) => ({ ...prev, payPeriod: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Payable Days"
              type="number"
              value={payslipForm.payableDays}
              onChange={(e) => setPayslipForm((prev) => ({ ...prev, payableDays: e.target.value }))}
              inputProps={{ min: 1, max: 31 }}
              fullWidth
            />
            <TextField
              label="Payment Date"
              type="date"
              value={payslipForm.paymentDate}
              onChange={(e) => setPayslipForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Gross Consultancy Fee (₹)"
              type="number"
              value={payslipForm.grossConsultancyFee}
              onChange={(e) =>
                setPayslipForm((prev) => ({ ...prev, grossConsultancyFee: e.target.value }))
              }
              inputProps={{ min: 0, step: "0.01" }}
              fullWidth
            />
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "grey.50" }}>
              <Typography variant="body2">
                TDS @ 2%: <strong>{payslipPreview.tds || "-"}</strong>
              </Typography>
              <Typography variant="body2">
                Net Amount Payable: <strong>{payslipPreview.net || "-"}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Bank: {payslipDialog.bankName || "-"} | A/C: {payslipDialog.accountNumber || "-"} | IFSC:{" "}
                {payslipDialog.ifscCode || "-"}
              </Typography>
            </Paper>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                History
              </Typography>
              {payslipLoading ? (
                <CircularProgress size={20} />
              ) : payslipHistory.length ? (
                <Stack spacing={1}>
                  {payslipHistory.map((item) => (
                    <Stack
                      key={`${item.payPeriod}-${item.id}`}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, px: 1.5, py: 1 }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {item.payPeriodLabel || item.payPeriod}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Net ₹
                          {Number(item.netPayable || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        startIcon={<DownloadOutlined />}
                        onClick={() => handleDownloadPayslip(item.payPeriod)}
                      >
                        PDF
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Alert severity="info">No payment advice generated yet for this consultant.</Alert>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePayslipDialog} disabled={payslipGenerating}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleGeneratePayslip}
            disabled={payslipGenerating}
            startIcon={
              payslipGenerating ? <CircularProgress size={16} color="inherit" /> : <ReceiptLongOutlined />
            }
          >
            Generate PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll;
