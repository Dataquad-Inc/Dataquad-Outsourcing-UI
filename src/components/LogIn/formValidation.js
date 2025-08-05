// src/components/auth/formValidation.js

// Email regex patterns
const emailRegex = /^[a-z0-9._%+-]+@(dataqinc\.com|adroitinnovative\.com)$/;
const personalEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password regex pattern
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const formValidation = {
 validateUserId: (userId, entity) => {
    if (!userId) {
      return "User ID is required";
    }

    if (entity === "IN") {
      const userIdRegex = /^(DQIND|ADRTIN)\d{2,4}$/;
      return userIdRegex.test(userId)
        ? ""
        : "For IN entity, User ID must start with 'DQIND' or 'ADRTIN' followed by 2 to 4 digits";
    } else if (entity === "US") {
      const userIdRegex = /^ADRTUS\d{2,4}$/;
      return userIdRegex.test(userId)
        ? ""
        : "For US entity, User ID must start with 'ADRTUS' followed by 2 to 4 digits";
    }

    return "Please select an entity first";
  },

  validateUserName: (userName) => {
    const regex = /^[a-zA-Z\s]+$/;

    if (!userName) {
      return "User Name is required";
    }

    if (!regex.test(userName)) {
      return "User Name must contain only alphabetic characters (a-z, A-Z) and spaces";
    }

    if (userName.length > 20) {
      return "User Name must not exceed 20 characters";
    }

    return "";
  },

  validateEmail: (email) => {
    if (!email) {
      return "Email is required";
    }

    if (/[A-Z]/.test(email)) {
      return "Please enter a valid email without capital letters";
    }

    return emailRegex.test(email)
      ? ""
      : "Please enter a valid email (example@dataqinc.com)";
  },

  validatePersonalEmail: (email) => {
    if (!email) {
      return "Personal email is required";
    }

    return personalEmailRegex.test(email)
      ? ""
      : "Please enter a valid personal email like example@gmail.com";
  },

  validatePhoneNumber: (phoneNumber) => {
    if (!phoneNumber) {
      return "Phone number is required";
    }

    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");

    if (cleanedPhoneNumber.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }

    if (!/^\d+$/.test(cleanedPhoneNumber)) {
      return "Phone number must only contain numbers";
    }

    return "";
  },

  validateDesignation: (designation) => {
    const designationRegex = /^[A-Za-z\s]+$/;

    if (!designation) {
      return "Designation is required";
    }

    if (!designationRegex.test(designation)) {
      return "Designation should only contain letters and spaces";
    }

    return "";
  },

  validateGender: (gender) => {
    return gender ? "" : "Please select a gender";
  },

  validateDOB: (dob) => {
    if (!dob) {
      return "Date of birth is required";
    }

    const today = new Date();
    const birthDate = new Date(dob);

    if (birthDate > today) {
      return "Date of birth cannot be in the future";
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 20) {
      return "Age must be at least 20 years";
    }

    return "";
  },

  validateJoiningDate: (joiningDate, dob) => {
    if (!joiningDate) {
      return "Joining date is required";
    }

    const birthDate = new Date(dob);
    const joinDate = new Date(joiningDate);
    const currentDate = new Date();

    if (joinDate <= birthDate) {
      return "Joining date must be after date of birth";
    }

    const oneMonthBefore = new Date();
    oneMonthBefore.setMonth(currentDate.getMonth() - 1);

    const oneMonthAfter = new Date();
    oneMonthAfter.setMonth(currentDate.getMonth() + 1);

    if (joinDate < oneMonthBefore || joinDate > oneMonthAfter) {
      return "Joining date must be within one month before or after today's date";
    }

    return "";
  },

  validatePassword: (password) => {
    if (!password) {
      return "Password is required";
    }

    return passwordRegex.test(password)
      ? ""
      : "Password must be at least 8 characters and include uppercase, lowercase, digit, and special character";
  },

  validateConfirmPassword: (confirmPassword, formData) => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }

    return confirmPassword === formData.password
      ? ""
      : "Passwords do not match";
  },

  // Utility function to validate entire form
  validateForm: (formData) => {
    const errors = {};
    
    // Validate each field
    Object.keys(formData).forEach(field => {
      const validatorName = `validate${field.charAt(0).toUpperCase() + field.slice(1)}`;
      if (formValidation[validatorName]) {
        errors[field] = formValidation[validatorName](formData[field], formData);
      }
    });

    return errors;
  },

  // Check if form is valid
  isFormValid: (formData, formErrors) => {
    return (
      Object.values(formErrors).every(error => error === "") &&
      Object.keys(formData).every(key => formData[key] !== "")
    );
  }
};

export default formValidation;