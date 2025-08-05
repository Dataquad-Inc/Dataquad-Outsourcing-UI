// ExampleComponent.jsx
import React from "react";
import Swal from "sweetalert2";

const ExampleComponent = () => {
  const handleClick = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won’t be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Deleted!", "Your file has been deleted.", "success");
      }
    });
  };

  return (
    <button onClick={handleClick}>Show SweetAlert</button>
  );
};

export default ExampleComponent;
