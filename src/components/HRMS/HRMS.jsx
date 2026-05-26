import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
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
  BadgeOutlined,
  Close,
  DescriptionOutlined,
  DownloadOutlined,
  EmailOutlined,
  ImageOutlined,
  InsertDriveFileOutlined,
  PhoneOutlined,
  Refresh,
  Search,
  UploadFileOutlined,
  Visibility,
} from "@mui/icons-material";
import httpService, { API_BASE_URL } from "../../Services/httpService";
import { showToast } from "../../utils/ToastNotification";

const emptyProfile = {
  photo: "",
  name: "",
  email: "",
  personalemail: "",
  phoneNumber: "",
  pan: "",
  adhar: "",
  fatherOrSpouseName: "",
  motherName: "",
  dob: "",
  bloodGroup: "",
  gender: "",
  maritalStatus: "",
  currentAddress: "",
  emergencyContactNo: "",
  permanentAddress: "",
  role: "",
  employeeId: "",
  entity: "",
  joiningDate: "",
  officialNumber: "",
  officialEmailId: "",
  probation: "",
  reportingManager: "",
  department: "",
  linkedInUrl: "",
  bankName: "",
  accountNumber: "",
  branch: "",
  accountHolderName: "",
  ifscCode: "",
  uanNumber: "",
  pfNumber: "",
  payrollPanNumber: "",
  payrollAadharNumber: "",
  clearanceForm: "",
  fAndF: "",
  exitFromPfDate: "",
  lastWorkingDay: "",
  isEditable: "false",
};

const getBody = (response) => response?.data || response || {};

const getPayload = (response) => {
  const body = getBody(response);
  const payload = body?.payload || body?.data || body;
  return payload?.profile || payload?.user || payload?.employee || payload || {};
};

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

const normalizeDocumentsPayload = (documents) => {
  if (!documents) return [];
  if (Array.isArray(documents)) return documents.filter(Boolean);
  if (typeof documents === "string") return documents.trim() ? [documents] : [];

  const nested =
    documents.documents ||
    documents.profileDocuments ||
    documents.employeeDocuments ||
    documents.supportingDocuments ||
    documents.attachments ||
    documents.files ||
    documents.data;

  if (nested && nested !== documents) return normalizeDocumentsPayload(nested);
  return [documents];
};

const hasDocumentContent = (source) =>
  Boolean(
    source?.documentData ||
      source?.fileData ||
      source?.fileContent ||
      source?.documentContent ||
      source?.base64Data ||
      source?.encodedFile ||
      source?.encodedData ||
      source?.bytes ||
      source?.fileBytes ||
      source?.contentBytes ||
      source?.byteData ||
      source?.documentBytes ||
      source?.blob ||
      source?.binary ||
      source?.base64 ||
      source?.fileUrl ||
      source?.documentUrl ||
      source?.url ||
      source?.downloadUrl ||
      source?.path ||
      source?.filePath ||
      source?.documentPath ||
      source?.documentFilePath
  );

const getDocumentsPayload = (response) => {
  const body = getBody(response);
  const payload = body?.payload || body?.data || body;
  const profilePayload = getPayload(response);
  const sources = [
    response,
    response?.data,
    response?.payload,
    payload,
    profilePayload,
    payload?.profile,
    payload?.user,
    payload?.employee,
    body,
  ];

  for (const source of sources) {
    const documents = normalizeDocumentsPayload(
      source?.documents ||
        source?.profileDocuments ||
        source?.employeeDocuments ||
        source?.supportingDocuments ||
        source?.attachments ||
        source?.files
    );
    if (documents.length) return documents;
  }

  const contentSources = sources.filter(hasDocumentContent);
  return contentSources.length ? contentSources : [];
};

