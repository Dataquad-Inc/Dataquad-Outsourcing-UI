import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Alert,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const SimpleDocumentsDisplay = ({ consultantId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(
          `https://mymulya.com/hotlist/getDocumentDetails/${consultantId}`
        );
        const result = await res.json();
        if (result.success) {
          setDocuments(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    if (consultantId) {
      fetchDocs();
    }
  }, [consultantId]);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1} p={2}>
        <CircularProgress size={22} />
        <Typography variant="body2">Loading documents...</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Existing Documents ({documents.length})
      </Typography>

      {documents.length === 0 ? (
        <Alert severity="info">No documents found</Alert>
      ) : (
        <List>
          {documents.map((doc, index) => (
            <React.Fragment key={index}>
              <ListItem
                // secondaryAction={
                //   <Tooltip title="Open Document">
                //     <IconButton
                //       edge="end"
                //       onClick={() => window.open(doc.fileUrl, "_blank")}
                //     >
                //       <OpenInNewIcon />
                //     </IconButton>
                //   </Tooltip>
                // }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <DescriptionIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight={500}>
                      {doc.fileName}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary">
                        Type: {doc.documentType}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(doc.createdAt).toLocaleDateString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < documents.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default SimpleDocumentsDisplay;
