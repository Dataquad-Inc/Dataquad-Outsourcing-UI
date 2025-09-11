import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { hotlistAPI } from "../../utils/api";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

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

const EditTeam = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useSelector((state) => state.auth);

  // Get team data from location state (passed when navigating from TeamList)
  const team = location.state?.team;

  const [employees, setEmployees] = useState({
    SUPERADMIN: [],
    TEAMLEAD: [],
    RECRUITER: [],
    SALESEXECUTIVE: [],
  });

  // Find employee ID by name
  const findEmployeeIdByName = (employees, name, role) => {
    const employee = employees[role]?.find(emp => emp.employeeName === name);
    return employee ? employee.employeeId : "";
  };

  // Find employee IDs by names
  const findEmployeeIdsByNames = (employees, names, role) => {
    return names.map(name => {
      const employee = employees[role]?.find(emp => emp.employeeName === name);
      return employee ? employee.employeeId : null;
    }).filter(id => id !== null);
  };

  // Transform team data to form initial values
  const getInitialValues = () => {
    if (!team) return {};
    
    return {
      teamName: team.teamName || "",
      superAdmin: userId,
      teamLead: findEmployeeIdByName(employees, team.teamLeadName, "TEAMLEAD") || "",
      recruiters: findEmployeeIdsByNames(employees, 
        team.recruiters?.map(rec => rec.userName) || [], "RECRUITER"),
      salesExecutives: findEmployeeIdsByNames(employees, 
        team.salesExecutives?.map(exec => exec.userName) || [], "SALESEXECUTIVE"),
    };
  };

  const handleCancel = () => {
    navigate("/dashboard/us-employees/teamlist");
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // Use the same POST endpoint for both create and edit
      const { data } = await axios.post(
        `https://mymulya.com/users/assignTeamLead/${userId}`,
        values
      );
      console.log("Team updated successfully:", data);
      navigate("/dashboard/us-employees/teamlist");
    } catch (err) {
      console.error("Error updating team:", err);
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
    try {
      const superadmins = await fetchEmployeesByRole("SUPERADMIN");
      const teamleads = await fetchEmployeesByRole("TEAMLEAD");
      const recruiters = await fetchEmployeesByRole("RECRUITER");
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
      title="Edit Team"
      initialValues={getInitialValues()}
      onCancel={handleCancel}
      submitButtonText="Update Team"
      enableReinitialize
      isSubmitting={isSubmitting}
      showCancelButton
    />
  );
};

export default EditTeam;