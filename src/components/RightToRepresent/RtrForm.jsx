import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { usClientsAPI, rightToRepresentAPI } from "../../utils/api";

const RtrForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useSelector((state) => state.auth);

  // Get consultant data from route state
  const consultantId = location.state?.consultantId || "";
  const consultantName = location.state?.consultantName || "";

  // Local state for client data
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  // Fetch client list
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await usClientsAPI.getAllClients();
      setClients(response.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      showErrorToast("Failed to fetch clients");
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Handle client selection change
  const handleClientChange = (clientName) => {
    const selectedClient = clients.find(
      (client) => client.clientName === clientName
    );
    if (selectedClient) {
      setSelectedClientId(selectedClient.clientId);
    } else {
      setSelectedClientId("");
    }
  };

  // Client dropdown options
  const clientOptions = clients.map((client) => ({
    label: client.clientName,
    value: client.clientName,
  }));

  // Default initial values - include consultant data
  const defaultInitialValues = {
    consultantId: consultantId,
    consultantName: consultantName,
    userId: userId || "",
    clientId: "",
    clientName: "",
    ratePart: "",
    vendorName: "",
    vendorEmailId: "",
    vendorMobileNumber: "",
    vendorCompany: "",
    vendorLinkedIn: "",
    implementationPartner: "",
    comments: "",
  };

  // Form Configuration
  const formConfig = [
    {
      section: "RTR Details",
      fields: [
        {
          name: "consultantName",
          label: "Consultant Name",
          type: "text",
          required: true,
          icon: "Person",
          disabled: true,
          helperText: "Consultant from hotlist",
        },
        {
          name: "clientName",
          label: "Client Name",
          type: "select",
          required: true,
          options: clientOptions,
          icon: "BusinessCenter",
          loading: loadingClients,
          helperText: "Select the client name",
          onChange: handleClientChange, // Add onChange handler
        },
        {
          name: "ratePart",
          label: "Rate (per hour)",
          type: "text",
          required: true,
          icon: "AttachMoney",
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
          type: "link",
          icon: "LinkedIn",
          required: true,
          helperText: "paste LinkedIn profile URL",
        },
        {
          name: "implementationPartner",
          label: "Implementation Partner",
          type: "text",
          icon: "People",
        },
        {
          name: "comments",
          label: "Comments / Notes",
          type: "textarea",
          helperText: "Add any additional remarks here",
        },
      ],
    },
  ];

  // Form Validation
  const validateForm = (values) => {
    const errors = {};
    if (!values.consultantName)
      errors.consultantName = "Consultant name is required";
    if (!values.clientName) errors.clientName = "Client name is required";
    if (!values.ratePart) errors.ratePart = "Rate is required";
    if (!values.vendorName) errors.vendorName = "Vendor name is required";
    if (!values.vendorEmailId)
      errors.vendorEmailId = "Vendor email is required";
    if (!values.vendorMobileNumber)
      errors.vendorMobileNumber = "Vendor mobile number is required";
    if (!values.vendorCompany)
      errors.vendorCompany = "Vendor company is required";
    return errors;
  };

  // Handle Form Submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = {
        consultantId: values.consultantId || consultantId,
        consultantName: values.consultantName || consultantName,
        userId: values.userId || userId,
        clientId: selectedClientId, // Use the selected client ID
        clientName: values.clientName,
        ratePart: values.ratePart,
        vendorName: values.vendorName,
        vendorEmailId: values.vendorEmailId,
        vendorMobileNumber: values.vendorMobileNumber,
        vendorCompany: values.vendorCompany,
        vendorLinkedIn: values.vendorLinkedIn,
        implementationPartner: values.implementationPartner,
        comments: values.comments,
      };

      // Use the rightToRepresentAPI
      const response = await rightToRepresentAPI.submitRTR(userId, payload);

      if (response.data?.success || response.success) {
        showSuccessToast("RTR submitted successfully!");
        resetForm();
        navigate("/dashboard/rtr/rtr-list");
      } else {
        showErrorToast(
          response.data?.message || response.message || "Failed to submit RTR"
        );
      }
    } catch (error) {
      console.error("Error submitting RTR:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Something went wrong while submitting RTR"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/dashboard/rtr/rtr-list");

  return (
    <DynamicFormUltra
      config={formConfig}
      title="Create RTR Form"
      initialValues={defaultInitialValues}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitButtonText="Submit RTR"
      validate={validateForm}
    />
  );
};

export default RtrForm;
