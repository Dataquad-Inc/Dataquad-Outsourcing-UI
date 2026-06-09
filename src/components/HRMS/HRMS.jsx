import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
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
  isEmployeeHavingESI: "false",
  esiNumber: "",
  payrollPanNumber: "",
  payrollAadharNumber: "",
  fAndF: "",
  exitFromPfDate: "",
  lastWorkingDay: "",
  isEditable: "false",
};

const departmentOptions = ["Sales", "Recruitment", "Coordination", "Admin", "Finance", "HRMS"].map(
  (department) => ({ value: department, label: department })
);

const isTruthyFlag = (value) => value === true || value === "true";

const hrmsTableColumns = [
  { label: "Employee ID", getValue: (profile) => profile.employeeId },
  { label: "Name", getValue: (profile) => profile.name },
  { label: "Email", getValue: (profile) => profile.email },
  { label: "Personal Email", getValue: (profile) => profile.personalemail },
  { label: "Phone Number", getValue: (profile) => profile.phoneNumber },
  // { label: "PAN", getValue: (profile) => profile.pan },
  // { label: "Aadhar", getValue: (profile) => profile.adhar },
  { label: "Father / Spouse Name", getValue: (profile) => profile.fatherOrSpouseName },
  { label: "Mother Name", getValue: (profile) => profile.motherName },
  { label: "DOB", getValue: (profile) => formatDateForInput(profile.dob) },
  { label: "Blood Group", getValue: (profile) => profile.bloodGroup },
  { label: "Gender", getValue: (profile) => profile.gender },
  { label: "Marital Status", getValue: (profile) => profile.maritalStatus },
  { label: "Emergency Contact", getValue: (profile) => profile.emergencyContactNo },
  { label: "Current Address", getValue: (profile) => profile.currentAddress },
  { label: "Permanent Address", getValue: (profile) => profile.permanentAddress },
  { label: "Role", getValue: (profile) => profile.role },
  // { label: "Entity", getValue: (profile) => profile.entity },
  { label: "Joining Date", getValue: (profile) => formatDateForInput(profile.joiningDate) },
  { label: "Official Number", getValue: (profile) => profile.officialNumber },
  { label: "Official Email", getValue: (profile) => profile.officialEmailId },
  { label: "Probation", getValue: (profile) => calculateProbationStatus(profile.joiningDate) },
  { label: "Reporting Manager", getValue: (profile) => profile.reportingManager },
  { label: "Department", getValue: (profile) => profile.department },
  { label: "LinkedIn URL", getValue: (profile) => profile.linkedInUrl },
  { label: "Bank Name", getValue: (profile) => profile.bankName },
  { label: "Account Number", getValue: (profile) => profile.accountNumber },
  { label: "Branch", getValue: (profile) => profile.branch },
  { label: "Account Holder Name", getValue: (profile) => profile.accountHolderName },
  { label: "IFSC Code", getValue: (profile) => profile.ifscCode },
  { label: "UAN Number", getValue: (profile) => profile.uanNumber },
  { label: "PF Number", getValue: (profile) => profile.pfNumber },
  { label: "PF", getValue: (profile) => (profile.pfNumber ? "Yes" : "No") },
  { label: "Employee Having ESI", getValue: (profile) => (isTruthyFlag(profile.isEmployeeHavingESI) ? "Yes" : "No") },
  { label: "ESI Number", getValue: (profile) => profile.esiNumber },
  { label: "Payroll PAN Number", getValue: (profile) => profile.payrollPanNumber },
  { label: "Payroll Aadhar Number", getValue: (profile) => profile.payrollAadharNumber },
  { label: "F&F", getValue: (profile) => profile.fAndF },
  { label: "Exit From PF Date", getValue: (profile) => formatDateForInput(profile.exitFromPfDate) },
  { label: "Last Working Day", getValue: (profile) => formatDateForInput(profile.lastWorkingDay) },
];

