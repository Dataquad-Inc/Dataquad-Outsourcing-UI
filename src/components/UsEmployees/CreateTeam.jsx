import React, { useEffect, useState } from "react";

import { Box, CircularProgress } from "@mui/material";

import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { teamAPI, hotlistAPI } from "../../utils/api"; // already importing axios API instance
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { read } from "xlsx";

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
  });

  const formInitialValues = {
    teamName: "",
    superAdmin: userId,
    teamLead: "",
    recruiters: [],
    salesExecutives: [],
  };

  const handleCancel = () => {
    console.log("Form cancelled");
  };

  // ✅ Axios instead of fetch
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // const response = await teamAPI.createTeam(userId, values);
      const { data } = await axios.post(
        `https://mymulya.com/users/assignTeamLead/${userId}`, // URL
        values // request body
      );
      console.log("Team created successfully:", data);
      navigate("/dashboard/us-employees/teamlist");
    } catch (err) {
      console.error("Error creating team:", err);
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

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const superadmins = await fetchEmployeesByRole("SUPERADMIN");
      await delay(1000);

      const teamleads = await fetchEmployeesByRole("TEAMLEAD");
      await delay(1000);

      const recruiters = await fetchEmployeesByRole("RECRUITER");
      await delay(1000);

      const salesexecutives = await fetchEmployeesByRole("SALESEXECUTIVE");

      const transformed = {
        SUPERADMIN: superadmins,
        TEAMLEAD: teamleads,
        RECRUITER: recruiters,
        SALESEXECUTIVE: salesexecutives,
      };

      console.log("Fetched employees by role:", transformed);
      setEmployees(transformed);
    } catch (err) {
      console.error("Error fetching employees", err);
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