const getPhotoSrc = (photo) => {
  if (!photo) return "";
  if (photo.startsWith("data:") || photo.startsWith("http") || photo.startsWith("blob:")) {
    return photo;
  }
  if (photo.startsWith("/9j")) return `data:image/jpeg;base64,${photo}`;
  if (photo.startsWith("iVBOR")) return `data:image/png;base64,${photo}`;
  if (photo.startsWith("R0lGOD")) return `data:image/gif;base64,${photo}`;
  if (photo.startsWith("/")) return photo;
  return `data:image/jpeg;base64,${photo}`;
};

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split("T")[0];
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getDocumentName = (document) => {
  if (typeof document === "string") return document;
  return (
    document?.fileName ||
    document?.documentName ||
    document?.name ||
    document?.originalFileName ||
    document?.originalName ||
    document?.filename ||
    document?.file_name ||
    "Document"
  );
};

const getDocumentExtension = (fileName = "") =>
  fileName.split(".").pop()?.toLowerCase() || "";

const getDocumentType = (document) => {
  const extension = getDocumentExtension(getDocumentName(document));
  const mimeType =
    typeof document === "object"
      ? document?.contentType || document?.mimeType || document?.fileType || ""
      : "";
  if (mimeType.includes("pdf") || extension === "pdf") return "pdf";
  if (
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(extension)
  ) {
    return "image";
  }
  return "file";
};

const getDataUrlMimeType = (document) => {
  const type = getDocumentType(document);
  if (type === "pdf") return "application/pdf";
  if (type === "image") {
    const extension = getDocumentExtension(getDocumentName(document));
    if (extension === "png") return "image/png";
    if (extension === "gif") return "image/gif";
    if (extension === "webp") return "image/webp";
    return "image/jpeg";
  }
  return "application/octet-stream";
};

const byteArrayToDataUrl = (bytes, document) => {
  const binary = bytes.reduce(
    (content, byte) => content + String.fromCharCode(Number(byte) & 255),
    ""
  );
  return `data:${getDataUrlMimeType(document)};base64,${window.btoa(binary)}`;
};

const normalizeDocumentSource = (value, document) => {
  if (!value) return "";
  if (Array.isArray(value) && value.every((byte) => Number.isFinite(Number(byte)))) {
    return byteArrayToDataUrl(value, document);
  }
  if (typeof value === "object") {
    if (Array.isArray(value.data) && value.data.every((byte) => Number.isFinite(Number(byte)))) {
      return byteArrayToDataUrl(value.data, document);
    }
    return getDocumentSource(value);
  }
  if (typeof value !== "string") return "";

  const source = value.trim();
  if (source.startsWith("data:") || source.startsWith("blob:") || source.startsWith("http")) {
    return source;
  }

  if (source.startsWith("JVBER") || source.startsWith("/9j") || source.startsWith("iVBOR")) {
    return `data:${getDataUrlMimeType(document)};base64,${source}`;
  }

  if (source.length > 100 && /^[A-Za-z0-9+/=\r\n]+$/.test(source)) {
    return `data:${getDataUrlMimeType(document)};base64,${source}`;
  }

  if (source.startsWith("/")) return source;

  return "";
};

const resolveFileSource = (source) => {
  if (!source) return "";
  if (source.startsWith("data:") || source.startsWith("blob:")) return source;
  if (source.startsWith("http")) return source;
  if (source.startsWith("/")) return `${API_BASE_URL}${source}`;
  return `${API_BASE_URL}/${source.replace(/^[/\\]+/, "")}`;
};

function getDocumentSource(document) {
  if (!document) return "";
  if (typeof document === "string") return normalizeDocumentSource(document, document);

  const source =
    document.fileUrl ||
    document.documentUrl ||
    document.url ||
    document.downloadUrl ||
    document.path ||
    document.filePath ||
    document.documentPath ||
    document.documentFilePath ||
    document.location ||
    document.href ||
    document.src ||
    document.content ||
    document.fileContent ||
    document.documentContent ||
    document.fileData ||
    document.documentData ||
    document.base64Data ||
    document.encodedFile ||
    document.encodedData ||
    document.bytes ||
    document.fileBytes ||
    document.contentBytes ||
    document.byteData ||
    document.documentBytes ||
    document.blob ||
    document.binary ||
    document.file ||
    document.base64 ||
    document.data ||
    "";

  return normalizeDocumentSource(source, document);
}

const getFileIcon = (fileName = "") => {
  const extension = getDocumentExtension(fileName);
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
    return <ImageOutlined fontSize="small" />;
  }
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(extension)) {
    return <DescriptionOutlined fontSize="small" />;
  }
  return <InsertDriveFileOutlined fontSize="small" />;
};

