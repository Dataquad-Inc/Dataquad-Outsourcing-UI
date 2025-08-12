import React, { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees } from "../../redux/employeesSlice";

const UsEmployees = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { employeesList, loading } = useSelector((state) => state.employee);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleEdit = (row) => {
    console.log("Edit employee:", row);
  };

  const handleDelete = (row) => {
    console.log("Delete employee:", row);
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        mt: 3,
        maxHeight: "70vh",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          p: 2,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        US Team Management
      </Typography>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: theme.palette.grey[200],
              }}
            >
              Employee ID
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: theme.palette.grey[200],
              }}
            >
              Name
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: theme.palette.grey[200],
              }}
            >
              Role
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: theme.palette.grey[200],
              }}
            >
              Email
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: theme.palette.grey[200],
              }}
            >
              Designation
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: theme.palette.grey[200],
              }}
            >
              Phone Number
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: theme.palette.grey[200],
              }}
            >
              Status
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                backgroundColor: theme.palette.grey[200],
              }}
              align="center"
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            employeesList.map((emp, index) => (
              <TableRow
                key={index}
                sx={{
                  backgroundColor:
                    index % 2 === 0
                      ? theme.palette.background.default
                      : theme.palette.action.hover,
                  "&:hover": {
                    backgroundColor: theme.palette.action.selected,
                  },
                }}
              >
                <TableCell>{emp.employeeId}</TableCell>
                <TableCell>{emp.userName}</TableCell>
                <TableCell>{emp.roles}</TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>{emp.designation}</TableCell>
                <TableCell>{emp.phoneNumber}</TableCell>
                <TableCell
                  sx={{
                    color:
                      emp.status === "ACTIVE"
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                    fontWeight: "bold",
                  }}
                >
                  {emp.status}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(emp)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(emp)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UsEmployees;
