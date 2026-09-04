import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { hotlistAPI } from "../../utils/api";
import { useSelector } from "react-redux";
import { useNavigate, useLocation, useParams } from "react-router-dom";
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
          options: (employees.TEAMLEAD || []).map((emp) => ({
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
          options: (employees.SALESEXECUTIVE || []).map((emp) => ({
            value: emp.employeeId,
            label: emp.employeeName,
          })),
        },
        {
          name: "recruiters",
          label: "Select Recruiters",
          type: "multiselect",
          required: false,
          icon: "people",
          options: (employees.RECRUITER || []).map((emp) => ({
            value: emp.employeeId,
            label: emp.employeeName,
          })),
        },
        {
          name: "coordinators",
          label: "Select Coordinators",
          type: "multiselect",
          required: false,
          icon: "people",
          options: (employees.COORDINATOR || []).map((emp) => ({
            value: emp.employeeId,
            label: emp.employeeName,
          })),
        },
      ],
    },
  ];
};

const EditTeam = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { userId } = useSelector((state) => state.auth);

  const [employees, setEmployees] = useState({
    SUPERADMIN: [],
    TEAMLEAD: [],
    RECRUITER: [],
    SALESEXECUTIVE: [],
    COORDINATOR: [],
  });

  const findEmployeeIdByName = (emps, name, role) => {
    const employee = emps[role]?.find((emp) => emp.employeeName === name);
    return employee ? employee.employeeId : "";
  };

  const findEmployeeIdsByNames = (emps, names, role) => {
    return (names || [])
      .map((name) => {
        const employee = emps[role]?.find((emp) => emp.employeeName === name);
        return employee ? employee.employeeId : null;
      })
      .filter((id) => id !== null);
  };

  const getInitialValues = () => {
    if (!teamData) return { superAdmin: userId };

    return {
      teamName: teamData.teamName || "",
      superAdmin: userId,
      teamLead:
        teamData.teamLeadId ||
        findEmployeeIdByName(employees, teamData.teamLeadName, "TEAMLEAD") ||
        "",
      recruiters:
        teamData.recruiterIds ||
        findEmployeeIdsByNames(
          employees,
          teamData.recruiters?.map((rec) => rec.userName) || [],
          "RECRUITER"
        ),
      salesExecutives:
        teamData.salesExecutiveIds ||
        findEmployeeIdsByNames(
          employees,
          teamData.salesExecutives?.map((exec) => exec.userName) || [],
          "SALESEXECUTIVE"
        ),
      coordinators:
        teamData.coordinatorIds ||
        findEmployeeIdsByNames(
          employees,
          teamData.coordinators?.map((coord) => coord.userName) || [],
          "COORDINATOR"
        ),
    };
  };

  const handleCancel = () => {
    navigate("/dashboard/us-employees/teamlist");
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await httpService.post(`/users/assignTeamLead/${userId}`, values);
      ToastService.success("Team updated successfully");
      navigate("/dashboard/us-employees/teamlist");
    } catch (err) {
      console.error("Error updating team:", err);
      ToastService.error(err.response?.data?.message || "Error updating team");
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

  const normalizeTeamPayload = (raw, fallback) => {
    if (!raw && !fallback) return null;
    const source = raw || fallback;
    const teamLeadId =
      source.teamLeadId ||
      source.teamLead ||
      fallback?.teamLeadId ||
      "";
    return {
      teamName: source.teamName || fallback?.teamName || "",
      teamLeadId,
      teamLeadName: source.teamLeadName || fallback?.teamLeadName || "",
      recruiters: source.recruiters || fallback?.recruiters || [],
      salesExecutives: source.salesExecutives || fallback?.salesExecutives || [],
      coordinators: source.coordinators || fallback?.coordinators || [],
      recruiterIds: (source.recruiters || fallback?.recruiters || [])
        .map((r) => r.userId || r.employeeId || r)
        .filter(Boolean),
      salesExecutiveIds: (source.salesExecutives || fallback?.salesExecutives || [])
        .map((r) => r.userId || r.employeeId || r)
        .filter(Boolean),
      coordinatorIds: (source.coordinators || fallback?.coordinators || [])
        .map((r) => r.userId || r.employeeId || r)
        .filter(Boolean),
    };
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [superadmins, teamleads, recruiters, salesexecutives, coordinators] =
          await Promise.all([
            fetchEmployeesByRole("SUPERADMIN"),
            fetchEmployeesByRole("TEAMLEAD"),
            fetchEmployeesByRole("RECRUITER"),
            fetchEmployeesByRole("SALESEXECUTIVE"),
            fetchEmployeesByRole("COORDINATOR"),
          ]);

        setEmployees({
          SUPERADMIN: superadmins,
          TEAMLEAD: teamleads,
          RECRUITER: recruiters,
          SALESEXECUTIVE: salesexecutives,
          COORDINATOR: coordinators,
        });

        const stateTeam = location.state?.team;
        const teamLeadId =
          params.teamLeadId ||
          stateTeam?.teamLeadId ||
          stateTeam?.teamLead ||
          null;

        if (teamLeadId) {
          try {
            const response = await httpService.get(
              `/users/associated-users/${teamLeadId}`
            );
            const payload = response.data?.data || response.data;
            setTeamData(normalizeTeamPayload(payload, stateTeam));
          } catch (err) {
            if (stateTeam) {
              setTeamData(normalizeTeamPayload(null, stateTeam));
            } else {
              throw err;
            }
          }
        } else if (stateTeam) {
          setTeamData(normalizeTeamPayload(null, stateTeam));
        } else {
          setLoadError("Team data is missing. Open Edit from the team list.");
        }
      } catch (err) {
        console.error("Error loading edit team:", err);
        setLoadError(err.response?.data?.message || "Failed to load team");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [location.state, params.teamLeadId]);

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

  if (loadError) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
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
