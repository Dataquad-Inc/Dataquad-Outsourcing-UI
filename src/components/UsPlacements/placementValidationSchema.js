import * as yup from "yup";

export const placementValidationSchema = yup.object().shape({
  consultantName: yup.string().required("Consultant Name is required"),
  consultantEmail: yup.string().email("Invalid email").required("Email is required"),
  phone: yup
    .string()
    .matches(/^\d{10}$/, "Phone must be 10 digits")
    .required("Phone is required"),
  technology: yup.string().required("Technology is required"),
  client: yup.string().required("Client is required"),
  vendorName: yup.string().required("Vendor Name is required"),
  startDate: yup.date().required("Start Date is required"),
  endDate: yup
    .date()
    .nullable()
    .notRequired()
    .when("startDate", (startDate, schema) =>
      schema.min(startDate, "End Date cannot be before Start Date")
    ),
  billRateUSD: yup
    .number()
    .typeError("Bill Rate must be a number")
    .positive("Bill Rate must be positive")
    .required("Bill Rate is required"),
  payRate: yup
    .number()
    .typeError("Pay Rate must be a number")
    .positive("Pay Rate must be positive")
    .required("Pay Rate is required")
    .test(
      "is-less-than-billrate",
      "Pay Rate must be less than or equal to Bill Rate",
      function (value) {
        const { billRateUSD } = this.parent;
        return value <= billRateUSD;
      }
    ),
  employmentType: yup.string().required("Employment Type is required"),
  recruiter: yup.string(),
  sales: yup.string(),
  status: yup.string().required("Status is required"),
  statusMessage: yup.string(),
  remarks: yup.string()
});
