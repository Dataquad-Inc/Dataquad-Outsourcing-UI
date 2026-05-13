import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  BadgeOutlined,
  CancelOutlined,
  DescriptionOutlined,
  EditOutlined,
  EmailOutlined,
  ImageOutlined,
  InsertDriveFileOutlined,
  PhoneOutlined,
  PictureAsPdfOutlined,
  SaveOutlined,
  UploadFileOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { showToast } from "../../utils/ToastNotification";

const initialProfile = {
  photo: "",
  name: "",
  email: "",
  personalemail: "",
  phoneNumber: "",
  pan: "",
  adhar: "",
  currentAddress: "",
  emergencyContactNo: "",
  permanentAddress: "",
  role: "",
  employeeId: "",
  entity: "",
  joiningDate: "",
};

const getResponseBody = (response) => response?.data || response || {};

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

  const avatarText = useMemo(() => getInitials(profile.name), [profile.name]);

  const fetchProfile = useCallback(async ({ showLoader = true } = {}) => {
    if (!userId) return;

    if (showLoader) {
      setLoading(true);
    }

    try {
      // const response = await httpService.get(`/users/profile/${userId}`);
      const response = await fetch(
        `http://localhost:8083/users/profile/${userId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const result = await response.json();
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
        currentAddress: data.currentAddress || "",
        emergencyContactNo: data.emergencyContactNo || "",
        permanentAddress: data.permanentAddress || "",
        role: role || "",
        employeeId: data.employeeId || data.userId || "",
        entity: entity || "",
        joiningDate: data.joiningDate || data.joining_date || "",
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
    const value = event.target.value;
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: field === "pan" ? value.toUpperCase() : value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: "",
    }));
  };

  const handlePhotoChange = (event) => {
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
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setSelectedDocumentFiles(files);
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
      formData.append("currentAddress", profile.currentAddress || "");
      formData.append("emergencyContactNo", profile.emergencyContactNo || "");
      formData.append("permanentAddress", profile.permanentAddress || "");
      formData.append("role", role || profile.role || "");
      formData.append("entity", entity || profile.entity || "");
      formData.append("joiningDate", profile.joiningDate || "");

      if (selectedPhotoFile) {
        formData.append("profilePhoto", selectedPhotoFile);
      }

      selectedDocumentFiles.forEach((file) => {
        formData.append("documents", file);
      });

      // await httpService.put(`/users/update/${profile.employeeId || userId}`, formData, {
      //   headers: {
      //     "Content-Type": "multipart/form-data",
      //   },
      // });
      const updateResponse = await fetch(`http://localhost:8083/users/update/${profile.employeeId || userId}`, {
        method: "PUT",
        body: formData,
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update profile");
      }

      setSelectedPhotoFile(null);
      setSelectedDocumentFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (documentInputRef.current) {
        documentInputRef.current.value = "";
      }
      await fetchProfile({ showLoader: false });
      window.dispatchEvent(new Event("profileUpdated"));
      showToast("Profile updated successfully", "success");
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
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileOutlined />}
                onClick={() => fileInputRef.current?.click()}
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
                  fullWidth
                  disabled
                  InputProps={{ startAdornment: <BadgeOutlined sx={{ mr: 1 }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  value={profile.email}
                  fullWidth
                  disabled
                  InputProps={{ startAdornment: <EmailOutlined sx={{ mr: 1 }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Personal Email"
                  value={profile.personalemail}
                  onChange={handleChange("personalemail")}
                  fullWidth
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
                  inputProps={{ maxLength: 10 }}
                  InputProps={{ startAdornment: <PhoneOutlined sx={{ mr: 1 }} /> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="PAN"
                  value={profile.pan}
                  onChange={handleChange("pan")}
                  fullWidth
                  error={Boolean(errors.pan)}
                  helperText={errors.pan || "10 alphanumeric characters"}
                  inputProps={{ maxLength: 10, style: { textTransform: "uppercase" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Adhar"
                  value={profile.adhar}
                  onChange={handleChange("adhar")}
                  fullWidth
                  error={Boolean(errors.adhar)}
                  helperText={errors.adhar || "12 digits only"}
                  inputProps={{ maxLength: 12 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Employee ID"
                  value={profile.employeeId}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Joining Date"
                  value={formatProfileDate(profile.joiningDate)}
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
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Address"
                  value={profile.currentAddress}
                  onChange={handleChange("currentAddress")}
                  fullWidth
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
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

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
                  Upload files and review documents already attached to your profile.
                </Typography>
              </Box>
              <input
                ref={documentInputRef}
                type="file"
                hidden
                multiple
                onChange={handleDocumentChange}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileOutlined />}
                onClick={() => documentInputRef.current?.click()}
              >
                Select Files
              </Button>
            </Stack>

            {selectedDocumentFiles.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                {selectedDocumentFiles.map((file, index) => (
                  <Chip
                    key={`${file.name}-${index}`}
                    icon={getFileIcon(file.name)}
                    label={file.name}
                    variant="outlined"
                    sx={{
                      maxWidth: { xs: "100%", sm: 260 },
                      "& .MuiChip-label": {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    }}
                  />
                ))}
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
                    console.log("Document:", document);
                    const documentName = getDocumentName(document);
                    const meta = getDocumentMeta(document);
                    const thumbnailSrc = getDocumentThumbnailSrc(document?.documentData);
console.log("Document document?.documentData:", getDocumentThumbnailSrc(document));
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
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              noWrap
                              title={documentName}
                            >
                              {documentName}
                            </Typography>
                            {meta && (
                              <Typography variant="caption" color="text.secondary">
                                {meta}
                              </Typography>
                            )}
                          </Box>
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
                disabled={saving}
              >
                Submit
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profile;
