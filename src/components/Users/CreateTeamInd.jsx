import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import DynamicFormUltra from "../FormContainer/DynamicFormUltra";

export default function TeamForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { teamId } = useParams();
  const location = useLocation();
  const teamData = location.state?.teamData;

  const { userId } = useSelector((state) => state.auth);
  const isEditMode = !!teamId;

  const [users, setUsers] = useState({
    superAdmins: [],
    teamLeads: [],
    employees: [],
    bdms: [],
    coordinators: [],
  });
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({
    teamName: "",
    superAdmin: "",
    teamLead: "", // Single team lead (for backward compatibility if needed)
    teamleads: [], // Multiple team leads
    employees: [],
    bdms: [],
    coordinators: [],
  });

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("https://mymulya.com/users/employee");
        const users = response.data;

        const customTeamLead = {
          userName: "KolanupakaRaghava",
          employeeId: "ADRTIN025",
          roles: "TEAMLEAD",
          designation: "BDM & TL",
        };

        const categorized = {
          superAdmins: users.filter((u) => u.roles === "SUPERADMIN"),
          teamLeads: [
            ...users.filter((u) => u.roles === "TEAMLEAD" || u.roles === "BDM"),
            customTeamLead,
          ],
          employees: users.filter((u) => u.roles === "EMPLOYEE"),
          bdms: users.filter((u) => u.roles === "BDM"),
          coordinators: users.filter((u) => u.roles === "COORDINATOR"),
        };

        setUsers(categorized);

        if (isEditMode && teamData) {
          setInitialValues({
            teamName: teamData.teamName || "",
            superAdmin: teamData.superAdminId || "",
            teamLead: teamData.teamLeadId || "", // Single team lead
            teamleads: teamData.teamleads || [], // Multiple team leads
            employees:
              teamData.employees?.map((e) => e.employeeId || e.userId) || [],
            bdms: teamData.bdms?.map((b) => b.employeeId || b.userId) || [],
            coordinators:
              teamData.coordinators?.map((c) => c.employeeId || c.userId) || [],
          });
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        showErrorToast("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isEditMode, teamData]);

  // Form config
  const formConfig = [
    {
      section: "Team Information",
      fields: [
        {
          name: "teamName",
          label: "Team Name",
          type: "text",
          required: true,
          placeholder: "Enter team name",
          icon: "Groups",
        },
      ],
    },
    {
      section: "Team Leadership",
      fields: [
        {
          name: "superAdmin",
          label: "Super Admin",
          type: "select",
          options: users.superAdmins.map((user) => ({
            value: user.employeeId,
            label: user.userName,
          })),
          helperText: "Select super admin for the team",
          icon: "AdminPanelSettings",
        },
        {
          name: "teamLead",
          label: "Primary Team Lead",
          type: "select",
          required: true,
          options: users.teamLeads.map((user) => ({
            value: user.employeeId,
            label: `${user.userName} - ${user.designation}`,
          })),
          helperText: "Select primary team lead for the team",
          icon: "SupervisorAccount",
        },
        {
          name: "teamleads",
          label: "Additional Team Leads",
          type: "multiselect",
          options: users.teamLeads.map((user) => ({
            value: user.employeeId,
            label: `${user.userName} - ${user.designation}`,
          })),
          helperText: "Select additional team leads (optional)",
          icon: "GroupAdd",
        },
      ],
    },
    {
      section: "Team Members",
      fields: [
        {
          name: "employees",
          label: "Employees",
          type: "multiselect",
          options: users.employees.map((user) => ({
            value: user.employeeId,
            label: user.userName,
          })),
          helperText: "Select employees for the team",
          icon: "People",
        },
        {
          name: "bdms",
          label: "BDMs",
          type: "multiselect",
          options: users.bdms.map((user) => ({
            value: user.employeeId,
            label: user.userName,
          })),
          helperText: "Select Business Development Managers",
          icon: "BusinessCenter",
        },
        {
          name: "coordinators",
          label: "Coordinators",
          type: "multiselect",
          options: users.coordinators.map((user) => ({
            value: user.employeeId,
            label: user.userName,
          })),
          helperText: "Select coordinators for the team",
          icon: "EventAvailable",
        },
      ],
    },
  ];

  // Submit handler
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Prepare payload according to the expected format
      const payload = {
        teamName: values.teamName,
        superAdmin: values.superAdmin,
        teamLead: values.teamLead, // Primary team lead
        teamLeads: values.teamleads || [], // Additional team leads
        employees: values.employees || [],
        bdms: values.bdms || [],
        coordinators: values.coordinators || [],
      };

      console.log("Submitting payload:", payload);

      const response = await axios.post(
        `https://mymulya.com/users/assignTeamLead/${userId}`,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        showSuccessToast(
          `Team ${isEditMode ? "updated" : "created"} successfully!`
        );
        if (!isEditMode) resetForm();
        navigate("/dashboard/ind-team");
      } else {
        showErrorToast(
          response.data?.message ||
            `Failed to ${isEditMode ? "update" : "create"} team`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} team:`,
        error
      );
      showErrorToast(
        error.response?.data?.message ||
          error.message ||
          `Failed to ${isEditMode ? "update" : "create"} team`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/dashboard/ind-team");

  const validateForm = (values) => {
    const errors = {};
    
    if (!values.teamName?.trim()) {
      errors.teamName = "Team name is required";
    }
    
    if (!values.superAdmin) {
      errors.superAdmin = "Super admin is required";
    }
    
    if (!values.teamLead) {
      errors.teamLead = "Primary team lead is required";
    }
    
    // Ensure primary team lead is not duplicated in additional team leads
    if (values.teamleads && values.teamleads.includes(values.teamLead)) {
      errors.teamleads = "Primary team lead cannot be in additional team leads";
    }

    return errors;
  };

  return (
    <DynamicFormUltra
      config={formConfig}
      onSubmit={handleSubmit}
      title={isEditMode ? "Edit Team" : "Create New Team"}
      initialValues={initialValues}
      onCancel={handleCancel}
      submitButtonText={isEditMode ? "Update Team" : "Create Team"}
      validate={validateForm}
      loading={loading}
    />
  );
}