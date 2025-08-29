import React, { useState } from "react";
import { Box } from "@mui/material";
import CustomDataTable from "../../ui-lib/CustomDataTable";
import getHotListColumns from "./hotListColumns";

const YetToOnboard = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  return (
    <Box>
      <CustomDataTable
        title="Yet To Onboard"
        columns={getHotListColumns({
          handleNavigate: () => {},
          handleEdit: () => {},
          handleDelete: () => {},
          loading: false,
        })}
        rows={[]}
        total={0}
        page={page}
        rowsPerPage={rowsPerPage}
        search={search}
        loading={false}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        onSearchChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        onSearchClear={() => {
          setSearch("");
          setPage(0);
        }}
        onRefresh={() => {}}
        onCreateNew={() => {}}
      />
    </Box>
  );
};

export default YetToOnboard;
