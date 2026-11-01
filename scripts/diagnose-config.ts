import { diagnoseConfiguration } from "../src/deployment-diagnostics.js";

const report = diagnoseConfiguration(process.env);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === "BLOCKED" ? 1 : 0;
