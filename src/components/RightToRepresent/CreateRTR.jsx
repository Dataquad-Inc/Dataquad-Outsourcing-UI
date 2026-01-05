import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Button,
  Collapse,
} from "@mui/material";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import DynamicFormUltra from "../../components/FormContainer/DynamicFormUltra";
import SimpleDocumentsDisplay from "../Hotlist/SimpleDocumentsDisplay";
import { rightToRepresentAPI, usClientsAPI } from "../../utils/api";
import { fetchEmployeesUs, fetchTeamMembers } from "../../redux/usEmployees";
import axios from "axios";

const CreateRTR = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { userId } = useSelector((state) => state.auth);

  const formikRef = useRef(null);

  // State
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDocuments, setShowDocuments] = useState(true);
  const [selectedTeamleadId, setSelectedTeamleadId] = useState("");

  const [predefinedRecruiters, setPredefinedRecruiters] = useState([]);
  const [predefinedSalesExecutives, setPredefinedSalesExecutives] = useState([]);

  const consultantData = location.state?.consultantData || {};
  const isEditMode = Boolean(consultantData?.consultantId);

  const employees = useSelector((state) => state.usEmployees?.employees) || [];
  const recruiters = useSelector((state) => state.usEmployees?.recruiters) || [];
  const salesExecutives = useSelector((state) => state.usEmployees?.salesExecutives) || [];

  const getInitialValues = useCallback(() => {
    const baseValues = {
      // Consultant Profile
      name: isEditMode ? consultantData.name || "" : "",
      emailId: isEditMode ? consultantData.emailId || "" : "",
      grade: isEditMode ? consultantData.grade || "" : "",
      marketingContact: isEditMode ? consultantData.marketingContact || "" : "",
      personalContact: isEditMode ? consultantData.personalContact || "" : "",
      reference: isEditMode ? consultantData.reference || "" : "",
      recruiterId: isEditMode ? consultantData.recruiterId || "" : "",
      teamLeadId: isEditMode ? consultantData.teamLeadId || "" : "",
      status: isEditMode ? consultantData.status || "ACTIVE" : "ACTIVE",
      passport: isEditMode ? consultantData.passport || "" : "",
      salesExecutiveId: isEditMode ? consultantData.salesExecutiveId || "" : "",
      remoteOnsite: isEditMode ? consultantData.remoteOnsite || "REMOTE" : "REMOTE",
      technology: isEditMode ? consultantData.technology || "" : "",
      experience: isEditMode ? consultantData.experience || "" : "",
      location: isEditMode ? consultantData.location || "" : "",
      originalDOB: isEditMode ? consultantData.originalDOB || "" : "",
      editedDOB: isEditMode ? consultantData.editedDOB || "" : "",
      linkedInUrl: isEditMode ? consultantData.linkedInUrl || "" : "",
      relocation: isEditMode ? consultantData.relocation || "" : "",
      billRate: isEditMode ? consultantData.billRate || "" : "",
      payroll: isEditMode ? consultantData.payroll || "" : "",
      marketingStartDate: isEditMode ? consultantData.marketingStartDate || "" : "",
      marketingVisa: isEditMode ? consultantData.marketingVisa || "" : "",
      actualVisa: isEditMode ? consultantData.actualVisa || "" : "",
      // approvalStatus: isEditMode ? consultantData.approvalStatus || "APPROVED" : "PENDING",
      remarks: isEditMode ? consultantData.remarks || "" : "",

      // RTR Fields
      clientName: "",
      clientId: "",
      ratePart: "",
      vendorName: "",
      vendorEmailId: "",
      vendorMobileNumber: "",
      vendorCompany: "",
      vendorLinkedIn: "",
      implementationPartner: "",
      comments: "",

      // File uploads - initialize as empty arrays for Formik
      resumes: [],
      documents: [],
    };

    return baseValues;
  }, [isEditMode, consultantData]);

  const formInitialValues = React.useMemo(() => {
    const values = getInitialValues();

    if (isEditMode && values.teamLeadId) {
      setSelectedTeamleadId(values.teamLeadId);
    }

    return values;
  }, [getInitialValues, isEditMode]);

  useEffect(() => {
    dispatch(fetchEmployeesUs("TEAMLEAD"));
  }, [dispatch]);

  useEffect(() => {
    if (selectedTeamleadId) {
      console.log("Fetching team members for teamlead:", selectedTeamleadId);
      dispatch(fetchTeamMembers(selectedTeamleadId));
    }
  }, [selectedTeamleadId, dispatch]);

  useEffect(() => {
    if (isEditMode && consultantData) {
      console.log("Setting predefined options for edit mode:", consultantData);

      if (consultantData.recruiterId && consultantData.recruiterName) {
        setPredefinedRecruiters([
          {
            userId: consultantData.recruiterId,
            userName: consultantData.recruiterName,
          },
        ]);
      } else if (consultantData.recruiterId) {
        setPredefinedRecruiters([
          {
            userId: consultantData.recruiterId,
            userName: "Recruiter",
          },
        ]);
      }

      if (consultantData.salesExecutiveId && consultantData.salesExecutive) {
        setPredefinedSalesExecutives([
          {
            userId: consultantData.salesExecutiveId,
            userName: consultantData.salesExecutive,
          },
        ]);
      } else if (consultantData.salesExecutiveId) {
        setPredefinedSalesExecutives([
          {
            userId: consultantData.salesExecutiveId,
            userName: "Sales Executive",
          },
        ]);
      }
    }
  }, [isEditMode, consultantData]);

  const effectiveRecruiters = React.useMemo(() => {
    return isEditMode && predefinedRecruiters.length > 0
      ? predefinedRecruiters
      : recruiters;
  }, [isEditMode, predefinedRecruiters, recruiters]);

  const effectiveSalesExecutives = React.useMemo(() => {
    return isEditMode && predefinedSalesExecutives.length > 0
      ? predefinedSalesExecutives
      : salesExecutives;
  }, [isEditMode, predefinedSalesExecutives, salesExecutives]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const clientsResponse = await usClientsAPI.getAllClients();
        setClients(clientsResponse.data || []);

      } catch (error) {
        console.error("Error fetching data:", error);
        showErrorToast("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleTeamLeadChange = useCallback((teamLeadId) => {
    console.log("Team lead changed to:", teamLeadId);
    setSelectedTeamleadId(teamLeadId);

    if (isEditMode) {
      setPredefinedRecruiters([]);
      setPredefinedSalesExecutives([]);
    }
  }, [isEditMode]);

  const handleSubmit = async (values, formikHelpers) => {
    console.log("=== FORM SUBMISSION START ===");

    try {
      setIsSubmitting(true);
      setError("");

      // Extract and validate files from Formik values
      const resumes = values.resumes;
      const documents = values.documents;

      console.log("Files from form values:", { resumes, documents });

      // Process resume files
      const resumeFiles = [];
      if (resumes) {
        if (Array.isArray(resumes)) {
          resumeFiles.push(...resumes.filter(f => f instanceof File));
        } else if (resumes instanceof FileList) {
          resumeFiles.push(...Array.from(resumes).filter(f => f instanceof File));
        } else if (resumes instanceof File) {
          resumeFiles.push(resumes);
        }
      }

      if (resumeFiles.length === 0 && !isEditMode) {
        showErrorToast("Please upload at least one resume");
        formikHelpers.setSubmitting(false);
        setIsSubmitting(false);
        return;
      }

      // Find client ID
      const selectedClient = clients.find(client => client.clientName === values.clientName);
      const clientId = selectedClient?.clientId || "";

      if (!clientId) {
        showErrorToast("Invalid client selected");
        formikHelpers.setSubmitting(false);
        setIsSubmitting(false);
        return;
      }

      // Prepare payloads - ensure all fields are properly set
      const rateTerms = {
        clientId: clientId,
        clientName: values.clientName || "",
        ratePart: values.ratePart || "",
        vendorName: values.vendorName || "",
        vendorEmailId: values.vendorEmailId || "",
        vendorMobileNumber: values.vendorMobileNumber || "",
        vendorCompany: values.vendorCompany || "",
        vendorLinkedIn: values.vendorLinkedIn || "",
        implementationPartner: values.implementationPartner || "",
        comments: values.comments || "",
      };

      // Debug log to check values
      console.log("Form values for hotList:", values);

      const hotList = {
        teamLeadId: values.teamLeadId || "",
        salesExecutiveId: values.salesExecutiveId || "",
        recruiterId: values.recruiterId || "",
        name: values.name || "",
        emailId: values.emailId || "",
        grade: values.grade || "",
        location: values.location || "",
        marketingContact: values.marketingContact || "",
        personalContact: values.personalContact || "",
        status: values.status === "ACTIVE" ? "Active" :
          values.status === "INACTIVE" ? "Inactive" :
            values.status === "ON_HOLD" ? "On Hold" : "Active",
        remoteOnsite: values.remoteOnsite === "REMOTE" ? "Remote" :
          values.remoteOnsite === "ONSITE" ? "Onsite" :
            values.remoteOnsite === "HYBRID" ? "Hybrid" : "Remote",
        passport: values.passport || "",
        marketingVisa: values.marketingVisa || "",
        actualVisa: values.actualVisa || "",
        relocation: values.relocation || "",
        technology: values.technology || "",
        experience: values.experience ? values.experience.toString() : "0",
        originalDOB: values.originalDOB || null,
        editedDOB: values.editedDOB || null,
        marketingStartDate: values.marketingStartDate || null,
        billRate: values.billRate || "",
        payroll: values.payroll || "",
        remarks: values.remarks || "",
        reference: values.reference || "",
        linkedInUrl: values.linkedInUrl || "",
        // Add these fields if they're required by backend
        // approvalStatus: values.approvalStatus || "APPROVED",
        consultantId: isEditMode ? consultantData.consultantId : null,
      };

      console.log("Rate Terms Payload:", rateTerms);
      console.log("Hot List Payload:", JSON.stringify(hotList, null, 2));

      // Create FormData
      const formDataToSend = new FormData();

      // FIX: Create Blobs with proper JSON stringification
      const rateTermsBlob = new Blob(
        [JSON.stringify(rateTerms)],
        { type: "application/json" }
      );

      const hotListBlob = new Blob(
        [JSON.stringify(hotList)],
        { type: "application/json" }
      );

      // Append Blobs to FormData
      formDataToSend.append("rateTerms", rateTermsBlob);
      formDataToSend.append("hotList", hotListBlob);
      formDataToSend.append("isAssignAll", "false");

      // Append resume files
      console.log("Appending resumes:", resumeFiles);
      resumeFiles.forEach((file) => {
        if (file instanceof File) {
          formDataToSend.append("resumes", file, file.name);
          console.log(`Appended resume:`, file.name, file.size, file.type);
        }
      });

      // Process and append document files
      if (documents) {
        const documentFiles = [];
        if (Array.isArray(documents)) {
          documentFiles.push(...documents.filter(f => f instanceof File));
        } else if (documents instanceof FileList) {
          documentFiles.push(...Array.from(documents).filter(f => f instanceof File));
        } else if (documents instanceof File) {
          documentFiles.push(documents);
        }

        console.log("Appending documents:", documentFiles);
        documentFiles.forEach((file) => {
          if (file instanceof File) {
            formDataToSend.append("documents", file, file.name);
            console.log(`Appended document:`, file.name, file.size, file.type);
          }
        });
      }

      // Log FormData contents for debugging - This is CRITICAL
      console.log("=== FormData Contents ===");
      console.log("FormData keys:", Array.from(formDataToSend.keys()));

      // Check each Blob content
      console.log("Checking rateTerms Blob:");
      const rateTermsReader = new FileReader();
      rateTermsReader.onload = function () {
        console.log("rateTerms content:", this.result);
      };
      rateTermsReader.readAsText(rateTermsBlob);

      console.log("Checking hotList Blob:");
      const hotListReader = new FileReader();
      hotListReader.onload = function () {
        console.log("hotList content:", this.result);
      };
      hotListReader.readAsText(hotListBlob);

      // Alternative: Log all entries
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [FILE] ${value.name} (${value.size} bytes)`);
        } else if (value instanceof Blob) {
          console.log(`${key}: [BLOB] ${value.type} (${value.size} bytes)`);

          // Read blob content if it's JSON
          if (value.type === "application/json") {
            const reader = new FileReader();
            reader.onload = function () {
              try {
                const content = JSON.parse(this.result);
                console.log(`${key} JSON content:`, content);
              } catch (e) {
                console.log(`${key} raw content:`, this.result);
              }
            };
            reader.readAsText(value);
          }
        } else {
          console.log(`${key}:`, value);
        }
      }

      console.log("Sending request to API...");

      // Submit to API
      const response = await axios.post(
        `https://mymulya.com/hotlist/create-direct-rtr/${userId}?isAssignAll=false`,
        formDataToSend,
        {
          withCredentials: true,
          timeout: 20000,
        }
      );
      console.log("API Response:", response.data);
      if (response.data?.success) {
        showSuccessToast("RTR created successfully!");
        navigate("/dashboard/rtr/rtr-list");
      } else {
        throw new Error(response.data?.message || "Failed to create RTR");
      }
      console.log("API Response:", response);

      if (response.data?.success || response.success) {
        showSuccessToast("RTR created successfully!");
        navigate("/dashboard/rtr/rtr-list");
      } else {
        throw new Error(response.data?.message || "Failed to create RTR");
      }

    } catch (error) {
      console.error("=== ERROR DETAILS ===", error);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error?.errorMessage ||
        error.message ||
        "Failed to submit form. Please try again.";
      setError(errorMessage);
      showErrorToast(errorMessage);

    } finally {
      console.log("=== FORM SUBMISSION END ===");
      setIsSubmitting(false);
      if (formikHelpers?.setSubmitting) formikHelpers.setSubmitting(false);
    }
  };

  const handleCancel = useCallback(() => {
    navigate("/dashboard/rtr/rtr-list");
  }, [navigate]);

  const formConfig = React.useMemo(() => {
    const teamLeadOptions = employees
      .filter(emp => emp && emp.employeeId)
      .map((emp) => ({
        label: emp.employeeName || `Employee ${emp.employeeId}`,
        value: emp.employeeId,
      }));

    const recruiterOptions = effectiveRecruiters
      .filter(emp => emp && (emp.userId || emp.employeeId))
      .map((emp) => ({
        label: emp.userName || emp.employeeName || `User ${emp.userId || emp.employeeId}`,
        value: emp.userId || emp.employeeId,
      }));

    const salesExecutiveOptions = effectiveSalesExecutives
      .filter(emp => emp && (emp.userId || emp.employeeId))
      .map((emp) => ({
        label: emp.userName || emp.employeeName || `User ${emp.userId || emp.employeeId}`,
        value: emp.userId || emp.employeeId,
      }));

    const clientOptions = clients
      .filter(client => client && client.clientName)
      .map(client => ({
        label: client.clientName,
        value: client.clientName,
      }));

    return [
      // Section 1: Consultant Profile
      {
        section: "Consultant Profile",
        fields: [
          {
            name: "name",
            label: "Consultant Name",
            type: "text",
            required: true,
            icon: "Person",
            disabled: isEditMode,
          },
          {
            name: "emailId",
            label: "Email ID",
            type: "email",
            required: true,
            icon: "Email",
            disabled: isEditMode,
          },
          {
            name: "personalContact",
            label: "Personal Contact",
            type: "phone",
            required: true,
            icon: "Phone",
          },
          {
            name: "technology",
            label: "Technology",
            type: "text",
            required: true,
            icon: "Code",
          },
          {
            name: "experience",
            label: "Experience (years)",
            type: "number",
            required: true,
            icon: "Work",
          },
          {
            name: "location",
            label: "Location",
            type: "text",
            required: true,
            icon: "Place",
          },
          {
            name: "grade",
            label: "Grade",
            type: "text",
            icon: "Grade",
          },
          {
            name: "remoteOnsite",
            label: "Work Type",
            type: "select",
            required: true,
            options: [
              { label: "Remote", value: "REMOTE" },
              { label: "Onsite", value: "ONSITE" },
              { label: "Hybrid", value: "HYBRID" },
            ],
            icon: "LocationOn",
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
              { label: "On Hold", value: "ON_HOLD" },
              { label: "Placed", value: "PLACED" },
            ],
            icon: "Status",
          },
        ],
      },

      // Team & References
      {
        section: "Team & References",
        fields: [
          {
            name: "teamLeadId",
            label: "Team Lead",
            type: "select",
            // required: true,
            options: teamLeadOptions,
            icon: "SupervisorAccount",
            onChange: handleTeamLeadChange,
            searchable: true,
            placeholder: "Search team lead...",
          },
          {
            name: "recruiterId",
            label: "Recruiter",
            type: "select",
            // required: true,
            options: recruiterOptions,
            icon: "Person",
            searchable: true,
            placeholder: isEditMode && recruiterOptions.length === 0
              ? "Recruiter will load when team lead is selected"
              : "Search recruiter...",
          },
          {
            name: "salesExecutiveId",
            label: "Sales Executive",
            type: "select",
            options: salesExecutiveOptions,
            icon: "People",
            searchable: true,
            placeholder: isEditMode && salesExecutiveOptions.length === 0
              ? "Sales Executive will load when team lead is selected"
              : "Search sales executive...",
          },
          {
            name: "reference",
            label: "Reference",
            type: "text",
            icon: "Link",
          },
          {
            name: "marketingContact",
            label: "Marketing Contact",
            type: "phone",
            icon: "ContactPhone"
          },
           {
          name: "isAssignAll",
          label: "Assign to All",
          type: "checkbox",
          required: false,
          icon: "CheckBox",
          defaultChecked: false,
        },
          
        ],
      },

      // Additional Information
      {
        section: "Additional Information",
        fields: [
       {
          name: "passport",
          label: "Passport",
          type: "select",
          required: true,
          icon: "TravelExplore",
          options: [
            { label: "Yes", value: "Yes" },
            { label: "No", value: "No" },
          ],
        },
          {
            name: "originalDOB",
            label: "Date of Birth",
            type: "date",
            icon: "Cake",
          },
          {
            name: "editedDOB",
            label: "Edited DOB",
            type: "date",
            icon: "Cake",
          },
          {
            name: "linkedInUrl",
            label: "LinkedIn URL",
            type: "text",
            icon: "LinkedIn",
            required: true,
          },
          {
            name: "relocation",
            label: "Willing to Relocate",
            type: "select",
            options: [
              { label: "Yes", value: "YES" },
              { label: "No", value: "NO" },
              { label: "Maybe", value: "MAYBE" },
            ],
            icon: "MoveToInbox",
          },
          {
            name: "billRate",
            label: "Bill Rate",
            type: "text",
            icon: "AttachMoney",
          },
          {
            name: "payroll",
            label: "Payroll",
            type: "select",
            icon: "RequestQuote",
            options: [
              { label: "W2", value: "W2" },
              { label: "C2C", value: "C2C" },
              { label: "FULL-TIME", value: "FULL-TIME" },
              { label: "CONTRACT", value: "CONTRACT" },
              { label: "GUEST-HOUSE", value: "GUEST-HOUSE" },
            ],
          },
          {
            name: "marketingStartDate",
            label: "Marketing Start Date",
            type: "date",
            icon: "DateRange",
          },
          {
            name: "marketingVisa",
            label: "Marketing Visa",
            type: "select",
            required: true,
            searchable: true,
            placeholder: "Search visa...",
            icon: "VerifiedUser",
            options: [
              { value: "H1B", label: "H1B" },
              { value: "OPT", label: "OPT" },
              { value: "STEM_OPT", label: "STEM OPT" },
              { value: "OPT_EAD", label: "OPT EAD" },
              { value: "H4_EAD", label: "H4 EAD" },
              { value: "GC_EAD", label: "GC EAD" },
              { value: "CPT", label: "CPT" },
              { value: "GC", label: "Green Card" },
              { value: "Citizen", label: "Citizen" },
              { value: "Other", label: "Other" },
            ],
          },
          {
            name: "actualVisa",
            label: "Actual Visa",
            type: "select",
            required: true,
            icon: "Gavel",
            searchable: true,
            placeholder: "Search visa...",
            options: [
              { value: "H1B", label: "H1B" },
              { value: "OPT", label: "OPT" },
              { value: "STEM_OPT", label: "STEM OPT" },
              { value: "OPT_EAD", label: "OPT EAD" },
              { value: "H4_EAD", label: "H4 EAD" },
              { value: "GC_EAD", label: "GC EAD" },
              { value: "CPT", label: "CPT" },
              { value: "GC", label: "Green Card" },
              { value: "Citizen", label: "Citizen" },
              { value: "Other", label: "Other" },
            ],
          },
          // {
          //   name: "approvalStatus",
          //   label: "Approval Status",
          //   type: "select",
          //   options: [
          //     { label: "Pending", value: "PENDING" },
          //     { label: "Approved", value: "APPROVED" },
          //     { label: "Rejected", value: "REJECTED" },
          //   ],
          //   icon: "Approval",
          // },
          {
            name: "remarks",
            label: "Remarks",
            type: "textarea",
            icon: "Comment",
            rows: 2,
          },
        ],
      },

      // Documents Upload - Let Formik handle files directly
      {
        section: "Resume Upload",
        fields: [
          {
            name: "resumes",
            label: "Upload Resume(s)",
            type: "file",
            multiple: true,
            accept: ".pdf,.doc,.docx",
            icon: "AttachFile",
            required: !isEditMode,
            helperText: "Upload consultant's resume (PDF, DOC, DOCX)",
          },
          // {
          //   name: "documents",
          //   label: "Other Supporting Documents",
          //   type: "file",
          //   multiple: true,
          //   accept: ".pdf,.jpg,.jpeg,.png",
          //   icon: "Folder",
          //   helperText: "Additional documents like certificates, ID proofs, etc.",
          // },
        ],
      },
      {
       section:"Supporting Documents",
       fields:[
         {
            name: "documents",
            label: "Other Supporting Documents",
            type: "file",
            multiple: true,
            accept: ".pdf,.jpg,.jpeg,.png",
            icon: "Folder",
            helperText: "Additional documents like certificates, ID proofs, etc.",
          },
       ]
      },

      // RTR Details
      {
        section: "Right to Represent (RTR) Details",
        fields: [
          {
            name: "clientName",
            label: "Client Name",
            type: "select",
            required: true,
            options: clientOptions,
            icon: "BusinessCenter",
            helperText: "Select the client for RTR",
            searchable: true,
            placeholder: "Search client...",
          },
          {
            name: "ratePart",
            label: "Rate (per hour)",
            type: "text",
            required: true,
            icon: "AttachMoney",
            helperText: "Rate agreed with client",
          },
          {
            name: "vendorName",
            label: "Vendor Name",
            type: "text",
            required: true,
            icon: "Person",
          },
          {
            name: "vendorEmailId",
            label: "Vendor Email ID",
            type: "email",
            required: true,
            icon: "Email",
          },
          {
            name: "vendorMobileNumber",
            label: "Vendor Mobile Number",
            type: "phone",
            required: true,
            icon: "Phone",
          },
          {
            name: "vendorCompany",
            label: "Vendor Company",
            type: "text",
            required: true,
            icon: "Apartment",
          },
          {
            name: "vendorLinkedIn",
            label: "Vendor LinkedIn Profile",
            type: "text",
            icon: "LinkedIn",
            helperText: "Optional vendor LinkedIn URL",
          },
          {
            name: "implementationPartner",
            label: "Implementation Partner",
            type: "text",
            icon: "People",
            helperText: "If applicable",
          },
          {
            name: "comments",
            label: "RTR Comments / Notes",
            type: "textarea",
            icon: "Notes",
            rows: 3,
            helperText: "Any additional notes for this RTR",
          },
        ],
      },
    ];
  }, [
    isEditMode,
    employees,
    effectiveRecruiters,
    effectiveSalesExecutives,
    clients,
    handleTeamLeadChange,
  ]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Loading form data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* <Typography variant="h4" gutterBottom>
        {isEditMode ? "Edit RTR with Consultant" : "Create New RTR with Consultant"}
      </Typography> */}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Show existing documents in edit mode */}
      {isEditMode && consultantData?.consultantId && (
        <Box mb={3}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Typography variant="h6" color="primary">
              📄 Existing Documents & Resumes
            </Typography>
            <Button
              size="small"
              onClick={() => setShowDocuments(!showDocuments)}
              variant="outlined"
            >
              {showDocuments ? "Hide" : "Show"} Documents
            </Button>
          </Stack>

          <Collapse in={showDocuments}>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Review and manage uploaded documents for this consultant:
              </Typography>

              <SimpleDocumentsDisplay
                consultantId={consultantData.consultantId}
              />
            </Box>
          </Collapse>
        </Box>
      )}

      <DynamicFormUltra
        ref={formikRef}
        config={formConfig}
        initialValues={formInitialValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitButtonText={isSubmitting ? "Creating RTR..." : "Create RTR"}
        cancelButtonText="Cancel"
        isSubmitting={isSubmitting}
        showCancelButton={true}
        gridSpacing={2}
        title="Create RTR Form"
        gridColumns={{ xs: 12, sm: 6, md: 4 }}
        enableReinitialize={true}
      />
    </Box>
  );
};

export default CreateRTR;