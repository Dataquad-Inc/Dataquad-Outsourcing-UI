import React from "react";
import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import getRequirementsSections from "./requirementsFields";

const CreateJobRequirement = ({
  handleSubmit = (values) => console.log("Form Submitted:", values),
  handleCancel = () => console.log("Form Cancelled"),
  formTitle = "Create New Requirement",
  formInitialValues = {},
  submitButtonText = "Submit",
  isSubmitting = false,
}) => {
  return (
    <DynamicFormUltra
      config={getRequirementsSections()}
      onSubmit={handleSubmit}
      title={formTitle}
      initialValues={formInitialValues}
      onCancel={handleCancel}
      submitButtonText={submitButtonText}
      enableReinitialize={true}
      isSubmitting={isSubmitting}
      showCancelButton={true}
    />
  );
};

export default CreateJobRequirement;