const profileFromData = (data) => {
  const roles = Array.isArray(data.roles) ? data.roles.join(", ") : data.roles || data.role || "";
  const isEditableValue =
    data.isEditable ??
    data.profileEditAccess ??
    data.profileEditAccessParam ??
    data.profileLocked ??
    false;

  return {
    photo: getPhotoSrc(data.photo || data.profilePhoto || data.imageUrl || ""),
    name: data.userName || data.name || "",
    email: data.email || "",
    personalemail: data.personalemail || data.personalEmail || data.personal_email || "",
    phoneNumber: data.phoneNumber || data.phone || "",
    pan: data.pan || data.panNumber || "",
    adhar: data.adhar || data.aadhar || data.aadhaar || "",
    fatherOrSpouseName:
      data.fatherOrSpouseName ||
      data.fatherNameOrSpouseName ||
      data.fatherName ||
      data.spouseName ||
      "",
    motherName: data.motherName || "",
    dob: formatDateForInput(data.dob || data.dateOfBirth || data.birthDate || ""),
    bloodGroup: data.bloodGroup || data.blood_group || "",
    gender: data.gender || "",
    maritalStatus: data.maritalStatus || data.marital_status || "",
    currentAddress: data.currentAddress || "",
    emergencyContactNo: data.emergencyContactNo || "",
    permanentAddress: data.permanentAddress || "",
    role: roles,
    employeeId: data.employeeId || data.userId || "",
    entity: data.entity || "",
    joiningDate: data.joiningDate || data.joining_date || "",
    officialNumber: data.officialNumber || data.officialPhoneNumber || data.officeNumber || "",
    officialEmailId: data.officialEmailId || data.officialEmail || data.officeEmail || data.email || "",
    probation: data.probation || data.isProbation || "",
    reportingManager: data.reportingManager || data.managerName || "",
    department: data.department || "",
    linkedInUrl: data.linkedInUrl || data.linkedinUrl || data.linkedinURL || "",
    bankName: data.bankName || "",
    accountNumber: data.accountNumber || data.bankAccountNumber || "",
    branch: data.branch || data.bankBranch || "",
    accountHolderName: data.accountHolderName || data.bankAccountHolderName || "",
    ifscCode: data.ifscCode || data.ifsc || "",
    uanNumber: data.uanNumber || data.uan || "",
    pfNumber: data.pfNumber || "",
    payrollPanNumber: data.payrollPanNumber || data.panNumber || "",
    payrollAadharNumber: data.payrollAadharNumber || data.aadharNumber || data.adharNumber || "",
    clearanceForm: formatDateForInput(data.clearanceForm || data.clearnessForm || ""),
    fAndF: data.fAndF || data.fandF || data.fullAndFinal || "",
    exitFromPfDate: formatDateForInput(data.exitFromPfDate || data.existFromPfDate || ""),
    lastWorkingDay: formatDateForInput(data.lastWorkingDay || ""),
    isEditable: isEditableValue === true || isEditableValue === "true" ? "true" : "false",
  };
};

