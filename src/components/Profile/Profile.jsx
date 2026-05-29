import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Alert,
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
  Grid,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  BadgeOutlined,
  CancelOutlined,
  CheckCircleOutlined,
  Close,
  DescriptionOutlined,
  DownloadOutlined,
  EditOutlined,
  EmailOutlined,
  ImageOutlined,
  InsertDriveFileOutlined,
  PhoneOutlined,
  PictureAsPdfOutlined,
  SaveOutlined,
  UploadFileOutlined,
  Visibility,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { showToast } from "../../utils/ToastNotification";
import httpService, { API_BASE_URL } from "../../Services/httpService";

const initialProfile = {
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
  isEmployeeHavingPF: false,
  uanNumber: "",
  pfNumber: "",
  isEmployeeHavingESI: false,
  esiNumber: "",
  payrollPanNumber: "",
  payrollAadharNumber: "",
  fAndF: "",
  exitFromPfDate: "",
  lastWorkingDay: "",
  isEditable: true,
};

const profileTabs = [
  "Personal Profile",
  "Job Profile",
  "Payroll Inputs",
  "Documents",
  "Exit Formality",
];

const documentUploadSections = [
  { key: "pan", label: "PAN", documentType: "PAN" },
  { key: "adhar", label: "Aadhar", documentType: "Aadhar" },
  { key: "bankPassbook", label: "Bank Passbook", documentType: "Bank Passbook" },
  { key: "insurance", label: "Insurance", documentType: "Insurance" },
];

const otherDocumentType = "Other Documents";

const getResponseBody = (response) => response?.data || response || {};

const readResponseBody = async (response) => {
  if (response?.json && typeof response.json === "function") {
    return response.json();
  }

  return getResponseBody(response);
};

const isErrorResponse = (response) =>
  response?.ok === false || (response?.status && response.status >= 400);

const isLockedFlag = (value) => {
  if (value === true) return true;
  if (typeof value !== "string") return false;

  return ["true", "locked", "lock"].includes(value.toLowerCase());
};

const isProfileLocked = (data, body) =>
  isLockedFlag(data.locked) ||
  isLockedFlag(body.locked) ||
  isLockedFlag(data.isLocked) ||
  isLockedFlag(body.isLocked) ||
  isLockedFlag(data.profileLocked) ||
  isLockedFlag(body.profileLocked) ||
  isLockedFlag(data.profileEditAccess) ||
  isLockedFlag(body.profileEditAccess) ||
  isLockedFlag(data.lockedFlag) ||
  isLockedFlag(body.lockedFlag) ||
  isLockedFlag(data.isEditable) ||
  isLockedFlag(body.isEditable);

const getPayload = (response) => {
  const body = getResponseBody(response);
  const payload = body?.payload || body?.data || body;

  return payload?.profile || payload?.user || payload?.employee || payload || {};
};

