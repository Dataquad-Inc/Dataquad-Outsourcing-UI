import React, { useEffect, useState } from "react";

import { Box, CircularProgress } from "@mui/material";

import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { hotlistAPI } from "../../utils/api";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";

const getTeamFormSections = (employees) => {
  return [
    {
      fields: [
        {
          name: "teamName",
          label: "Team Name",
          type: "text",
          required: true,
          icon: "title",
        },

        {
          name: "teamLead",
          label: "Select Teamlead",
          type: "select",
          required: true,
          icon: "group",
          options: employees.TEAMLEAD.map((emp) => ({
            value: emp.employeeId,
            label: emp.employeeName,
          })),
        },

        {
          name: "salesExecutives",
          label: "Select Sales Executives",
          type: "multiselect",
          required: false,
          icon: "people",
          options: employees.SALESEXECUTIVE.map((emp) => ({
            label: emp.employeeName,
            value: emp.employeeId,
          })),
        },

        {
          name: "recruiters",
          label: "Select Recruiters",
          type: "multiselect",
          required: false,
          icon: "people",
          options: employees.RECRUITER.map((emp) => ({
            label: emp.employeeName,
            value: emp.employeeId,
          })),
        },
        {
          name: "coordinators",
          label: "Select Coordinators",
          type: "multiselect",
          required: false,
          icon: "people",
          options: employees.COORDINATOR.map((emp) => ({
            label: emp.employeeName,
            value: emp.employeeId,
          })),
        },
      ],
    },
  ];
};

const CreateTeam = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userId, userName } = useSelector((state) => state.auth);

  const [employees, setEmployees] = useState({
    SUPERADMIN: [],
    TEAMLEAD: [],
    RECRUITER: [],
    SALESEXECUTIVE: [],
    COORDINATOR: [],
  });

  const formInitialValues = {
    teamName: "",
    superAdmin: userId,
    teamLead: "",
    recruiters: [],
    salesExecutives: [],
    coordinators: [],
  };

  const handleCancel = () => {
    console.log("Form cancelled");
  };

  // ✅ Prefer shared httpService (cookies + local proxy)
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const { data } = await httpService.post(
        `/users/assignTeamLead/${userId}`,
        values
      );
      ToastService.success(data?.message || "Team created successfully");
      navigate("/dashboard/us-employees/teamlist");
    } catch (err) {
      console.error("Error creating team:", err);
      ToastService.error(err.response?.data?.message || "Error creating team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchEmployeesByRole = async (role) => {
    try {
      const response = await hotlistAPI.getUsersByRole(role);
      return response || [];
    } catch (error) {
      console.error(`Error fetching ${role} employees:`, error);
      return [];
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const [superadmins, teamleads, recruiters, salesexecutives, coordinators] =
        await Promise.all([
          fetchEmployeesByRole("SUPERADMIN"),
          fetchEmployeesByRole("TEAMLEAD"),
          fetchEmployeesByRole("RECRUITER"),
          fetchEmployeesByRole("SALESEXECUTIVE"),
          fetchEmployeesByRole("COORDINATOR"),
        ]);

      const transformed = {
        SUPERADMIN: superadmins,
        TEAMLEAD: teamleads,
        RECRUITER: recruiters,
        SALESEXECUTIVE: salesexecutives,
        COORDINATOR: coordinators,
      };

      setEmployees(transformed);
    } catch (err) {
      console.error("Error fetching employees", err);
      ToastService.error("Failed to load employees for team form");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DynamicFormUltra
      config={getTeamFormSections(employees)}
      onSubmit={handleSubmit}
      title="Create New Team"
      initialValues={formInitialValues}
      onCancel={handleCancel}
      submitButtonText="Create Team"
      enableReinitialize
      isSubmitting={isSubmitting}
      showCancelButton
    />
  );
};

export default CreateTeam;