const appendProfileFields = (formData, profile) => {
  formData.append("userName", profile.name || "");
  formData.append("email", profile.email || "");
  formData.append("personalemail", profile.personalemail || "");
  formData.append("phoneNumber", profile.phoneNumber || "");
  formData.append("pan", profile.pan || "");
  formData.append("adhar", profile.adhar || "");
  formData.append("fatherOrSpouseName", profile.fatherOrSpouseName || "");
  formData.append("motherName", profile.motherName || "");
  formData.append("dob", profile.dob || "");
  formData.append("bloodGroup", profile.bloodGroup || "");
  formData.append("gender", profile.gender || "");
  formData.append("maritalStatus", profile.maritalStatus || "");
  formData.append("currentAddress", profile.currentAddress || "");
  formData.append("emergencyContactNo", profile.emergencyContactNo || "");
  formData.append("permanentAddress", profile.permanentAddress || "");
  formData.append("role", profile.role || "");
  formData.append("entity", profile.entity || "");
  formData.append("joiningDate", profile.joiningDate || "");
  formData.append("officialNumber", profile.officialNumber || "");
  formData.append("officialEmailId", profile.officialEmailId || profile.email || "");
  formData.append("probation", profile.probation || "");
  formData.append("reportingManager", profile.reportingManager || "");
  formData.append("department", profile.department || "");
  formData.append("linkedInUrl", profile.linkedInUrl || "");
  formData.append("bankName", profile.bankName || "");
  formData.append("accountNumber", profile.accountNumber || "");
  formData.append("branch", profile.branch || "");
  formData.append("accountHolderName", profile.accountHolderName || "");
  formData.append("ifscCode", profile.ifscCode || "");
  formData.append("uanNumber", profile.uanNumber || "");
  formData.append("pfNumber", profile.pfNumber || "");
  formData.append("payrollPanNumber", profile.payrollPanNumber || "");
  formData.append("payrollAadharNumber", profile.payrollAadharNumber || "");
  formData.append("clearanceForm", profile.clearanceForm || "");
  formData.append("clearnessForm", profile.clearanceForm || "");
  formData.append("fAndF", profile.fAndF || "");
  formData.append("fandF", profile.fAndF || "");
  formData.append("exitFromPfDate", profile.exitFromPfDate || "");
  formData.append("lastWorkingDay", profile.lastWorkingDay || "");
};

