import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { usClientsAPI, rightToRepresentAPI } from "../../utils/api";
import { LoadingSpinner } from "../../ui-lib/LoadingSpinner";

const EditRtrForm = () => {
  const navigate = useNavigate();
  const { rtrId } = useParams(); // Get rtrId from URL params
  const { userId } = useSelector((state) => state.auth);

  // Local state for client data and initial data
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Fetch existing RTR data
  const fetchRTRData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://mymulya.com/hotlist/rtr-id/${rtrId}`
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        // Transform the API data to match form structure
        const formData = {
          rtrId: data.rtrId || "",
          consultantId: data.consultantId || "",
          consultantName: data.consultantName || "",
          userId: data.userId || userId,
          clientId: data.clientId || "",
          clientName: data.clientName || "",
          ratePart: data.ratePart || "",
          vendorName: data.vendorName || "",
          vendorEmailId: data.vendorEmailId || "",
          vendorMobileNumber: data.vendorMobileNumber || "",
          vendorCompany: data.vendorCompany || "",
          vendorLinkedIn: data.vendorLinkedIn || "",
          implementationPartner: data.implementationPartner || "",
          comments: data.comments || "",
        };

        console.log("Loaded RTR data:", formData);
        setInitialData(formData);
      } else {
        showErrorToast("Failed to load RTR data");
        navigate("/dashboard/rtr/rtr-list");
      }
    } catch (error) {
      console.error("Error fetching RTR:", error);
      showErrorToast("Failed to load RTR data");
      navigate("/dashboard/rtr/rtr-list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (rtrId) {
      fetchRTRData();
    }
  }, [rtrId]);

  // Client dropdown options
  const clientOptions = clients.map((client) => ({
    label: client.clientName,
    value: client.clientId ,
  }));

  // Form Configuration
  const formConfig = [
    {
      section: "RTR Details",
      fields: [
        {
          name: "rtrId",
          label: "RTR ID",
          type: "text",
          required: true,
          icon: "Badge",
          disabled: true,
          helperText: "RTR identification number",
        },
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
          type: "text",
          icon: "LinkedIn",
          helperText: "Optional — paste LinkedIn profile URL",
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
        rtrId: values.rtrId,
        consultantId: values.consultantId,
        consultantName: values.consultantName,
        userId: values.userId || userId,
        clientId: values.clientId || "",
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

      // Update RTR using the API
      const response = await rightToRepresentAPI.updateRTR(
        rtrId,
        userId,
        payload
      );

      if (response.data?.success || response.success) {
        showSuccessToast("RTR updated successfully!");
        navigate("/dashboard/rtr/rtr-list");
      } else {
        showErrorToast(
          response.data?.message || response.message || "Failed to update RTR"
        );
      }
    } catch (error) {
      console.error("Error updating RTR:", error);
      showErrorToast(
        error.response?.data?.message ||
          "Something went wrong while updating RTR"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/dashboard/rtr/rtr-list");

  if (loading || loadingClients) {
    return <LoadingSpinner />;
  }

  return (
    <DynamicFormUltra
      config={formConfig}
      title="Edit RTR Form"
      initialValues={initialData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitButtonText="Update RTR"
      validate={validateForm}
    />
  );
};

export default EditRtrForm;