const stickyStatusColumnSx = {
  position: "sticky",
  right: 72,
  minWidth: 120,
  bgcolor: "background.paper",
  zIndex: 2,
};

const stickyActionsColumnSx = {
  position: "sticky",
  right: 0,
  minWidth: 72,
  bgcolor: "background.paper",
  zIndex: 2,
};

const getBody = (response) => response?.data || response || {};

const getPayload = (response) => {
  const body = getBody(response);
  const payload = body?.payload || body?.data || body;
  return payload?.profile || payload?.user || payload?.employee || payload || {};
};

const getEmployeeId = (user) => user?.employeeId || user?.userId || "";

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

const calculateProbationStatus = (joiningDate) => {
  if (!joiningDate) return "";
  const joining = new Date(joiningDate);
  if (Number.isNaN(joining.getTime())) return "";
  
  const today = new Date();
  const probationEndDate = new Date(joining);
  probationEndDate.setMonth(probationEndDate.getMonth() + 3);
  
  const daysRemaining = Math.ceil((probationEndDate - today) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining > 0) {
    return `Active (${daysRemaining} days left)`;
  } else if (daysRemaining === 0) {
    return "Completed";
  } else {
    return "Completed";
  }
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

const getDocumentKey = (document, index) => {
  if (document && typeof document === "object") {
    return (
      document.id ||
      document.documentId ||
      document.fileId ||
      document.documentName ||
      document.fileName ||
      `${getDocumentName(document)}-${index}`
    );
  }

  return `${getDocumentName(document)}-${index}`;
};

const isDocumentVerified = (document) =>
  Boolean(
    document?.isVerified ||
      document?.verified ||
      document?.documentVerified
  );

const primaryDocumentSections = [
  { key: "pan", label: "PAN", documentType: "PAN" },
  { key: "adhar", label: "Aadhar", documentType: "Aadhar" },
  { key: "bankPassbook", label: "Bank Passbook", documentType: "Bank Passbook" },
  { key: "insurance", label: "Insurance", documentType: "Insurance" },
];

const otherDocumentType = "Other Documents";

const normalizeDocumentType = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getDocumentSearchText = (document) => {
  if (!document || typeof document === "string") return String(document || "").toLowerCase();

  return [
    document.fileName,
    document.documentName,
    document.name,
    document.originalFileName,
    document.originalName,
    document.filename,
    document.file_name,
    document.documentType,
    document.fileType,
    document.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const getPrimaryDocumentSectionKey = (document) => {
  const documentType = normalizeDocumentType(
    typeof document === "object" ? document?.documentType || "" : ""
  );
  const matchedByType = primaryDocumentSections.find(
    (section) => normalizeDocumentType(section.documentType) === documentType
  );
  if (matchedByType) return matchedByType.key;

  const searchText = getDocumentSearchText(document);

  if (/\bpan\b/.test(searchText)) return "pan";
  if (searchText.includes("adhar") || searchText.includes("aadhar") || searchText.includes("aadhaar")) {
    return "adhar";
  }
  if (searchText.includes("bank passbook") || searchText.includes("passbook")) {
    return "bankPassbook";
  }
  if (searchText.includes("insurance")) return "insurance";

  return "";
};

const groupDocumentsForHRMS = (documents) => {
  const grouped = primaryDocumentSections.reduce(
    (sections, section) => ({
      ...sections,
      [section.key]: [],
    }),
    {}
  );
  const otherDocuments = [];

  documents.forEach((document, index) => {
    const documentWithIndex = { document, originalIndex: index };
    const sectionKey = getPrimaryDocumentSectionKey(document);

    if (sectionKey && grouped[sectionKey]) {
      grouped[sectionKey].push(documentWithIndex);
      return;
    }

    otherDocuments.push(documentWithIndex);
  });

  return { grouped, otherDocuments };
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
    isEmployeeHavingESI:
      isTruthyFlag(data.isEmployeeHavingESI) || isTruthyFlag(data.employeeHavingESI)
        ? "true"
        : "false",
    esiNumber: data.esiNumber || data.esi || "",
    payrollPanNumber: data.payrollPanNumber || data.panNumber || "",
    payrollAadharNumber: data.payrollAadharNumber || data.aadharNumber || data.adharNumber || "",
    fAndF: data.fAndF || data.fandF || data.fullAndFinal || data.finalSettlement || "",
    exitFromPfDate: formatDateForInput(
      data.exitFromPfDate || data.existFromPfDate || data.exitFromPFDate || data.existFromPFDate || ""
    ),
    lastWorkingDay: formatDateForInput(data.lastWorkingDay || data.lastWorkingDate || data.lwd || ""),
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
  formData.append("isEmployeeHavingESI", String(isTruthyFlag(profile.isEmployeeHavingESI)));
  formData.append("employeeHavingESI", String(isTruthyFlag(profile.isEmployeeHavingESI)));
  formData.append("esiNumber", profile.esiNumber || "");
  formData.append("esi", profile.esiNumber || "");
  formData.append("payrollPanNumber", profile.payrollPanNumber || "");
  formData.append("payrollAadharNumber", profile.payrollAadharNumber || "");
  formData.append("fAndF", profile.fAndF || "");
  formData.append("fandF", profile.fAndF || "");
  formData.append("fullAndFinal", profile.fAndF || "");
  formData.append("finalSettlement", profile.fAndF || "");
  formData.append("exitFromPfDate", profile.exitFromPfDate || "");
  formData.append("existFromPfDate", profile.exitFromPfDate || "");
  formData.append("exitFromPFDate", profile.exitFromPfDate || "");
  formData.append("existFromPFDate", profile.exitFromPfDate || "");
  formData.append("lastWorkingDay", profile.lastWorkingDay || "");
  formData.append("lastWorkingDate", profile.lastWorkingDay || "");
  formData.append("lwd", profile.lastWorkingDay || "");
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
  isEmployeeHavingESI: isTruthyFlag(profile.isEmployeeHavingESI),
  employeeHavingESI: isTruthyFlag(profile.isEmployeeHavingESI),
  esiNumber: profile.esiNumber || "",
  esi: profile.esiNumber || "",
  payrollPanNumber: profile.payrollPanNumber || "",
  payrollAadharNumber: profile.payrollAadharNumber || "",
  fAndF: profile.fAndF || "",
  fandF: profile.fAndF || "",
  fullAndFinal: profile.fAndF || "",
  finalSettlement: profile.fAndF || "",
  exitFromPfDate: profile.exitFromPfDate || "",
  existFromPfDate: profile.exitFromPfDate || "",
  exitFromPFDate: profile.exitFromPfDate || "",
  existFromPFDate: profile.exitFromPfDate || "",
  lastWorkingDay: profile.lastWorkingDay || "",
  lastWorkingDate: profile.lastWorkingDay || "",
  lwd: profile.lastWorkingDay || "",
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
    return false;
  }

  if (source.startsWith("data:") || source.startsWith("blob:")) {
    triggerBrowserDownload(source, fileName);
    return true;
  }

  try {
    const blob = await fetchFileBlob(source);
    const objectUrl = URL.createObjectURL(blob);
    triggerBrowserDownload(objectUrl, fileName);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return true;
  } catch (error) {
    triggerBrowserDownload(source, fileName);
    return true;
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
  const profileDetailsLoadingRef = useRef(new Set());
  const [users, setUsers] = useState([]);
  const [profileDetailsByEmployeeId, setProfileDetailsByEmployeeId] = useState({});
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
  const [downloadedDocumentKeys, setDownloadedDocumentKeys] = useState({});
  const [savingVerifiedDocumentKeys, setSavingVerifiedDocumentKeys] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

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
    return users.filter((user) => {
      const employeeId = getEmployeeId(user);
      const rowProfile = profileFromData({
        ...user,
        ...(profileDetailsByEmployeeId[employeeId] || {}),
      });
      return hrmsTableColumns
        .map((column) => column.getValue(rowProfile, user))
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(nextQuery));
    });
  }, [profileDetailsByEmployeeId, query, users]);

  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const groupedDocuments = useMemo(() => groupDocumentsForHRMS(documents), [documents]);

  useEffect(() => {
    const missingEmployeeIds = paginatedUsers
      .map(getEmployeeId)
      .filter(
        (employeeId) =>
          employeeId &&
          !profileDetailsByEmployeeId[employeeId] &&
          !profileDetailsLoadingRef.current.has(employeeId)
      );

    if (!missingEmployeeIds.length) return;

    missingEmployeeIds.forEach((employeeId) => {
      profileDetailsLoadingRef.current.add(employeeId);
    });

    Promise.all(
      missingEmployeeIds.map(async (employeeId) => {
        try {
          const response = await fetch(`https://mymulya.com/users/profile/${employeeId}`, {
            method: "GET",
            credentials: "include",
          });
          if (!response.ok) return null;

          const responseBody = await response.json();
          return [employeeId, getPayload(responseBody)];
        } catch (error) {
          return null;
        } finally {
          profileDetailsLoadingRef.current.delete(employeeId);
        }
      })
    ).then((entries) => {
      const loadedProfiles = entries.filter(Boolean);
      if (!loadedProfiles.length) return;

      setProfileDetailsByEmployeeId((currentProfiles) => {
        const nextProfiles = { ...currentProfiles };
        loadedProfiles.forEach(([employeeId, profileDetails]) => {
          nextProfiles[employeeId] = profileDetails;
        });
        return nextProfiles;
      });
    });
  }, [paginatedUsers, profileDetailsByEmployeeId]);

  const fetchUserProfile = async (user) => {
    const employeeId = getEmployeeId(user);
    if (!employeeId) {
      showToast("User does not have an employee id", "error");
      return;
    }

    setSelectedUser(user);
    setDrawerOpen(true);
    setProfileLoading(true);
    setSelectedFiles([]);
    setDownloadedDocumentKeys({});
    setSavingVerifiedDocumentKeys({});
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      // const response = await httpService.get(`/users/profile/${employeeId}`);
      const response = await fetch(`https://mymulya.com/users/profile/${employeeId}`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Profile request failed");
      }

      const responseBody = await response.json();
      const payload = getPayload(responseBody);
      setProfileDetailsByEmployeeId((currentProfiles) => ({
        ...currentProfiles,
        [employeeId]: payload,
      }));
      setProfile(profileFromData({ ...user, ...payload }));
      setDocuments(getDocumentsPayload(responseBody));
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

  const handleDocumentDownload = async (document, index) => {
    const source = getDocumentSource(document);
    const documentName = getDocumentName(document);
    const documentKey = getDocumentKey(document, index);
    const downloaded = await downloadFile(source, documentName);

    if (downloaded) {
      setDownloadedDocumentKeys((currentKeys) => ({
        ...currentKeys,
        [documentKey]: true,
      }));
    }
  };

  const handleDocumentVerifiedChange = (document, index) => async (event) => {
    const documentKey = getDocumentKey(document, index);
    const employeeId = profile.employeeId || selectedUser?.employeeId || selectedUser?.userId;
    const documentId = document?.id || document?.documentId || document?.fileId;
    const nextVerified = event.target.checked;

    if (!downloadedDocumentKeys[documentKey] || !employeeId || !documentId) return;

    setSavingVerifiedDocumentKeys((currentKeys) => ({
      ...currentKeys,
      [documentKey]: true,
    }));

    try {
      // await httpService.patch(
      //   `/users/profile/${employeeId}/documents/${documentId}/verify`,
      //   null,
      //   { params: { isVerified: nextVerified } }
      // );
      await fetch(`https://mymulya.com/users/profile/${employeeId}/documents/${documentId}/verify?isVerified=${nextVerified}`, {
        method: "PATCH",
        credentials: "include",
      });
      setDocuments((currentDocuments) =>
        currentDocuments.map((currentDocument) => {
          const currentDocumentId =
            currentDocument?.id || currentDocument?.documentId || currentDocument?.fileId;
          if (currentDocumentId !== documentId) return currentDocument;
          return { ...currentDocument, isVerified: nextVerified };
        })
      );
      showToast("Document verification updated successfully", "success");
    } catch (error) {
      showToast("Unable to update document verification", "error");
    } finally {
      setSavingVerifiedDocumentKeys((currentKeys) => ({
        ...currentKeys,
        [documentKey]: false,
      }));
    }
  };

  const renderDocumentRow = ({ document, originalIndex }, showDivider = false) => {
    const documentName = getDocumentName(document);
    const source = getDocumentSource(document);
    const documentKey = getDocumentKey(document, originalIndex);
    const isDownloaded = Boolean(downloadedDocumentKeys[documentKey]);
    const savingVerification = Boolean(savingVerifiedDocumentKeys[documentKey]);
    const canVerifyDocument = Boolean(document?.id || document?.documentId || document?.fileId);

    return (
      <React.Fragment key={`${documentKey}-${originalIndex}`}>
        {showDivider && <Divider />}
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
                onClick={() => handleDocumentDownload(document, originalIndex)}
              >
                <DownloadOutlined />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={isDownloaded ? "Mark as verified" : "Download document first"}>
            <span>
              <Checkbox
                size="small"
                checked={isDocumentVerified(document)}
                disabled={!isDownloaded || savingVerification || !canVerifyDocument}
                onChange={handleDocumentVerifiedChange(document, originalIndex)}
                inputProps={{ "aria-label": `Verify ${documentName}` }}
              />
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
      selectedFiles.forEach((file) => {
        formData.append("documents", file);
        formData.append("documentTypes", otherDocumentType);
      });

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
    setDownloadedDocumentKeys({});
    setSavingVerifiedDocumentKeys({});
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
              <Table size="small" sx={{ minWidth: 5200 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    {hrmsTableColumns.map((column) => (
                      <TableCell
                        key={column.label}
                        sx={{
                          color: "primary.contrastText",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                    <TableCell
                      sx={{
                        ...stickyStatusColumnSx,
                        color: "primary.contrastText",
                        fontWeight: 700,
                        bgcolor: "primary.main",
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        ...stickyActionsColumnSx,
                        color: "primary.contrastText",
                        fontWeight: 700,
                        bgcolor: "primary.main",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const employeeId = getEmployeeId(user);
                    const rowProfile = profileFromData({
                      ...user,
                      ...(profileDetailsByEmployeeId[employeeId] || {}),
                    });
                    return (
                      <TableRow key={employeeId || user.email} hover>
                        {hrmsTableColumns.map((column) => {
                          const cellValue = column.getValue(rowProfile, user) || "-";

                          return (
                            <TableCell
                              key={column.label}
                              title={String(cellValue)}
                              sx={{
                                maxWidth: 220,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {column.label === "LinkedIn URL" && cellValue && cellValue !== "-" ? (
                                <a
                                  href={cellValue.startsWith("http") ? cellValue : `https://${cellValue}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "#1976d2", textDecoration: "none" }}
                                  onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                                  onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                                >
                                  {cellValue}
                                </a>
                              ) : (
                                cellValue
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell sx={stickyStatusColumnSx}>
                          <Chip
                            size="small"
                            label={user.status || "-"}
                            color={String(user.status).toLowerCase() === "active" ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell align="center" sx={stickyActionsColumnSx}>
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
                      <TableCell colSpan={hrmsTableColumns.length + 1}>
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
              rowsPerPageOptions={[5, 10, 20, 50, 100]}
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
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Probation"
                    value={profile.joiningDate ? calculateProbationStatus(profile.joiningDate) : profile.probation}
                    disabled={Boolean(profile.joiningDate)}
                    fullWidth
                  />
                </Grid>
                <EditableField label="Reporting Manager" field="reportingManager" value={profile.reportingManager} onChange={handleProfileChange} />
                <EditableField
                  label="Department"
                  field="department"
                  value={profile.department}
                  onChange={handleProfileChange}
                  options={departmentOptions}
                />
                <EditableField label="LinkedIn URL" field="linkedInUrl" value={profile.linkedInUrl} onChange={handleProfileChange} />
              </Section>

              <Section title="Payroll Inputs">
                <EditableField label="Bank Name" field="bankName" value={profile.bankName} onChange={handleProfileChange} />
                <EditableField label="Account Number" field="accountNumber" value={profile.accountNumber} onChange={handleProfileChange} />
                <EditableField label="Branch" field="branch" value={profile.branch} onChange={handleProfileChange} />
                <EditableField label="Account Holder Name" field="accountHolderName" value={profile.accountHolderName} onChange={handleProfileChange} />
                <EditableField label="IFSC Code" field="ifscCode" value={profile.ifscCode} onChange={handleProfileChange} />
                <EditableField label="UAN Number" field="uanNumber" value={profile.uanNumber} onChange={handleProfileChange} />
                <EditableField label="PF Number" field="pfNumber" value={profile.pfNumber} onChange={handleProfileChange} />
                <EditableField
                  label="Employee Having ESI"
                  field="isEmployeeHavingESI"
                  value={profile.isEmployeeHavingESI}
                  onChange={handleProfileChange}
                  options={[
                    { value: "false", label: "No" },
                    { value: "true", label: "Yes" },
                  ]}
                />
                {isTruthyFlag(profile.isEmployeeHavingESI) && (
                  <EditableField label="ESI Number" field="esiNumber" value={profile.esiNumber} onChange={handleProfileChange} />
                )}
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

                <Stack spacing={2}>
                  {primaryDocumentSections.map((section) => {
                    const sectionDocuments = groupedDocuments.grouped[section.key] || [];

                    return (
                      <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }} key={section.key}>
                        <Box sx={{ px: 2, py: 1.25, bgcolor: "background.default", borderBottom: "1px solid", borderColor: "divider" }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {section.label}
                          </Typography>
                        </Box>
                        {sectionDocuments.length ? (
                          sectionDocuments.map((documentWithIndex, index) =>
                            renderDocumentRow(documentWithIndex, index > 0)
                          )
                        ) : (
                          <Alert severity="info" sx={{ borderRadius: 0 }}>
                            No {section.label} document uploaded.
                          </Alert>
                        )}
                      </Paper>
                    );
                  })}

                  <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
                    <Box sx={{ px: 2, py: 1.25, bgcolor: "background.default", borderBottom: "1px solid", borderColor: "divider" }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Other Documents
                      </Typography>
                    </Box>
                    {groupedDocuments.otherDocuments.length ? (
                      groupedDocuments.otherDocuments.map((documentWithIndex, index) =>
                        renderDocumentRow(documentWithIndex, index > 0)
                      )
                    ) : (
                      <Alert severity="info" sx={{ borderRadius: 0 }}>
                        No other documents uploaded for this profile.
                      </Alert>
                    )}
                  </Paper>
                </Stack>
              </Box>

              <Section title="Exit Formality">
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
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" gap={1.5}>
                  <TextField
                    label="Profile Edit Access"
                    value={profile.isEditable}
                    onChange={(event) => handleProfileChange("isEditable", event.target.value)}
                    select
                    disabled={profileLoading || savingProfile}
                    sx={{ minWidth: 200 }}
                  >
                    {[{ value: "false", label: "Editable" }, { value: "true", label: "Locked" }].map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
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