const getRolesPayload = (role) => {
  if (Array.isArray(role)) return role.filter(Boolean);
  if (!role) return [];
  return String(role)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getProfileUpdatePayload = (profile, selectedUser) => {
  const payload = {
  ...selectedUser,
  userName: profile.name || selectedUser?.userName || selectedUser?.name || "",
  email: profile.email || selectedUser?.email || "",
  personalemail: profile.personalemail || selectedUser?.personalemail || "",
  phoneNumber: profile.phoneNumber || selectedUser?.phoneNumber || "",
  pan: profile.pan || "",
  adhar: profile.adhar || "",
  fatherOrSpouseName: profile.fatherOrSpouseName || "",
  motherName: profile.motherName || "",
  dob: formatDateForInput(profile.dob || selectedUser?.dob || ""),
  bloodGroup: profile.bloodGroup || "",
  joiningDate: formatDateForInput(profile.joiningDate || selectedUser?.joiningDate || ""),
  gender: profile.gender || selectedUser?.gender || "",
  maritalStatus: profile.maritalStatus || "",
  currentAddress: profile.currentAddress || "",
  emergencyContactNo: profile.emergencyContactNo || "",
  permanentAddress: profile.permanentAddress || "",
  role: profile.role || selectedUser?.role || "",
  roles: getRolesPayload(profile.role || selectedUser?.roles || selectedUser?.role),
  designation: selectedUser?.designation || profile.department || "",
  status: selectedUser?.status || "ACTIVE",
  entity: profile.entity || selectedUser?.entity || "IN",
  officialNumber: profile.officialNumber || "",
  officialEmailId: profile.officialEmailId || profile.email || "",
  probation: profile.probation || "",
  reportingManager: profile.reportingManager || "",
  department: profile.department || "",
  linkedInUrl: profile.linkedInUrl || "",
  bankName: profile.bankName || "",
  accountNumber: profile.accountNumber || "",
  branch: profile.branch || "",
  accountHolderName: profile.accountHolderName || "",
  ifscCode: profile.ifscCode || "",
  uanNumber: profile.uanNumber || "",
  pfNumber: profile.pfNumber || "",
  payrollPanNumber: profile.payrollPanNumber || "",
  payrollAadharNumber: profile.payrollAadharNumber || "",
  clearanceForm: profile.clearanceForm || "",
  clearnessForm: profile.clearanceForm || "",
  fAndF: profile.fAndF || "",
  fandF: profile.fAndF || "",
  exitFromPfDate: profile.exitFromPfDate || "",
  lastWorkingDay: profile.lastWorkingDay || "",
  isEditable: profile.isEditable === true || profile.isEditable === "true",
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  return payload;
};

const triggerBrowserDownload = (source, fileName) => {
  if (!source) {
    showToast("No file available to download", "error");
    return;
  }

  const link = document.createElement("a");
  link.href = resolveFileSource(source);
  link.download = fileName || "download";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const fetchFileBlob = async (source) => {
  const resolvedSource = resolveFileSource(source);

  if (resolvedSource.startsWith("data:")) {
    const response = await fetch(resolvedSource);
    return response.blob();
  }

  if (resolvedSource.startsWith("blob:")) {
    const response = await fetch(resolvedSource);
    return response.blob();
  }

  const response = await fetch(resolvedSource, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("File request failed");
  }

  return response.blob();
};

const downloadFile = async (source, fileName) => {
  if (!source) {
    showToast("No file available to download", "error");
    return;
  }

  if (source.startsWith("data:") || source.startsWith("blob:")) {
    triggerBrowserDownload(source, fileName);
    return;
  }

  try {
    const blob = await fetchFileBlob(source);
    const objectUrl = URL.createObjectURL(blob);
    triggerBrowserDownload(objectUrl, fileName);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    triggerBrowserDownload(source, fileName);
  }
};

const EditableField = ({
  label,
  field,
  value,
  onChange,
  type = "text",
  multiline = false,
  options = [],
}) => (
  <Grid item xs={12} sm={6} md={4}>
    <TextField
      label={label}
      value={value || ""}
      onChange={(event) => onChange(field, event.target.value)}
      type={type}
      fullWidth
      size="small"
      select={options.length > 0}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      InputLabelProps={type === "date" ? { shrink: true } : undefined}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  </Grid>
);

const Section = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
      {title}
    </Typography>
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Paper>
  </Box>
);

const HRMS = () => {
  const fileInputRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [documents, setDocuments] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [viewDocument, setViewDocument] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpService.get("/users/employee");
      setUsers(normalizeArrayPayload(response));
    } catch (error) {
      showToast("Unable to load HRMS users", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const nextQuery = query.trim().toLowerCase();
    if (!nextQuery) return users;
    return users.filter((user) =>
      [
        user.userName,
        user.name,
        user.employeeId,
        user.userId,
        user.email,
        user.phoneNumber,
        Array.isArray(user.roles) ? user.roles.join(", ") : user.roles,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(nextQuery))
    );
  }, [query, users]);

  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const fetchUserProfile = async (user) => {
    const employeeId = user?.employeeId || user?.userId;
    if (!employeeId) {
      showToast("User does not have an employee id", "error");
      return;
    }

    setSelectedUser(user);
    setDrawerOpen(true);
    setProfileLoading(true);
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const response = await httpService.get(`/users/profile/${employeeId}`);
      const payload = getPayload(response);
      setProfile(profileFromData({ ...user, ...payload }));
      setDocuments(getDocumentsPayload(response));
    } catch (error) {
      setProfile(profileFromData(user));
      setDocuments(getDocumentsPayload(user));
      showToast("Unable to load complete profile details", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleProfileChange = (field, value) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: ["pan", "ifscCode", "payrollPanNumber"].includes(field)
        ? value.toUpperCase()
        : value,
    }));
  };

  const handleSaveProfile = async () => {
    const employeeId = profile.employeeId || selectedUser?.employeeId || selectedUser?.userId;
    if (!employeeId) return;

    setSavingProfile(true);
    try {
      const response = await httpService.put(
        `/users/update/${employeeId}`,
        getProfileUpdatePayload(profile, selectedUser),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response?.data?.success === false) {
        throw new Error(response.data.message || "Profile update failed");
      }

      showToast("HRMS profile updated successfully", "success");
      await fetchUsers();
      await fetchUserProfile({ ...selectedUser, employeeId });
    } catch (error) {
      showToast("Unable to update HRMS profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleViewDocument = async (document) => {
    const source = getDocumentSource(document);
    const documentName = getDocumentName(document);

    if (!source) {
      showToast("No file available to view", "error");
      return;
    }

    if (source.startsWith("data:") || source.startsWith("blob:")) {
      setViewDocument({
        name: documentName,
        type: getDataUrlMimeType(document),
        url: source,
        source,
      });
      return;
    }

    setViewLoading(true);
    try {
      const blob = await fetchFileBlob(source);
      const objectUrl = URL.createObjectURL(blob);
      setViewDocument({
        name: documentName,
        type: blob.type || getDataUrlMimeType(document),
        url: objectUrl,
        source,
      });
    } catch (error) {
      setViewDocument({
        name: documentName,
        type: getDataUrlMimeType(document),
        url: resolveFileSource(source),
        source,
      });
    } finally {
      setViewLoading(false);
    }
  };

  const closeDocumentViewer = () => {
    if (viewDocument?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(viewDocument.url);
    }
    setViewDocument(null);
  };

  const handleUploadDocuments = async () => {
    const employeeId = profile.employeeId || selectedUser?.employeeId || selectedUser?.userId;
    if (!employeeId || !selectedFiles.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      appendProfileFields(formData, profile);
      selectedFiles.forEach((file) => formData.append("documents", file));

      await httpService.put(`/users/update/${employeeId}`, formData);
      showToast("HR documents uploaded successfully", "success");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchUserProfile({ ...selectedUser, employeeId });
    } catch (error) {
      showToast("Unable to upload HR documents", "error");
    } finally {
      setUploading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
    setProfile(emptyProfile);
    setDocuments([]);
    setSelectedFiles([]);
    closeDocumentViewer();
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
            HRMS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review employee profile data, download uploaded files, and attach HR documents.
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
          <TextField
            size="small"
            placeholder="Search users"
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
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchUsers} disabled={loading}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "primary.contrastText", fontWeight: 700 }}>Employee ID</TableCell>
                    <TableCell sx={{ color: "primary.contrastText", fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ color: "primary.contrastText", fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ color: "primary.contrastText", fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ color: "primary.contrastText", fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ color: "primary.contrastText", fontWeight: 700 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const employeeId = user.employeeId || user.userId;
                    const roles = Array.isArray(user.roles) ? user.roles.join(", ") : user.roles || user.role;
                    return (
                      <TableRow key={employeeId || user.email} hover>
                        <TableCell>{employeeId || "-"}</TableCell>
                        <TableCell>{user.userName || user.name || "-"}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>{roles || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={user.status || "-"}
                            color={String(user.status).toLowerCase() === "active" ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View HRMS profile">
                            <IconButton color="primary" size="small" onClick={() => fetchUserProfile(user)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!paginatedUsers.length && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Alert severity="info">No users found.</Alert>
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
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Paper>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{ sx: { width: { xs: "100%", md: "78%" }, maxWidth: 1120 } }}
      >
        <Box sx={{ p: 3, height: "100%", overflowY: "auto" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" color="primary" fontWeight={700}>
              HRMS Profile Details
            </Typography>
            <IconButton onClick={closeDrawer}>
              <Close />
            </IconButton>
          </Stack>

          {profileLoading ? (
            <Box sx={{ py: 10, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1 }}>
                <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ xs: "flex-start", sm: "center" }}>
                  <Avatar src={profile.photo} sx={{ width: 72, height: 72, bgcolor: "primary.main" }}>
                    {getInitials(profile.name)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{profile.name || "-"}</Typography>
                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip icon={<BadgeOutlined />} label={profile.employeeId || "-"} size="small" />
                      <Chip icon={<EmailOutlined />} label={profile.email || "-"} size="small" />
                      <Chip icon={<PhoneOutlined />} label={profile.phoneNumber || "-"} size="small" />
                    </Stack>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadOutlined />}
                    onClick={() => downloadFile(profile.photo, `${profile.employeeId || "profile"}-photo.jpg`)}
                    disabled={!profile.photo}
                  >
                    Download Photo
                  </Button>
                </Stack>
              </Paper>

              <Section title="Personal Profile">
                <EditableField label="Name" field="name" value={profile.name} onChange={handleProfileChange} />
                <EditableField label="Email" field="email" value={profile.email} onChange={handleProfileChange} />
                <EditableField label="Personal Email" field="personalemail" value={profile.personalemail} onChange={handleProfileChange} />
                <EditableField label="Phone Number" field="phoneNumber" value={profile.phoneNumber} onChange={handleProfileChange} />
                <EditableField label="PAN" field="pan" value={profile.pan} onChange={handleProfileChange} />
                <EditableField label="Aadhar" field="adhar" value={profile.adhar} onChange={handleProfileChange} />
                <EditableField label="Father / Spouse Name" field="fatherOrSpouseName" value={profile.fatherOrSpouseName} onChange={handleProfileChange} />
                <EditableField label="Mother Name" field="motherName" value={profile.motherName} onChange={handleProfileChange} />
                <EditableField label="DOB" field="dob" value={profile.dob} onChange={handleProfileChange} type="date" />
                <EditableField label="Blood Group" field="bloodGroup" value={profile.bloodGroup} onChange={handleProfileChange} />
                <EditableField label="Gender" field="gender" value={profile.gender} onChange={handleProfileChange} />
                <EditableField label="Marital Status" field="maritalStatus" value={profile.maritalStatus} onChange={handleProfileChange} />
                <EditableField label="Emergency Contact" field="emergencyContactNo" value={profile.emergencyContactNo} onChange={handleProfileChange} />
                <EditableField label="Current Address" field="currentAddress" value={profile.currentAddress} onChange={handleProfileChange} multiline />
                <EditableField label="Permanent Address" field="permanentAddress" value={profile.permanentAddress} onChange={handleProfileChange} multiline />
              </Section>

              <Section title="Job Profile">
                <EditableField label="Employee ID" field="employeeId" value={profile.employeeId} onChange={handleProfileChange} />
                <EditableField label="Role" field="role" value={profile.role} onChange={handleProfileChange} />
                <EditableField label="Entity" field="entity" value={profile.entity} onChange={handleProfileChange} />
                <EditableField label="Joining Date" field="joiningDate" value={formatDateForInput(profile.joiningDate)} onChange={handleProfileChange} type="date" />
                <EditableField label="Official Number" field="officialNumber" value={profile.officialNumber} onChange={handleProfileChange} />
                <EditableField label="Official Email" field="officialEmailId" value={profile.officialEmailId} onChange={handleProfileChange} />
                <EditableField label="Probation" field="probation" value={profile.probation} onChange={handleProfileChange} />
                <EditableField label="Reporting Manager" field="reportingManager" value={profile.reportingManager} onChange={handleProfileChange} />
                <EditableField label="Department" field="department" value={profile.department} onChange={handleProfileChange} />
                <EditableField label="LinkedIn URL" field="linkedInUrl" value={profile.linkedInUrl} onChange={handleProfileChange} />
                <EditableField
                  label="Profile Edit Access"
                  field="isEditable"
                  value={profile.isEditable}
                  onChange={handleProfileChange}
                  options={[
                    { value: "false", label: "Editable" },
                    { value: "true", label: "Locked" },
                  ]}
                />
              </Section>

              <Section title="Payroll Inputs">
                <EditableField label="Bank Name" field="bankName" value={profile.bankName} onChange={handleProfileChange} />
                <EditableField label="Account Number" field="accountNumber" value={profile.accountNumber} onChange={handleProfileChange} />
                <EditableField label="Branch" field="branch" value={profile.branch} onChange={handleProfileChange} />
                <EditableField label="Account Holder Name" field="accountHolderName" value={profile.accountHolderName} onChange={handleProfileChange} />
                <EditableField label="IFSC Code" field="ifscCode" value={profile.ifscCode} onChange={handleProfileChange} />
                <EditableField label="UAN Number" field="uanNumber" value={profile.uanNumber} onChange={handleProfileChange} />
                <EditableField label="PF Number" field="pfNumber" value={profile.pfNumber} onChange={handleProfileChange} />
                <EditableField label="PAN Number" field="payrollPanNumber" value={profile.payrollPanNumber} onChange={handleProfileChange} />
                <EditableField label="Aadhar Number" field="payrollAadharNumber" value={profile.payrollAadharNumber} onChange={handleProfileChange} />
              </Section>

              <Box sx={{ mb: 3 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                  gap={2}
                  sx={{ mb: 1.5 }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    Documents
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                    <input ref={fileInputRef} type="file" hidden multiple onChange={handleFileChange} />
                    <Button
                      variant="outlined"
                      startIcon={<UploadFileOutlined />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Select HR Documents
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileOutlined />}
                      disabled={!selectedFiles.length || uploading}
                      onClick={handleUploadDocuments}
                    >
                      Upload
                    </Button>
                  </Stack>
                </Stack>

                {selectedFiles.length > 0 && (
                  <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
                    {selectedFiles.map((file) => (
                      <Chip key={`${file.name}-${file.size}`} icon={getFileIcon(file.name)} label={file.name} />
                    ))}
                  </Stack>
                )}

                <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
                  {documents.length ? (
                    documents.map((document, index) => {
                      const documentName = getDocumentName(document);
                      const source = getDocumentSource(document);
                      return (
                        <React.Fragment key={`${documentName}-${index}`}>
                          {index > 0 && <Divider />}
                          <Stack direction="row" alignItems="center" gap={1.5} sx={{ p: 2 }}>
                            <Avatar variant="rounded" src={getDocumentType(document) === "image" ? source : ""}>
                              {getFileIcon(documentName)}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap title={documentName}>
                                {documentName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {document?.documentType || document?.fileType || document?.type || "Profile document"}
                              </Typography>
                            </Box>
                            <Tooltip title="Download">
                              <span>
                                <IconButton
                                  color="primary"
                                  disabled={!source}
                                  onClick={() => downloadFile(source, documentName)}
                                >
                                  <DownloadOutlined />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="View">
                              <span>
                                <IconButton
                                  color="info"
                                  disabled={!source || viewLoading}
                                  onClick={() => handleViewDocument(document)}
                                >
                                  <Visibility />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 0 }}>
                      No uploaded documents found for this profile.
                    </Alert>
                  )}
                </Paper>
              </Box>

              <Section title="Exit Formality">
                <EditableField label="Clearance Form" field="clearanceForm" value={profile.clearanceForm} onChange={handleProfileChange} type="date" />
                <EditableField label="F&F" field="fAndF" value={profile.fAndF} onChange={handleProfileChange} />
                <EditableField label="Exit From PF Date" field="exitFromPfDate" value={profile.exitFromPfDate} onChange={handleProfileChange} type="date" />
                <EditableField label="Last Working Day" field="lastWorkingDay" value={profile.lastWorkingDay} onChange={handleProfileChange} type="date" />
              </Section>

              <Paper
                elevation={3}
                sx={{
                  position: "sticky",
                  bottom: 0,
                  p: 2,
                  mt: 3,
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  zIndex: 2,
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-end" gap={1.5}>
                  <Button variant="outlined" color="inherit" onClick={closeDrawer} disabled={savingProfile}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={profileLoading || savingProfile}
                    startIcon={savingProfile ? <CircularProgress size={18} color="inherit" /> : null}
                  >
                    Save Profile
                  </Button>
                </Stack>
              </Paper>
            </>
          )}
        </Box>
      </Drawer>

      <Dialog open={Boolean(viewDocument)} onClose={closeDocumentViewer} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Typography variant="h6" noWrap title={viewDocument?.name}>
            {viewDocument?.name || "Document"}
          </Typography>
          <IconButton onClick={closeDocumentViewer}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: { xs: 420, md: 620 }, p: 0 }}>
          {viewDocument?.type?.startsWith("image/") ? (
            <Box
              component="img"
              src={viewDocument.url}
              alt={viewDocument.name}
              sx={{
                display: "block",
                maxWidth: "100%",
                maxHeight: { xs: 420, md: 620 },
                mx: "auto",
                objectFit: "contain",
              }}
            />
          ) : viewDocument?.type?.includes("pdf") ? (
            <Box
              component="iframe"
              title={viewDocument.name}
              src={viewDocument.url}
              sx={{ width: "100%", height: { xs: 420, md: 620 }, border: 0 }}
            />
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Preview is not available for this file type.
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadOutlined />}
                onClick={() => downloadFile(viewDocument.source, viewDocument.name)}
              >
                Download File
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<DownloadOutlined />}
            onClick={() => downloadFile(viewDocument?.source || viewDocument?.url, viewDocument?.name)}
            disabled={!viewDocument}
          >
            Download
          </Button>
          <Button onClick={closeDocumentViewer}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HRMS;
