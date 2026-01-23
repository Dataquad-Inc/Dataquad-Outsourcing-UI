import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  CircularProgress,
  TextField,
  Grid,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useFormik } from "formik";
import httpService from "../../Services/httpService";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { Check } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import ToastService from "../../Services/toastService";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

const ScheduleInterviewForm = ({ data, onClose, onSuccess, refreshData }) => {
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { userId, email } = useSelector((state) => state.auth);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [interviewResponse, setInterviewResponse] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateAvailability, setDateAvailability] = useState({});
  const [clientEmails, setClientEmails] = useState([]);
  const [newClientEmail, setNewClientEmail] = useState("");

  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const res = await httpService.get(
          "/users/employee?excludeRoleName=EMPLOYEE"
        );
        const formatted = res.data.map((emp) => ({
          value: emp.employeeId,
          label: emp.userName,
        }));
        setCoordinators(formatted);
      } catch (err) {
        console.error("Failed to fetch coordinators", err);
      }
    };
    fetchCoordinators();
  }, []);

  const fetchBookedSlots = async (coordinatorId) => {
    if (!coordinatorId) return;

    setLoadingSlots(true);
    try {
      const res = await httpService.get(
        `/candidate/interviewSlots/${coordinatorId}`
      );
      const slots = res.data?.bookedSlots || [];
      setBookedSlots(slots);

      const availabilityMap = {};
      slots.forEach((slot) => {
        if (slot.interviewDateTime) {
          const date = dayjs(slot.interviewDateTime).format("YYYY-MM-DD");
          if (!availabilityMap[date]) {
            availabilityMap[date] = [];
          }
          availabilityMap[date].push({
            start: dayjs(slot.interviewDateTime),
            end: dayjs(slot.interviewDateTime).add(
              slot.duration || 30,
              "minutes"
            ),
          });
        }
      });

      setDateAvailability(availabilityMap);
    } catch (err) {
      console.error("Failed to fetch booked slots", err);
      setBookedSlots([]);
      setDateAvailability({});
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (data && !hasInitialLoad) {
      if (data?.assignedTo || data?.coordinator) {
        if (coordinators.length > 0) {
          const initialCoordinator =
            data?.assignedTo || data?.coordinator || "";
          setSelectedCoordinator(initialCoordinator);
          fetchBookedSlots(initialCoordinator);
          setHasInitialLoad(true);
        }
      } else {
        setHasInitialLoad(true);
      }

      if (data?.clientEmail && Array.isArray(data.clientEmail)) {
        setClientEmails(data.clientEmail);
      }
    }
  }, [data, coordinators, hasInitialLoad]);

  useEffect(() => {
    if (selectedCoordinator) {
      fetchBookedSlots(selectedCoordinator);
    } else {
      setBookedSlots([]);
      setDateAvailability({});
    }
  }, [selectedCoordinator]);

  const safeDayjs = (date) => {
    if (date === null || date === undefined) return null;
    if (dayjs.isDayjs(date)) return date;
    const d = dayjs(date);
    return d.isValid() ? d : null;
  };

  const isSlotAvailable = useCallback(
    (time, duration) => {
      const timeObj = safeDayjs(time);
      if (!timeObj || !selectedCoordinator) return true;

      const dateKey = timeObj.format("YYYY-MM-DD");
      const slotsForDate = dateAvailability[dateKey] || [];
      const selectedStart = timeObj;
      const selectedEnd = selectedStart.add(duration, "minutes");

      if (data?.interviewDateTime) {
        const originalStart = safeDayjs(data.interviewDateTime);
        if (originalStart && selectedStart.isSame(originalStart)) {
          return true;
        }
      }

      return !slotsForDate.some((slot) => {
        const slotStart = safeDayjs(slot.start);
        const slotEnd = safeDayjs(slot.end);

        if (!slotStart || !slotEnd) return false;

        return (
          (selectedStart.isAfter(slotStart) &&
            selectedStart.isBefore(slotEnd)) ||
          (selectedEnd.isAfter(slotStart) && selectedEnd.isBefore(slotEnd)) ||
          selectedStart.isSame(slotStart) ||
          (selectedStart.isBefore(slotStart) && selectedEnd.isAfter(slotEnd))
        );
      });
    },
    [selectedCoordinator, dateAvailability, data?.interviewDateTime]
  );

  const hasAvailableSlots = useCallback(
    (date, duration = 30) => {
      const dateObj = safeDayjs(date);
      if (!dateObj || !selectedCoordinator) return true;

      const dateKey = dateObj.format("YYYY-MM-DD");
      const slotsForDate = dateAvailability[dateKey] || [];

      const dayStart = dateObj.startOf("day");
      const dayEnd = dateObj.endOf("day");

      let currentTime = dayStart.clone();
      while (
        currentTime &&
        currentTime.add(duration, "minutes").isSameOrBefore(dayEnd)
      ) {
        const slotAvailable = isSlotAvailable(currentTime, duration);
        if (slotAvailable) return true;
        currentTime = currentTime.add(1, "minutes");
      }

      return false;
    },
    [selectedCoordinator, dateAvailability, isSlotAvailable]
  );

  const getAvailableTimeSlots = useCallback(
    (date, duration = 30) => {
      if (!date) return [];

      const dateObj = dayjs(date);
      if (!dateObj.isValid()) return [];

      const dateKey = dateObj.format("YYYY-MM-DD");
      const slotsForDate = dateAvailability[dateKey] || [];

      const dayStart = dateObj.startOf("day");
      const dayEnd = dateObj.endOf("day");
      const availableSlots = [];

      let currentTime = dayStart;
      while (currentTime.add(duration, "minutes").isSameOrBefore(dayEnd)) {
        const slotAvailable = isSlotAvailable(currentTime, duration);
        if (slotAvailable) {
          availableSlots.push({
            time: currentTime.format("HH:mm"),
            datetime: currentTime,
            available: true,
          });
        }
        currentTime = currentTime.add(1, "minutes");
      }

      return availableSlots;
    },
    [dateAvailability, isSlotAvailable]
  );

  const getBookedSlotsForDate = useCallback(
    (date) => {
      if (!date) return [];

      const dateKey = dayjs(date).format("YYYY-MM-DD");
      const slotsForDate = dateAvailability[dateKey] || [];

      return slotsForDate.map((slot) => ({
        interviewDateTime: slot.start,
        duration: slot.end.diff(slot.start, "minutes"),
        interviewId: slot.interviewId,
      }));
    },
    [dateAvailability]
  );

  const getInitialValues = () => {
    if (data) {
      let dateTimeValue = null;
      if (data.interviewDateTime) {
        dateTimeValue = dayjs(data.interviewDateTime).isValid()
          ? dayjs(data.interviewDateTime)
          : null;
      }
      const initialCoordinator = data?.assignedTo || data?.coordinator || "";

      return {
        contactNumber: data.contactNumber || data.candidateContactNo || "",
        candidateEmailId: data.emailId || data.candidateEmailId || "",
        fullName: data.fullName || data.candidateFullName || "",
        candidateId: data.candidateId || "",
        clientName: data.clientName || "",
        duration: data.duration || 30,
        externalInterviewDetails: data.externalInterviewDetails || "",
        interviewDateTime: dateTimeValue,
        interviewLevel: data.interviewLevel || "INTERNAL",
        jobId: data.jobId || "",
        userEmail: email || "",
        userId: data.userId || userId || "",
        zoomLink: data.zoomLink || "",
        interviewStatus: "SCHEDULED",
        skipNotification: data?.skipNotification || false,
        assignedTo: initialCoordinator,
      };
    }

    return {
      contactNumber: "",
      candidateEmailId: "",
      fullName: "",
      candidateId: "",
      clientName: "",
      duration: 30,
      externalInterviewDetails: "",
      interviewDateTime: null,
      interviewLevel: "INTERNAL",
      jobId: "",
      userEmail: email || "",
      userId: userId || "",
      zoomLink: "",
      interviewStatus: "SCHEDULED",
      skipNotification: false,
      assignedTo: "",
    };
  };

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        candidateId: Yup.string().required("Candidate ID is required"),
        fullName: Yup.string().required("Candidate name is required"),
        contactNumber: Yup.string().required("Contact number is required"),
        candidateEmailId: Yup.string()
          .email("Invalid email format")
          .required("Candidate email is required"),
        userEmail: Yup.string()
          .email("Invalid email format")
          .required("User email is required"),
        clientName: Yup.string().required("Client name is required"),
        interviewDateTime: Yup.date()
          .required("Interview date and time is required")
          .test(
            "time-available",
            "This time slot conflicts with an existing booking",
            function (value) {
              if (!value || !selectedCoordinator) return true;

              const duration = this.parent.duration || 30;

              if (data?.interviewDateTime) {
                const originalTime = dayjs(data.interviewDateTime);
                if (dayjs(value).isSame(originalTime)) {
                  return true;
                }
              }

              const isAvailable = isSlotAvailable(value, duration);

              if (!isAvailable) {
                const conflictTime = dayjs(value).format("HH:mm");
                return this.createError({
                  message: `Time slot ${conflictTime} is already booked. Please select a different time.`,
                });
              }

              return true;
            }
          ),
        duration: Yup.number()
          .required("Duration is required")
          .min(15, "Duration must be at least 15 minutes")
          .max(60, "Duration cannot exceed 60 minutes"),
        zoomLink: Yup.string().nullable(),
        interviewLevel: Yup.string()
          .required("Interview level is required")
          .oneOf(
            ["INTERNAL", "EXTERNAL", "EXTERNAL-L1", "EXTERNAL-L2", "FINAL"],
            "Invalid interview level"
          ),
        externalInterviewDetails: Yup.string().nullable(),
        skipNotification: Yup.boolean(),
        assignedTo: Yup.string().nullable(),
      }),
    [
      selectedCoordinator,
      isSlotAvailable,
      data?.interviewDateTime,
      dateAvailability,
    ]
  );

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true);
        const interviewDateTime = dayjs(values.interviewDateTime);
        const duration = values.duration;
        const endTime = interviewDateTime.add(duration, "minutes");

        if (values.assignedTo) {
          const isAvailable = isSlotAvailable(interviewDateTime, duration);
          if (!isAvailable) {
            throw new Error("The selected time slot is no longer available");
          }
        }

        const formattedDateTime = interviewDateTime.format(
          "YYYY-MM-DDTHH:mm:ssZ"
        );

        const payload = {
          candidateId: values.candidateId,
          candidateEmailId: values.candidateEmailId,
          fullName: values.fullName,
          contactNumber: values.contactNumber,
          interviewDateTime: formattedDateTime,
          interviewScheduledTimestamp: interviewDateTime.valueOf(),
          duration: duration,
          zoomLink: values.zoomLink,
          interviewLevel: values.interviewLevel,
          interviewStatus: "SCHEDULED",
          clientEmail: clientEmails,
          clientName: values.clientName,
          jobId: values.jobId,
          userEmail: values.userEmail,
          userId: userId,
          externalInterviewDetails: values.externalInterviewDetails,
          skipNotification: values.skipNotification,
          assignedTo: values.assignedTo || null,
        };

        const responseData = await httpService.post(
          `/candidate/interview-schedule/${userId}`,
          payload
        );

        if (values.assignedTo) {
          const newSlot = {
            interviewDateTime: formattedDateTime,
            duration: duration,
            interviewId: responseData.interviewId || responseData.id,
          };

          setBookedSlots((prev) => [...prev, newSlot]);

          const dateKey = interviewDateTime.format("YYYY-MM-DD");
          setDateAvailability((prev) => ({
            ...prev,
            [dateKey]: [
              ...(prev[dateKey] || []),
              {
                start: interviewDateTime,
                end: endTime,
                interviewId: responseData.interviewId || responseData.id,
              },
            ],
          }));
        }

        setInterviewResponse(responseData);
        setSubmissionSuccess(true);
        ToastService.success("Scheduled Interview Successfully");

        if (refreshData) {
          refreshData();
        }

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose(true);
        }, 2000);
      } catch (error) {
        const errorMessage =
          error?.response?.data?.error?.errorMessage ||
          error?.response?.data?.message ||
          error.message ||
          "Failed to schedule interview";
        ToastService.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleAddClientEmail = () => {
    if (newClientEmail && !clientEmails.includes(newClientEmail)) {
      setClientEmails([...clientEmails, newClientEmail]);
      setNewClientEmail("");
    }
  };

  const handleRemoveClientEmail = (emailToRemove) => {
    setClientEmails(clientEmails.filter((email) => email !== emailToRemove));
  };

  const handleCoordinatorChange = (event) => {
    const newCoordinator = event.target.value;
    setSelectedCoordinator(newCoordinator);
    formik.setFieldValue("assignedTo", newCoordinator);
    fetchBookedSlots(newCoordinator);
  };

  const handleDateTimeChange = (newValue) => {
    const value = newValue && newValue.isValid() ? newValue : null;
    formik.setFieldValue("interviewDateTime", value);

    if (value) {
      const date = dayjs(value).startOf("day");
      setSelectedDate(date);

      if (selectedCoordinator) {
        const dateKey = date.format("YYYY-MM-DD");
        if (!dateAvailability[dateKey]) {
          fetchBookedSlots(selectedCoordinator);
        }
      }
    } else {
      setSelectedDate(null);
    }
  };

  const SuccessMessage = () =>
    submissionSuccess &&
    interviewResponse && (
      <Alert icon={<Check />} severity="success" sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Interview scheduled for <strong>Candidate ID:</strong>{" "}
          {interviewResponse.candidateId}
        </Typography>
      </Alert>
    );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%", p: { xs: 1, sm: 2 }, overflow: "auto" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" color="primary" fontWeight="medium">
            Schedule Interview
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <SuccessMessage />

        {loadingSlots && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading availability data...
            </Typography>
          </Box>
        )}

        <Box component="form" onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  color="primary"
                  fontWeight="medium"
                >
                  Candidate Information
                </Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="candidateId"
                label="Candidate ID"
                value={formik.values.candidateId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.candidateId &&
                  Boolean(formik.errors.candidateId)
                }
                helperText={
                  formik.touched.candidateId && formik.errors.candidateId
                }
                disabled
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="fullName"
                label="Candidate Name"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.fullName && Boolean(formik.errors.fullName)
                }
                helperText={formik.touched.fullName && formik.errors.fullName}
                disabled
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="candidateEmailId"
                label="Candidate Email"
                type="email"
                value={formik.values.candidateEmailId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.candidateEmailId &&
                  Boolean(formik.errors.candidateEmailId)
                }
                helperText={
                  formik.touched.candidateEmailId &&
                  formik.errors.candidateEmailId
                }
                disabled
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="contactNumber"
                label="Candidate Contact"
                value={formik.values.contactNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.contactNumber &&
                  Boolean(formik.errors.contactNumber)
                }
                helperText={
                  formik.touched.contactNumber && formik.errors.contactNumber
                }
                disabled
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="userEmail"
                label="User Email"
                type="email"
                value={formik.values.userEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.userEmail && Boolean(formik.errors.userEmail)
                }
                helperText={formik.touched.userEmail && formik.errors.userEmail}
                disabled
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="jobId"
                label="Job ID"
                value={formik.values.jobId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  color="primary"
                  fontWeight="medium"
                >
                  Client Information
                </Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="clientName"
                label="Client Name"
                value={formik.values.clientName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.clientName && Boolean(formik.errors.clientName)
                }
                helperText={
                  formik.touched.clientName && formik.errors.clientName
                }
                disabled
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <TextField
                  fullWidth
                  label="Add Client Email"
                  variant="outlined"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddClientEmail();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={handleAddClientEmail} size="small">
                        <AddIcon />
                      </IconButton>
                    ),
                  }}
                  helperText="Enter client email addresses and press Enter or click add"
                  InputLabelProps={{ shrink: true }}
                />
                <Box
                  sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}
                >
                  {clientEmails.map((email, index) => (
                    <Chip
                      key={index}
                      label={email}
                      onDelete={() => handleRemoveClientEmail(email)}
                      deleteIcon={<DeleteIcon />}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  color="primary"
                  fontWeight="medium"
                >
                  Interview Details
                </Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Interview Date & Time"
                value={safeDayjs(formik.values.interviewDateTime)}
                onChange={handleDateTimeChange}
                shouldDisableTime={(timeValue, clockType) => {
                  if (!timeValue || !selectedCoordinator) return false;

                  const timeObj = safeDayjs(timeValue);
                  if (!timeObj || !timeObj.isValid()) return false;

                  const dateKey = timeObj.format("YYYY-MM-DD");
                  const slotsForDate = dateAvailability[dateKey] || [];

                  if (slotsForDate.length === 0) return false;

                  if (clockType === "hours") {
                    const hour = timeObj.hour();
                    let hasAvailableSlot = false;

                    for (let minute = 0; minute < 60; minute += 30) {
                      const testTime = timeObj
                        .clone()
                        .hour(hour)
                        .minute(minute);

                      const isBlocked = slotsForDate.some((existingSlot) => {
                        const existingStart = safeDayjs(existingSlot.start);
                        const existingEnd = safeDayjs(existingSlot.end);

                        if (
                          !existingStart ||
                          !existingEnd ||
                          !existingStart.isValid() ||
                          !existingEnd.isValid()
                        ) {
                          return false;
                        }

                        return (
                          (testTime.isAfter(existingStart) ||
                            testTime.isSame(existingStart)) &&
                          testTime.isBefore(existingEnd)
                        );
                      });

                      if (!isBlocked) {
                        hasAvailableSlot = true;
                        break;
                      }
                    }

                    return !hasAvailableSlot;
                  }

                  const selectedTime = timeObj;

                  const isTimeBlocked = slotsForDate.some((existingSlot) => {
                    const existingStart = safeDayjs(existingSlot.start);
                    const existingEnd = safeDayjs(existingSlot.end);

                    if (
                      !existingStart ||
                      !existingEnd ||
                      !existingStart.isValid() ||
                      !existingEnd.isValid()
                    ) {
                      return false;
                    }

                    const isWithinSlot =
                      (selectedTime.isAfter(existingStart) ||
                        selectedTime.isSame(existingStart)) &&
                      selectedTime.isBefore(existingEnd);

                    return isWithinSlot;
                  });

                  return isTimeBlocked;
                }}
                views={["year", "month", "day", "hours", "minutes"]}
                openTo="day"
                ampm={false}
                format="DD/MM/YYYY HH:mm"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error:
                      formik.touched.interviewDateTime &&
                      Boolean(formik.errors.interviewDateTime),
                    helperText:
                      formik.touched.interviewDateTime &&
                      formik.errors.interviewDateTime,
                    required: true,
                    InputLabelProps: { shrink: true },
                  },
                  actionBar: {
                    actions: ["clear", "today", "accept"],
                  },
                }}
                loading={loadingSlots}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel shrink>Duration (minutes)</InputLabel>
                <Select
                  name="duration"
                  value={formik.values.duration}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.duration && Boolean(formik.errors.duration)
                  }
                  label="Duration (minutes)"
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={45}>45 minutes</MenuItem>
                  <MenuItem value={60}>60 minutes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Interview Level</InputLabel>
                <Select
                  name="interviewLevel"
                  value={formik.values.interviewLevel}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.interviewLevel &&
                    Boolean(formik.errors.interviewLevel)
                  }
                  label="Interview Level"
                  required
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="INTERNAL">Internal</MenuItem>
                  <MenuItem value="EXTERNAL">External</MenuItem>
                  <MenuItem value="EXTERNAL-L1">External L1</MenuItem>
                  <MenuItem value="EXTERNAL-L2">External L2</MenuItem>
                  <MenuItem value="FINAL">Final</MenuItem>
                </Select>
                {formik.touched.interviewLevel &&
                  formik.errors.interviewLevel && (
                    <Typography variant="caption" color="error">
                      {formik.errors.interviewLevel}
                    </Typography>
                  )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="assigned-to-label" shrink>
                  Coordinator
                </InputLabel>
                <Select
                  labelId="assigned-to-label"
                  id="assigned-to-select"
                  name="assignedTo"
                  value={formik.values.assignedTo}
                  onChange={handleCoordinatorChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.assignedTo &&
                    Boolean(formik.errors.assignedTo)
                  }
                  label="Coordinator"
                  notched={true}
                  disabled={formik.values.interviewLevel !== "INTERNAL"}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">None</MenuItem>
                  {coordinators.map((coordinator) => (
                    <MenuItem key={coordinator.value} value={coordinator.value}>
                      {coordinator.label}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.assignedTo && formik.errors.assignedTo && (
                  <Typography variant="caption" color="error">
                    {formik.errors.assignedTo}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                name="zoomLink"
                label="Zoom/Meeting Link"
                value={formik.values.zoomLink}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.zoomLink && Boolean(formik.errors.zoomLink)
                }
                helperText={formik.touched.zoomLink && formik.errors.zoomLink}
                placeholder="https://zoom.us/j/example"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                name="externalInterviewDetails"
                label="Interview Details / Notes"
                value={formik.values.externalInterviewDetails}
                variant="outlined"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.externalInterviewDetails &&
                  Boolean(formik.errors.externalInterviewDetails)
                }
                helperText={
                  formik.touched.externalInterviewDetails &&
                  formik.errors.externalInterviewDetails
                }
                multiline
                rows={4}
                placeholder="Add further interview details, requirements, or any other important notes"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {formik.values.interviewLevel !== "INTERNAL" && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="externalInterviewDetails"
                  label="External Interview Details"
                  value={formik.values.externalInterviewDetails}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.externalInterviewDetails &&
                    Boolean(formik.errors.externalInterviewDetails)
                  }
                  helperText={
                    formik.touched.externalInterviewDetails &&
                    formik.errors.externalInterviewDetails
                  }
                  multiline
                  rows={3}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="skipNotification"
                    checked={formik.values.skipNotification}
                    onChange={formik.handleChange}
                    color="primary"
                  />
                }
                label="Skip email notification"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button variant="outlined" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={formik.isSubmitting}
                  startIcon={
                    formik.isSubmitting ? <CircularProgress size={20} /> : null
                  }
                >
                  {formik.isSubmitting ? "Scheduling..." : "Schedule Interview"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            severity={notification.severity}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() =>
                  setNotification({ ...notification, open: false })
                }
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ScheduleInterviewForm;
