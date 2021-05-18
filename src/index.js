const path = require("path");

const program = require("@caporal/core").default;

const mergesummaries = require("./merge-summaries");
const rollreports = require("./roll-reports");
const reportreports = require("./report-reports");

program
  .version("1.0.0")

  .command(
    "merge-summaries",
    "Take one lighthouse summary and make it multiple"
  )
  .argument("[summaryfile]", "JSON summary file made from lighthouse", {
    valdiator: program.PATH,
    default: "report/lighthouse/summary.json",
  })
  .action(async function ({ args, logger }) {
    mergesummaries.main(args.summaryfile, logger);
  })

  .command(
    "roll-reports",
    "Take each report and rename it based on count of previous ones"
  )
  .argument("[reportfolder]", "location of the reports", {
    valdiator: program.PATH,
    default: path.join("report", "lighthouse"),
  })
  .action(async function ({ args, logger }) {
    await rollreports.main(args.reportfolder, logger);
  })

  .command("report-reports", "Compute the mean, median, best for each report")
  .argument("[reportfolder]", "location of the reports", {
    valdiator: program.PATH,
    default: path.join("report", "lighthouse"),
  })
  .action(async function ({ args, logger }) {
    await reportreports.main(args.reportfolder, logger);
  });

program.run();
