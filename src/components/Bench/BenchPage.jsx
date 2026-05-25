import React, { useState, useCallback, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Breadcrumbs,
  Link,
} from "@mui/material";
import { NavigateNext as NavigateNextIcon } from "@mui/icons-material";

import BenchListTab from "./BenchListTab";
import TechSummaryCards from "./TechSummaryCards";
import TagCandidatesTable from "./TagCandidatesTable";
import ToastService from "../../Services/toastService";
import httpService from "../../Services/httpService";

// ─── BenchPage ─────────────────────────────────────────────────────────────────
const BenchPage = () => {
  const navigate = useNavigate();

  // Tag drill-down state
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagRows,     setTagRows]     = useState([]);
  const [tagLoading,  setTagLoading]  = useState(false);

  // Summary data
  const [techSummary,    setTechSummary]    = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // ── Fetch tech summary ───────────────────────────────────────────────────────
  const fetchTechSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const response = await httpService.get("/candidate/tag-count");
      const tagData  = response.data || response;

      if (Array.isArray(tagData) && tagData.length > 0) {
        setTechSummary(
          tagData.map((item) => ({
            tagName: item["tag name"] || item.tagName || item.tag,
            count:   item.count || 0,
          }))
        );
      } else {
        setTechSummary([]);
        ToastService.info("No technology tags found");
      }
    } catch (error) {
      console.error("Failed to fetch technology summary:", error);
      ToastService.error("Failed to load technology summary");
      setTechSummary([]);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechSummary();
  }, [fetchTechSummary]);

  // ── Fetch candidates by tag ─────────────────────────────────────────────────
  const fetchTagCandidates = useCallback(async (tagName) => {
    try {
      setTagLoading(true);
      setTagRows([]);
      const response = await httpService.get(
        "/candidate/benchprofiles/by-tag",
        { tagName }
      );
      const data =
        Array.isArray(response.data)
          ? response.data
          : response.data?.candidates || response.data?.content || [];
      setTagRows(data);
    } catch (error) {
      console.error(error);
      ToastService.error("Failed to load candidates for this tag");
      setTagRows([]);
    } finally {
      setTagLoading(false);
    }
  }, []);

  // ── Card click → tag drill-down ─────────────────────────────────────────────
  const handleCardClick = (tech) => {
    setSelectedTag(tech);
    fetchTagCandidates(tech.tagName);
    navigate("/bench-users/summary");
  };

  // ── Back from tag view ──────────────────────────────────────────────────────
  const handleBackToSummary = () => {
    setSelectedTag(null);
    setTagRows([]);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Header ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        sx={{
          mb: 2,
          p: 2,
          backgroundColor: "#f9f9f9",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h6" color="primary" fontWeight={700}>
            Bench Candidate Management
          </Typography>

          {/* Breadcrumb — only shown during tag drill-down */}
          {selectedTag && (
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              sx={{ fontSize: 13 }}
            >
              <Link
                component="button"
                underline="hover"
                color="inherit"
                onClick={handleBackToSummary}
                sx={{ fontSize: 13, cursor: "pointer" }}
              >
                Technology Summary
              </Link>

              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
                  {selectedTag.tagName}
                </Typography>
                <Chip
                  label={selectedTag.count}
                  size="small"
                  color="primary"
                  sx={{ height: 18, fontSize: 11 }}
                />
              </Stack>
            </Breadcrumbs>
          )}
        </Stack>
      </Stack>

      {/* ── Sub-route content ── */}
      <Routes>
        {/* /bench-users/summary */}
        <Route
          path="summary"
          element={
            selectedTag ? (
              <TagCandidatesTable
                rows={tagRows}
                loading={tagLoading}
                tagName={selectedTag.tagName}
              />
            ) : (
              <TechSummaryCards
                techSummary={techSummary}
                loading={summaryLoading}
                onCardClick={handleCardClick}
              />
            )
          }
        />

        {/* /bench-users/bench-list */}
        <Route path="bench-list" element={<BenchListTab />} />

        <Route path="*" element={null} />
      </Routes>
    </Box>
  );
};

export default BenchPage;