import React, { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import httpService from '../../Services/httpService';
import DataTable from '../muiComponents/DataTabel';
import { generateTeamColumns } from './columnUtils';

const transformTeam = (team) => ({
    teamId: team.teamLeadId,
    teamName: team.teamName || 'Unnamed Team',
    teamLeadId: team.teamLeadId,
    teamLeadName: team.teamLeadName,
    employeeCount: (team.employees || []).length,
    bdmCount: (team.bdms || []).length,
    teamLeadCount: (team.teamLeads || []).length,
    coordinatorCount: (team.coordinators || []).length,
    memberCount:
        (team.employees || []).length +
        (team.bdms || []).length +
        (team.teamLeads || []).length +
        (team.coordinators || []).length,
    _raw: team, // Pass the entire team data
});

const TeamList = ({ startDate, endDate }) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const loadTeams = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await httpService.get('/users/AllAssociatedUsers?entity=IN');
            const raw = Array.isArray(response.data) ? response.data : [];
            
            const filteredRaw = raw.filter((team) =>
                (team.employees && team.employees.length > 0) ||
                (team.coordinators && team.coordinators.length > 0) ||
                (team.bdms && team.bdms.length > 0) ||
                (team.teamLeads && team.teamLeads.length > 0)
            );
            
            setTeams(filteredRaw.map(transformTeam));
        } catch (err) {
            console.error('Error fetching teams:', err);
            setError('Failed to load teams. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        loadTeams();
    }, [loadTeams]);

    const handleTeamClick = useCallback((teamId) => {
        if (!teamId) return;
        const team = teams.find((t) => t.teamId === teamId);
        
        // Pass the raw team data through state
        navigate(`/dashboard/team-metrics/teamstatus/${teamId}`, {
            state: { teamData: team?._raw }
        });
    }, [teams, navigate]);

    const columns = generateTeamColumns(handleTeamClick, loading);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body1" color="error">{error}</Typography>
            </Box>
        );
    }

    if (!teams || teams.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body1" color="text.secondary">No teams found.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
            <DataTable
                data={teams}
                columns={columns}
                title="Teams"
                loading={loading}
                enableSelection={false}
                defaultSortColumn="teamName"
                defaultSortDirection="asc"
                defaultRowsPerPage={10}
                primaryColor="#1976d2"
                secondaryColor="#e0f2f1"
                customStyles={{
                    headerBackground: '#1976d2',
                    rowHover: '#e0f2f1',
                    selectedRow: '#b2dfdb',
                }}
                uniqueId="teamId"
            />
        </Box>
    );
};

export default TeamList;