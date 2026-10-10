const fs = require("fs");
const p = require("path").join(
  __dirname,
  "..",
  "src",
  "components",
  "HRMS",
  "HRMS.jsx"
);
let s = fs.readFileSync(p, "utf8");

s = s.replace(/\n\s*ReceiptLongOutlined,/, "");
s = s.replace(
  /\n\s*const \{ entity, role, userId: loggedInUserId \} = useSelector\(\(state\) => state\.auth\);/,
  "\n  const { entity, role } = useSelector((state) => state.auth);"
);

const stateStart = s.indexOf("  const [payslipDialog, setPayslipDialog]");
const afterDownload = s.indexOf("  // Helper function to check if user has a specific role");
if (stateStart !== -1 && afterDownload !== -1) {
  s = s.slice(0, stateStart) + s.slice(afterDownload);
}

s = s.replace(
  /\n\s*\/\/ Dynamic sticky styles — Actions is always rightmost \(View \+ Payment Advice\)/,
  "\n  // Dynamic sticky styles — Actions is always rightmost"
);

const tipStart = s.indexOf('<Tooltip title="Generate Payment Advice">');
if (tipStart !== -1) {
  const tipEnd = s.indexOf("</Tooltip>", tipStart);
  if (tipEnd !== -1) {
    // include trailing newline after tooltip
    let end = tipEnd + "</Tooltip>".length;
    if (s[end] === "\n") end += 1;
    s = s.slice(0, tipStart) + s.slice(end);
  }
}

const btnMarker = "startIcon={<ReceiptLongOutlined />}";
const btnIdx = s.indexOf(btnMarker);
if (btnIdx !== -1) {
  const btnStart = s.lastIndexOf("<Button", btnIdx);
  const btnEnd = s.indexOf("</Button>", btnIdx) + "</Button>".length;
  if (btnStart !== -1 && btnEnd > btnStart) {
    let end = btnEnd;
    if (s[end] === "\n") end += 1;
    s = s.slice(0, btnStart) + s.slice(end);
  }
}

const dialogStart = s.indexOf("<Dialog open={payslipDialog.open}");
if (dialogStart !== -1) {
  // find matching close before ConfirmDialog
  const confirmIdx = s.indexOf("<ConfirmDialog", dialogStart);
  if (confirmIdx !== -1) {
    s = s.slice(0, dialogStart) + s.slice(confirmIdx);
  }
}

fs.writeFileSync(p, s);
console.log({
  hasPayslipDialog: s.includes("payslipDialog"),
  hasReceipt: s.includes("ReceiptLong"),
  hasPaymentAdviceLabel: s.includes("Payment Advice"),
});
