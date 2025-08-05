// utils/showDeleteConfirm.js
import Swal from "sweetalert2";

/**
 * Shows a SweetAlert2 delete confirmation dialog.
 * @param {Function} onConfirm - Function to execute if the user confirms deletion.
 * @param {string} itemName - Name of the item to be deleted.
 * @param {Object} themeColors - Optional: MUI theme colors { confirmColor, cancelColor }
 */
const showDeleteConfirm = (
  onConfirm,
  itemName = "this item",
  themeColors = {
    confirmColor: "#d32f2f", // default red
    cancelColor: "#1976d2", // default blue
  }
) => {
  Swal.fire({
    title: `Delete ${itemName}?`,
    text: "You won’t be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: themeColors.confirmColor,
    cancelButtonColor: themeColors.cancelColor,
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
      Swal.fire("Deleted!", `${itemName} has been deleted.`, "success");
    }
  });
};

export default showDeleteConfirm;
