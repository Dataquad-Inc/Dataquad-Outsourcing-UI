import React, { Suspense } from "react";
import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import lightTheme from "./theme";
import { CircularProgress, Box } from "@mui/material";

import routeConfig from "./routes/routeConfig";
import { ThemeProvider } from "@emotion/react";

const AppRoutes = () => useRoutes(routeConfig);

const App = () => {
  return (
   <ThemeProvider theme={lightTheme}>
    <Router>
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
            <CircularProgress />
          </Box>
        }
      >
        <AppRoutes />
      </Suspense>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Router>
    </ThemeProvider>
  );
};


export default App;