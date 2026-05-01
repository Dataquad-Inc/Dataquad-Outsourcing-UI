// utils/exportFile.js
import * as XLSX from "xlsx";
import httpService from "../Services/httpService";
import ToastService from "../Services/toastService";

/**
 * Reusable Export Utility
 * Fetch API Data + Download CSV / Excel with selected columns
 *
 * @param {String} apiUrl - API endpoint
 * @param {String} fileName - file name
 * @param {String} type - csv | xlsx
 * @param {Object} params - optional query params
 * @param {Array} selectedColumns - array of column keys to export (optional)
 */
export const exportFile = async (
  apiUrl,
  fileName = "report",
  type = "csv",
  params = {},
  selectedColumns = null
) => {
  try {
    // Show loading indicator
    const loadingToastId = ToastService?.loading("Fetching data for export...");
    
    // Use httpService instead of axios directly
    const response = await httpService.get(apiUrl, params);

    const data = response.data;
    
    // Handle different response structures
    let exportData = [];
    if (Array.isArray(data)) {
      exportData = data;
    } else if (data.content && Array.isArray(data.content)) {
      exportData = data.content;
    } else if (data.data && Array.isArray(data.data)) {
      exportData = data.data;
    } else {
      exportData = [];
    }

    if (!exportData || exportData.length === 0) {
      ToastService?.update(loadingToastId, "No data available to export", "warning");
      return;
    }

    // Transform data based on selected columns
    let cleanData;
    
    if (selectedColumns && selectedColumns.length > 0) {
      // Only include selected columns
      cleanData = exportData.map(row => {
        const cleanRow = {};
        selectedColumns.forEach(columnKey => {
          if (row[columnKey] !== null && row[columnKey] !== undefined) {
            if (Array.isArray(row[columnKey])) {
              cleanRow[columnKey] = row[columnKey].join(", ");
            } else if (typeof row[columnKey] === 'object') {
              cleanRow[columnKey] = JSON.stringify(row[columnKey]);
            } else {
              cleanRow[columnKey] = row[columnKey];
            }
          } else {
            cleanRow[columnKey] = "";
          }
        });
        return cleanRow;
      });
    } else {
      // Original behavior - include all columns
      cleanData = exportData.map(row => {
        const cleanRow = {};
        Object.keys(row).forEach(key => {
          if (row[key] !== null && row[key] !== undefined) {
            if (Array.isArray(row[key])) {
              cleanRow[key] = row[key].join(", ");
            } else if (typeof row[key] === 'object') {
              cleanRow[key] = JSON.stringify(row[key]);
            } else {
              cleanRow[key] = row[key];
            }
          } else {
            cleanRow[key] = "";
          }
        });
        return cleanRow;
      });
    }

    // Convert JSON to Excel Sheet
    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    
    // Auto-size columns (optional)
    const maxWidth = 50;
    const wscols = Object.keys(cleanData[0] || {}).map(() => ({ wch: 15 }));
    worksheet['!cols'] = wscols;

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requirements");

    // Download File
    const fullFileName = `${fileName}_${new Date().toISOString().split('T')[0]}`;
    
    if (type === "csv") {
      XLSX.writeFile(workbook, `${fullFileName}.csv`);
    } else {
      XLSX.writeFile(workbook, `${fullFileName}.xlsx`);
    }
    
    ToastService?.update(loadingToastId, `Exported ${exportData.length} records successfully`, "success");
    
  } catch (error) {
    console.error("Export Failed:", error);
    ToastService?.error(`Export failed: ${error.message || "Unknown error"}`);
  }
};