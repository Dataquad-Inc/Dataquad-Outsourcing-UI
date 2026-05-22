import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  Chip,
  Breadcrumbs,
  Link,
  alpha,
  useTheme,
} from "@mui/material";
import {
  TableChart,
  BarChart,
  Label as LabelIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

import BenchListTab      from "./BenchListTab";
import TechSummaryCards  from "./TechSummaryCards";
import TagCandidatesTable from "./TagCandidatesTable";
import ToastService       from "../../Services/toastService";
import httpService        from "../../Services/httpService";

// ─── Tab ids ───────────────────────────────────────────────────────────────────
const TAB_BENCH    = 0;
const TAB_SUMMARY  = 1;
const TAB_TAG      = 2;

// ─── TabPanel ─────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bench-tabpanel-${index}`}
      aria-labelledby={`bench-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return { id: `bench-tab-${index}`, "aria-controls": `bench-tabpanel-${index}` };
}

// ─── BenchPage ─────────────────────────────────────────────────────────────────
const BenchPage = () => {
  const theme = useTheme();

  // Tabs
  const [activeTab, setActiveTab] = useState(TAB_BENCH);

  // Summary data (fetched here so TechSummaryCards is stateless)
  const [techSummary,    setTechSummary]    = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryFetched, setSummaryFetched] = useState(false);

  // Tag candidates (Tab 2)
  const [selectedTag,    setSelectedTag]    = useState(null); // { tagName, count }
  const [tagRows,        setTagRows]        = useState([]);
  const [tagLoading,     setTagLoading]     = useState(false);

  // ── Fetch tech summary (lazy — only when summary tab first opened) ───────────
  const fetchTechSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const response = await httpService.get("/candidate/tag-count");
      const tagData  = response.data || response;

      if (Array.isArray(tagData) && tagData.length > 0) {
        const summaryArray = tagData
          .map((item) => ({
            tagName: item["tag name"] || item.tagName || item.tag,
            count: item.count || 0,
          }))
          // .sort((a, b) => b.count - a.count);
        setTechSummary(summaryArray);
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
      setSummaryFetched(true);
    }
  }, []);

  // ── Fetch candidates for a specific tag ──────────────────────────────────────
  const fetchTagCandidates = useCallback(async (tagName) => {
    try {
      setTagLoading(true);
      setTagRows([]);
      const response = await httpService.get("/candidate/benchprofiles/by-tag", { tagName });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.candidates || response.data?.content || [];
      setTagRows(data);
    } catch {
      ToastService.error("Failed to load candidates for this tag");
      setTagRows([]);
    } finally {
      setTagLoading(false);
    }
  }, []);

  // ── Tab change ───────────────────────────────────────────────────────────────
  const handleTabChange = (_, newValue) => {
    // Fetch summary lazily on first open
    if (newValue === TAB_SUMMARY && !summaryFetched) {
      fetchTechSummary();
    }
    // Don't allow switching to TAB_TAG directly from tabs — only via card click
    if (newValue === TAB_TAG) return;
    setActiveTab(newValue);
  };

  // ── Card click → switch to tag tab ──────────────────────────────────────────
  const handleCardClick = (tech) => {
    setSelectedTag(tech);
    fetchTagCandidates(tech.tagName);
    setActiveTab(TAB_TAG);
  };

  // ── Back from tag tab → summary ──────────────────────────────────────────────
  const handleBackToSummary = () => {
    setActiveTab(TAB_SUMMARY);
    setSelectedTag(null);
    setTagRows([]);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: "100%" }}>
      {/* Page header */}
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

          {/* Breadcrumb shown only on tag tab */}
          {activeTab === TAB_TAG && selectedTag && (
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="bench management tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<TableChart />}
            iconPosition="start"
            label="Bench List"
            {...a11yProps(TAB_BENCH)}
          />
          <Tab
            icon={<BarChart />}
            iconPosition="start"
            label="Technology Summary"
            {...a11yProps(TAB_SUMMARY)}
          />
          {/* Tab 2: only visible/active when a tag is selected */}
          {activeTab === TAB_TAG && selectedTag && (
            <Tab
              icon={<LabelIcon />}
              iconPosition="start"
              label={
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <span>{selectedTag.tagName}</span>
                  <Chip
                    label={selectedTag.count}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 11,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: "primary.main",
                    }}
                  />
                </Stack>
              }
              {...a11yProps(TAB_TAG)}
            />
          )}
        </Tabs>
      </Box>

      {/* ── Tab 0: Bench List ── */}
      <TabPanel value={activeTab} index={TAB_BENCH}>
        <BenchListTab />
      </TabPanel>

      {/* ── Tab 1: Technology Summary Cards ── */}
      <TabPanel value={activeTab} index={TAB_SUMMARY}>
        <TechSummaryCards
          techSummary={techSummary}
          loading={summaryLoading}
          onCardClick={handleCardClick}
        />
      </TabPanel>

      {/* ── Tab 2: Tag Candidates (client-side DataTable) ── */}
      <TabPanel value={activeTab} index={TAB_TAG}>
        {selectedTag && (
          <>
            {/* <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                Candidates tagged as{" "}
                <Box component="span" color="primary.main">
                  {selectedTag.tagName}
                </Box>
              </Typography>
            </Stack> */}

            <TagCandidatesTable
              rows={tagRows}
              loading={tagLoading}
              tagName={selectedTag.tagName}
            />
          </>
        )}
      </TabPanel>
    </Box>
  );
};

export default BenchPage;