import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import getRequirementsSections from "./requirementsFields";
import { fetchAllEmployeesUs } from "../../redux/usEmployees"; // adjust path

const CreateJobRequirement = ({
  handleSubmit = (values) => console.log("Form Submitted:", values),
  handleCancel = () => console.log("Form Cancelled"),
  formTitle = "Create New Requirement",
  formInitialValues = {},
  submitButtonText = "Submit",
  isSubmitting = false,
}) => {
  const dispatch = useDispatch();

  // ✅ Get employees from Redux
  const {
    employees = [],
    loadingEmployees,
    error,
  } = useSelector((state) => state.usEmployees);

  const { role } = useSelector((state) => state.auth);

  // ✅ Fetch employees on mount
  useEffect(() => {
    dispatch(fetchAllEmployeesUs("EMPLOYEE")); // or "TEAMLEAD", "RECRUITER"
  }, [dispatch]);

  // ✅ Pass employees to form config
  const formConfig = getRequirementsSections(employees);

  return (
    <DynamicFormUltra
      config={formConfig}
      onSubmit={handleSubmit}
      title={formTitle}
      initialValues={formInitialValues}
      onCancel={handleCancel}
      submitButtonText={submitButtonText}
      enableReinitialize={true}
      isSubmitting={isSubmitting || loadingEmployees}
      showCancelButton={true}
    />
  );
};

export default CreateJobRequirement;