const normalizeDocumentsPayload = (documents) => {
  if (!documents) return [];
  if (Array.isArray(documents)) return documents.filter(Boolean);
  if (typeof documents === "string") return documents.trim() ? [documents] : [];

  const nestedDocuments =
    documents.documents ||
    documents.profileDocuments ||
    documents.employeeDocuments ||
    documents.supportingDocuments ||
    documents.attachments ||
    documents.files ||
    documents.data;

  if (nestedDocuments && nestedDocuments !== documents) {
    return normalizeDocumentsPayload(nestedDocuments);
  }

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
  const body = getResponseBody(response);
  const payload = body?.payload || body?.data || body;
  const profilePayload = getPayload(response);

  const documentSources = [
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

  for (const source of documentSources) {
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

  const documentContentSources = documentSources.filter(hasDocumentContent);
  if (documentContentSources.length) return documentContentSources;

  return [];
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

const getPhotoSrc = (photo) => {
  if (!photo) return "";

  if (photo.startsWith("data:") || photo.startsWith("http")) {
    return photo;
  }

  if (photo.startsWith("/9j")) {
    return `data:image/jpeg;base64,${photo}`;
  }

  if (photo.startsWith("iVBOR")) {
    return `data:image/png;base64,${photo}`;
  }

  if (photo.startsWith("R0lGOD")) {
    return `data:image/gif;base64,${photo}`;
  }

  if (photo.startsWith("/")) {
    return photo;
  }

  return `data:image/jpeg;base64,${photo}`;
};

const formatProfileDate = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateForInput = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toISOString().split("T")[0];
};

const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genderOptions = ["Male", "Female", "Other"];
const maritalStatusOptions = ["Single", "Married", "Divorced", "Widowed"];
const departmentOptions = ["Sales", "Recruitment", "Coordination", "Admin", "Finance", "HRMS"];

const personalEmailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const panPattern = /^[A-Za-z0-9]{10}$/;
const adharPattern = /^\d{12}$/;

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

const getDocumentMeta = (document) => {
  if (!document || typeof document === "string") return "";
  const type = document.documentType || document.fileType || document.type;
  const createdAt = document.createdAt || document.createdDate || document.uploadedAt;
  const dateText = createdAt ? new Date(createdAt).toLocaleDateString() : "";
  return [type, dateText].filter(Boolean).join(" • ");
};

const normalizeDocumentType = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getDocumentSectionKey = (document) => {
  const documentType = normalizeDocumentType(
    typeof document === "object" ? document?.documentType || "" : ""
  );

  const matchedByType = documentUploadSections.find(
    (section) => normalizeDocumentType(section.documentType) === documentType
  );
  if (matchedByType) return matchedByType.key;

  const searchText = normalizeDocumentType(
    [
      typeof document === "string" ? document : "",
      typeof document === "object" ? document?.documentType : "",
      typeof document === "object" ? document?.fileName : "",
      typeof document === "object" ? document?.documentName : "",
      typeof document === "object" ? document?.name : "",
      typeof document === "object" ? document?.originalFileName : "",
      typeof document === "object" ? document?.originalName : "",
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (searchText.includes("pan")) return "pan";
  if (
    searchText.includes("adhar") ||
    searchText.includes("aadhar") ||
    searchText.includes("aadhaar")
  ) {
    return "adhar";
  }
  if (searchText.includes("bankpassbook") || searchText.includes("passbook")) {
    return "bankPassbook";
  }
  if (searchText.includes("insurance")) return "insurance";

  return "";
};

const getDocumentExtension = (fileName = "") =>
  fileName.split(".").pop()?.toLowerCase() || "";

const getDocumentType = (document) => {
  const fileName = getDocumentName(document);
  const extension = getDocumentExtension(fileName);
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
  if (mimeType.startsWith("text/") || ["txt", "csv", "json", "xml"].includes(extension)) {
    return "text";
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
  if (type === "text") return "text/plain";
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

  const trimmedValue = value.trim();

  if (trimmedValue.startsWith("data:") || trimmedValue.startsWith("blob:") || trimmedValue.startsWith("http")) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("/")) {
    return `data:image/jpeg;base64,${trimmedValue}`;
  }

  if (
    trimmedValue.startsWith("JVBER") ||
    trimmedValue.startsWith("/9j") ||
    trimmedValue.startsWith("iVBOR") ||
    trimmedValue.startsWith("R0lGOD")
  ) {
    return `data:${getDataUrlMimeType(document)};base64,${trimmedValue}`;
  }

  const looksLikeRelativePath =
    /[\\/]/.test(trimmedValue) &&
    /\.[A-Za-z0-9]{2,8}($|\?)/.test(trimmedValue);
  if (looksLikeRelativePath) {
    return `data:image/jpeg;base64,/${trimmedValue.replace(/^[/\\]+/, "")}`;
  }

  const looksLikeBase64 =
    trimmedValue.length > 100 && /^[A-Za-z0-9+/=\r\n]+$/.test(trimmedValue);
  if (looksLikeBase64) {
    return `data:${getDataUrlMimeType(document)};base64,${trimmedValue}`;
  }

  return "";
};

const getDocumentSource = (document) => {
  if (!document) return "";

  if (typeof document === "string") {
    return normalizeDocumentSource(document, document);
  }

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
};

const getDocumentThumbnailSrc = (document) =>
  getDocumentType(document) === "image" ? getDocumentSource(document) : "";

const isDocumentVerified = (document) =>
  Boolean(
    document?.isVerified ||
      document?.verified ||
      document?.documentVerified
  );

const resolveFileSource = (source) => {
  if (!source) return "";
  if (source.startsWith("data:") || source.startsWith("blob:")) return source;
  if (source.startsWith("http")) return source;
  if (source.startsWith("/")) return `${API_BASE_URL}${source}`;
  return `${API_BASE_URL}/${source.replace(/^[/\\]+/, "")}`;
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

  if (resolvedSource.startsWith("data:") || resolvedSource.startsWith("blob:")) {
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

const getFileIcon = (fileName = "") => {
  const extension = getDocumentExtension(fileName);

  if (extension === "pdf") return <PictureAsPdfOutlined fontSize="small" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
    return <ImageOutlined fontSize="small" />;
  }
  if (["doc", "docx", "txt", "rtf"].includes(extension)) {
    return <DescriptionOutlined fontSize="small" />;
  }
  return <InsertDriveFileOutlined fontSize="small" />;
};

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const { userId, role, entity } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState(initialProfile);
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewDocument, setViewDocument] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const avatarText = useMemo(() => getInitials(profile.name), [profile.name]);
  const canEditProfile = profile.isEditable !== false;
  const existingDocumentsBySection = useMemo(
    () =>
      documentUploadSections.reduce((sections, section) => {
        sections[section.key] = existingDocuments.filter(
          (document) => getDocumentSectionKey(document) === section.key
        );
        return sections;
      }, {}),
    [existingDocuments]
  );

  const fetchProfile = useCallback(async ({ showLoader = true } = {}) => {
    if (!userId) return;

    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await httpService.get(`/users/profile/${userId}`);
      
      if (isErrorResponse(response)) {
        throw new Error("Failed to fetch profile");
      }

      const result = await readResponseBody(response);
      const body = getResponseBody(result);
      const data = getPayload(result);
      const profilePhoto = data.photo || data.profilePhoto || data.imageUrl || "";
      const nextProfile = {
        photo: getPhotoSrc(profilePhoto),
        name: data.userName || data.name || "",
        email: data.email || "",
        personalemail:
          data.personalemail || data.personalEmail || data.personal_email || "",
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
        role: role || "",
        employeeId: data.employeeId || data.userId || "",
        entity: entity || "",
        joiningDate: data.joiningDate || data.joining_date || "",
        officialNumber:
          data.officialNumber || data.officialPhoneNumber || data.officeNumber || "",
        officialEmailId:
          data.officialEmailId || data.officialEmail || data.officeEmail || "",
        probation: data.probation || data.isProbation || "",
        reportingManager: data.reportingManager || data.managerName || "",
        department: data.department || "",
        linkedInUrl: data.linkedInUrl || data.linkedinUrl || data.linkedinURL || "",
        bankName: data.bankName || "",
        accountNumber: data.accountNumber || data.bankAccountNumber || "",
        branch: data.branch || data.bankBranch || "",
        accountHolderName: data.accountHolderName || data.bankAccountHolderName || "",
        ifscCode: data.ifscCode || data.ifsc || "",
        isEmployeeHavingPF: data.isEmployeeHavingPF === true || data.employeeHavingPF === true,
        uanNumber: data.uanNumber || data.uan || "",
        pfNumber: data.pfNumber || "",
        isEmployeeHavingESI: data.isEmployeeHavingESI === true || data.employeeHavingESI === true,
        esiNumber: data.esiNumber || data.esi || "",
        payrollPanNumber: data.payrollPanNumber || data.panNumber || "",
        payrollAadharNumber:
          data.payrollAadharNumber || data.aadharNumber || data.adharNumber || "",
        fAndF: data.fAndF || data.fandF || data.fullAndFinal || data.finalSettlement || "",
        exitFromPfDate: formatDateForInput(
          data.exitFromPfDate || data.existFromPfDate || data.exitFromPFDate || data.existFromPFDate || ""
        ),
        lastWorkingDay: formatDateForInput(
          data.lastWorkingDay || data.lastWorkingDate || data.lwd || ""
        ),
        isEditable: !isProfileLocked(data, body),
      };

      setExistingDocuments(getDocumentsPayload(result));
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [userId, role, entity]);

  useEffect(() => {
    fetchProfile().catch(() => {
      showToast("Unable to load profile details", "error");
    });
  }, [fetchProfile]);

  const handleChange = (field) => (event) => {
    if (!canEditProfile) return;

    const value = event.target.value;
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: ["pan", "ifscCode", "payrollPanNumber"].includes(field)
        ? value.toUpperCase()
        : value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: "",
    }));
  };

  const handleCheckboxChange = (field) => (event) => {
    if (!canEditProfile) return;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: event.target.checked,
    }));
  };

  const handlePhotoChange = (event) => {
    if (!canEditProfile) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setProfile((currentProfile) => ({
        ...currentProfile,
        photo: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentChange = (event) => {
    if (!canEditProfile) return;

    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setSelectedDocumentFiles((currentFiles) => [
      ...currentFiles,
      ...files.map((file) => ({
        file,
        section: otherDocumentType,
        documentType: otherDocumentType,
      })),
    ]);
  };

  const handleSectionDocumentChange = (section) => (event) => {
    if (!canEditProfile) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedDocumentFiles((currentFiles) => [
      ...currentFiles.filter((item) => item.sectionKey !== section.key),
      {
        file,
        section: section.label,
        sectionKey: section.key,
        documentType: section.documentType,
      },
    ]);
  };

  const handleRemoveSelectedDocument = (indexToRemove) => {
    if (!canEditProfile) return;

    setSelectedDocumentFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove)
    );

    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  const handleTabChange = (event, nextTab) => {
    setActiveTab(nextTab);
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

  const handleCancel = () => {
    setProfile(savedProfile);
    setSelectedPhotoFile(null);
    setSelectedDocumentFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
    navigate(-1);
  };

  const validateProfile = () => {
    const nextErrors = {};

    if (profile.pan && !panPattern.test(profile.pan)) {
      nextErrors.pan = "PAN must be exactly 10 alphanumeric characters";
    }

    if (profile.adhar && !adharPattern.test(profile.adhar)) {
      nextErrors.adhar = "Adhar must be exactly 12 digits";
    }

    if (profile.personalemail && !personalEmailPattern.test(profile.personalemail)) {
      nextErrors.personalemail = "Personal email must be a valid email address";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canEditProfile) {
      return;
    }

    if (!validateProfile()) {
      showToast("Please fix the highlighted fields", "error");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
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
      formData.append("role", role || profile.role || "");
      formData.append("entity", entity || profile.entity || "");
      formData.append("joiningDate", profile.joiningDate || "");
      formData.append("officialNumber", profile.officialNumber || "");
      formData.append("officialEmailId", profile.email || profile.officialEmailId || "");
      formData.append("probation", profile.probation || "");
      formData.append("reportingManager", profile.reportingManager || "");
      formData.append("department", profile.department || "");
      formData.append("linkedInUrl", profile.linkedInUrl || "");
      formData.append("bankName", profile.bankName || "");
      formData.append("accountNumber", profile.accountNumber || "");
      formData.append("branch", profile.branch || "");
      formData.append("accountHolderName", profile.accountHolderName || "");
      formData.append("ifscCode", profile.ifscCode || "");
      formData.append("isEmployeeHavingPF", String(Boolean(profile.isEmployeeHavingPF)));
      formData.append("uanNumber", profile.uanNumber || "");
      formData.append("pfNumber", profile.pfNumber || "");
      formData.append("isEmployeeHavingESI", String(Boolean(profile.isEmployeeHavingESI)));
      formData.append("employeeHavingESI", String(Boolean(profile.isEmployeeHavingESI)));
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

      if (selectedPhotoFile) {
        formData.append("profilePhoto", selectedPhotoFile);
      }

      selectedDocumentFiles.forEach((item) => {
        formData.append("documents", item.file || item);
        formData.append("documentTypes", item.documentType || otherDocumentType);
      });

      await httpService.put(`/users/update/${profile.employeeId || userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
     
      const updateResult = await readResponseBody(updateResponse);

      if (isErrorResponse(updateResponse) || updateResult?.success === false) {
        throw new Error(updateResult?.message || "Failed to update profile");
      }

      setSelectedPhotoFile(null);
      setSelectedDocumentFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (documentInputRef.current) {
        documentInputRef.current.value = "";
      }
      fetchProfile({ showLoader: false }).catch(() => {});
      window.dispatchEvent(new Event("profileUpdated"));
      showToast(updateResult?.message || "Profile updated successfully", "success");
    } catch (error) {
      showToast("Unable to update profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" color="primary" fontWeight={700}>
            Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View your account details and update editable information.
          </Typography>
        </Box>
        {loading && (
          <Stack direction="row" alignItems="center" gap={1}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Loading profile
            </Typography>
          </Stack>
        )}
      </Stack>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            mb: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 44,
            },
          }}
        >
          {profileTabs.map((tab) => (
            <Tab key={tab} label={tab} />
          ))}
        </Tabs>

        {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Stack alignItems="center" spacing={2}>
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={profile.photo}
                  sx={{
                    width: 132,
                    height: 132,
                    bgcolor: "primary.main",
                    fontSize: "2rem",
                    fontWeight: 700,
                  }}
                >
                  {avatarText}
                </Avatar>
                <IconButton
                  color="primary"
                  aria-label="Edit profile photo"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canEditProfile}
                  sx={{
                    position: "absolute",
                    right: 4,
                    bottom: 4,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    "&:hover": { bgcolor: "background.paper" },
                  }}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoChange}
                disabled={!canEditProfile}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileOutlined />}
                onClick={() => fileInputRef.current?.click()}
                disabled={!canEditProfile}
              >
                Upload Photo
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  value={profile.name}
                  onChange={handleChange("name")}
                  fullWidth
                  disabled={!canEditProfile}
                  InputProps={{ startAdornment: <BadgeOutlined sx={{ mr: 1 }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Personal Email"
                  value={profile.personalemail}
                  onChange={handleChange("personalemail")}
                  fullWidth
                  disabled={!canEditProfile}
                  error={Boolean(errors.personalemail)}
                  helperText={errors.personalemail || ""}
                  InputProps={{ startAdornment: <EmailOutlined sx={{ mr: 1 }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  value={profile.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                  fullWidth
                  disabled={!canEditProfile}
                  inputProps={{ maxLength: 10 }}
                  InputProps={{ startAdornment: <PhoneOutlined sx={{ mr: 1 }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Father Name / Spouse Name"
                  value={profile.fatherOrSpouseName}
                  onChange={handleChange("fatherOrSpouseName")}
                  fullWidth
                  disabled={!canEditProfile}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mother Name"
                  value={profile.motherName}
                  onChange={handleChange("motherName")}
                  fullWidth
                  disabled={!canEditProfile}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="DOB"
                  type="date"
                  value={profile.dob}
                  onChange={handleChange("dob")}
                  fullWidth
                  disabled={!canEditProfile}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Blood Group"
                  value={profile.bloodGroup}
                  onChange={handleChange("bloodGroup")}
                  fullWidth
                  disabled={!canEditProfile}
                  select
                >
                  {bloodGroupOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Gender"
                  value={profile.gender}
                  onChange={handleChange("gender")}
                  fullWidth
                  disabled={!canEditProfile}
                  select
                >
                  {genderOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Marital Status"
                  value={profile.maritalStatus}
                  onChange={handleChange("maritalStatus")}
                  fullWidth
                  disabled={!canEditProfile}
                  select
                >
                  {maritalStatusOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Employee ID"
                  value={profile.employeeId}
                  fullWidth
                  disabled
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>
              Other Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Role" value={profile.role} fullWidth disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Entity" value={profile.entity} fullWidth disabled />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Emergency Contact No"
                  value={profile.emergencyContactNo}
                  onChange={handleChange("emergencyContactNo")}
                  fullWidth
                  disabled={!canEditProfile}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Address"
                  value={profile.currentAddress}
                  onChange={handleChange("currentAddress")}
                  fullWidth
                  disabled={!canEditProfile}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Permanent Address"
                  value={profile.permanentAddress}
                  onChange={handleChange("permanentAddress")}
                  fullWidth
                  disabled={!canEditProfile}
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Joining Date"
                value={formatProfileDate(profile.joiningDate)}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Official Number (optional)"
                value={profile.officialNumber}
                onChange={handleChange("officialNumber")}
                fullWidth
                disabled={!canEditProfile}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Official EMail ID"
                value={profile.email}
                fullWidth
                disabled
                InputProps={{ startAdornment: <EmailOutlined sx={{ mr: 1 }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Probation"
                value={profile.probation}
                onChange={handleChange("probation")}
                fullWidth
                disabled={!canEditProfile}
                select
              >
                {["Yes", "No"].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Reporting Manager"
                value={profile.reportingManager}
                onChange={handleChange("reportingManager")}
                fullWidth
                disabled={!canEditProfile}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department"
                value={profile.department}
                onChange={handleChange("department")}
                fullWidth
                disabled={!canEditProfile}
                select
              >
                {departmentOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="LinkedIn URL"
                value={profile.linkedInUrl}
                onChange={handleChange("linkedInUrl")}
                fullWidth
                disabled={!canEditProfile}
              />
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2, height: "100%" }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Bank Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Bank Name"
                      value={profile.bankName}
                      onChange={handleChange("bankName")}
                      fullWidth
                      disabled={!canEditProfile}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Account Number"
                      value={profile.accountNumber}
                      onChange={handleChange("accountNumber")}
                      fullWidth
                      disabled={!canEditProfile}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Branch"
                      value={profile.branch}
                      onChange={handleChange("branch")}
                      fullWidth
                      disabled={!canEditProfile}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Account Holder Name"
                      value={profile.accountHolderName}
                      onChange={handleChange("accountHolderName")}
                      fullWidth
                      disabled={!canEditProfile}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="IFSC Code"
                      value={profile.ifscCode}
                      onChange={handleChange("ifscCode")}
                      fullWidth
                      disabled={!canEditProfile}
                      inputProps={{ style: { textTransform: "uppercase" } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="PAN Number"
                      value={profile.payrollPanNumber}
                      onChange={handleChange("payrollPanNumber")}
                      fullWidth
                      disabled={!canEditProfile}
                      inputProps={{ style: { textTransform: "uppercase" } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Aadhar Number"
                      value={profile.payrollAadharNumber}
                      onChange={handleChange("payrollAadharNumber")}
                      fullWidth
                      disabled={!canEditProfile}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2} sx={{ height: "100%" }}>
              <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={1.5} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    PF Details
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(profile.isEmployeeHavingPF)}
                        onChange={handleCheckboxChange("isEmployeeHavingPF")}
                        disabled={!canEditProfile}
                      />
                    }
                    label="Employee having PF"
                  />
                </Stack>
                {profile.isEmployeeHavingPF && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="PF Number"
                        value={profile.pfNumber}
                        onChange={handleChange("pfNumber")}
                        fullWidth
                        disabled={!canEditProfile}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="UAN Number"
                        value={profile.uanNumber}
                        onChange={handleChange("uanNumber")}
                        fullWidth
                        disabled={!canEditProfile}
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>
              <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={1.5} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    ESI Details
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(profile.isEmployeeHavingESI)}
                        onChange={handleCheckboxChange("isEmployeeHavingESI")}
                        disabled={!canEditProfile}
                      />
                    }
                    label="Employee having ESI"
                  />
                </Stack>
                {profile.isEmployeeHavingESI && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="ESI Number"
                        value={profile.esiNumber}
                        onChange={handleChange("esiNumber")}
                        fullWidth
                        disabled={!canEditProfile}
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>
              </Stack>
            </Grid>
          </Grid>
        )}

        {activeTab === 3 && (
          <Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              gap={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6">Documents</Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload PAN, Aadhar, Bank Passbook, Insurance, and other profile documents.
                </Typography>
              </Box>
              <input
                ref={documentInputRef}
                type="file"
                hidden
                multiple
                onChange={handleDocumentChange}
                disabled={!canEditProfile}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileOutlined />}
                onClick={() => documentInputRef.current?.click()}
                disabled={!canEditProfile}
              >
                Select Other Documents
              </Button>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              {documentUploadSections.map((section) => {
                const selectedItem = selectedDocumentFiles.find(
                  (item) => item.sectionKey === section.key
                );
                const selectedFile = selectedItem?.file;
                const existingSectionDocuments = existingDocumentsBySection[section.key] || [];
                const hasExistingDocument = existingSectionDocuments.length > 0;
                const existingDocument = existingSectionDocuments[0];

                return (
                  <Grid item xs={12} sm={6} md={3} key={section.key}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, height: "100%" }}>
                      <Stack spacing={1.5}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          <Stack direction="row" alignItems="center" gap={0.75}>
                            <span>{section.label}</span>
                            {isDocumentVerified(existingDocument) && (
                              <Tooltip title="Verified">
                                <CheckCircleOutlined color="success" fontSize="small" />
                              </Tooltip>
                            )}
                          </Stack>
                        </Typography>
                        <input
                          type="file"
                          hidden
                          id={`profile-${section.key}-document`}
                          onChange={handleSectionDocumentChange(section)}
                          disabled={!canEditProfile}
                        />
                        <Button
                          variant="outlined"
                          startIcon={<UploadFileOutlined />}
                          component="label"
                          htmlFor={`profile-${section.key}-document`}
                          disabled={!canEditProfile || hasExistingDocument}
                          fullWidth
                        >
                          {hasExistingDocument ? "Document Uploaded" : "Select Document"}
                        </Button>
                        <Typography
                          variant="caption"
                          color={selectedFile ? "text.primary" : "text.secondary"}
                          noWrap
                          title={selectedFile?.name || ""}
                        >
                          {selectedFile?.name ||
                            (hasExistingDocument
                              ? getDocumentName(existingSectionDocuments[0])
                              : "No file selected")}
                        </Typography>
                        {hasExistingDocument && (
                          <Stack direction="row" gap={0.5}>
                            <Tooltip title="View document">
                              <span>
                                <IconButton
                                  size="small"
                                  color="info"
                                  disabled={!getDocumentSource(existingDocument) || viewLoading}
                                  onClick={() => handleViewDocument(existingDocument)}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Download document">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled={!getDocumentSource(existingDocument)}
                                  onClick={() =>
                                    downloadFile(
                                      getDocumentSource(existingDocument),
                                      getDocumentName(existingDocument)
                                    )
                                  }
                                >
                                  <DownloadOutlined fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {selectedDocumentFiles.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                {selectedDocumentFiles.map((item, index) => {
                  const file = item.file || item;
                  const sectionLabel = item.section ? `${item.section}: ` : "";
                  return (
                  <Chip
                    key={`${file.name}-${index}`}
                    icon={getFileIcon(file.name)}
                    label={`${sectionLabel}${file.name}`}
                    variant="outlined"
                    onDelete={() => handleRemoveSelectedDocument(index)}
                    deleteIcon={<CancelOutlined />}
                    sx={{
                      maxWidth: { xs: "100%", sm: 260 },
                      "& .MuiChip-label": {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    }}
                  />
                  );
                })}
              </Stack>
            )}

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "background.paper",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="subtitle2">
                  Existing Documents ({existingDocuments.length})
                </Typography>
              </Box>

              {existingDocuments.length > 0 ? (
                <Grid container spacing={0}>
                  {existingDocuments.map((document, index) => {
                    const documentName = getDocumentName(document);
                    const meta = getDocumentMeta(document);
                    const source = getDocumentSource(document);
                    return (
                      <Grid item xs={12} sm={6} key={`${documentName}-${index}`}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={1.5}
                          sx={{
                            p: 2,
                            minHeight: 72,
                            borderBottom: "1px solid",
                            borderRight: { sm: index % 2 === 0 ? "1px solid" : "none" },
                            borderColor: "divider",
                          }}
                        >
                          <Avatar
                            src={getDocumentSource(document)}
                            variant="rounded"
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: "primary.main",
                              flexShrink: 0,
                              "& img": {
                                objectFit: "cover",
                              },
                            }}
                          >
                            {getFileIcon(documentName)}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                                title={documentName}
                                sx={{ minWidth: 0 }}
                              >
                                {documentName}
                              </Typography>
                              {isDocumentVerified(document) && (
                                <Tooltip title="Verified">
                                  <CheckCircleOutlined color="success" fontSize="small" />
                                </Tooltip>
                              )}
                            </Stack>
                            {meta && (
                              <Typography variant="caption" color="text.secondary">
                                {meta}
                              </Typography>
                            )}
                          </Box>
                          <Stack direction="row" gap={0.5} sx={{ flexShrink: 0 }}>
                            <Tooltip title="View document">
                              <span>
                                <IconButton
                                  size="small"
                                  color="info"
                                  disabled={!source || viewLoading}
                                  onClick={() => handleViewDocument(document)}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Download document">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled={!source}
                                  onClick={() => downloadFile(source, documentName)}
                                >
                                  <DownloadOutlined fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 0 }}>
                  No existing documents found.
                </Alert>
              )}
            </Box>
          </Box>
        )}

        {activeTab === 4 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="F&F"
                value={profile.fAndF}
                onChange={handleChange("fAndF")}
                fullWidth
                disabled={!canEditProfile}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Exist From PF Date"
                type="date"
                value={profile.exitFromPfDate}
                onChange={handleChange("exitFromPfDate")}
                fullWidth
                disabled={!canEditProfile}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Working day"
                type="date"
                value={profile.lastWorkingDay}
                onChange={handleChange("lastWorkingDay")}
                fullWidth
                disabled={!canEditProfile}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        )}

        {activeTab !== 0 && activeTab !== 1 && activeTab !== 2 && activeTab !== 3 && activeTab !== 4 && (
          <Box
            sx={{
              py: 6,
              px: 2,
              textAlign: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No details available.
            </Typography>
          </Box>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="flex-end"
          gap={2}
          sx={{ mt: 4 }}
        >
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<CancelOutlined />}
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
            disabled={saving || !canEditProfile}
          >
            Submit
          </Button>
        </Stack>
      </Paper>

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
            <Box sx={{ p: 4, textAlign: "center" }}>
              <InsertDriveFileOutlined sx={{ fontSize: 56, color: "text.secondary", mb: 2 }} />
              <Typography variant="body1" fontWeight={600}>
                Preview is not available for this file type.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Download the document to open it on your device.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            startIcon={<DownloadOutlined />}
            onClick={() => downloadFile(viewDocument?.source || viewDocument?.url, viewDocument?.name)}
            disabled={!viewDocument}
          >
            Download
          </Button>
          <Button type="button" onClick={closeDocumentViewer}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
