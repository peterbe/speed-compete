const fs = require("fs");
const path = require("path");

const glob = require("glob");

async function main(reportfolder, logger) {
  const files = glob.sync(path.join(reportfolder, "*.report.html"));
  for (const file of files) {
    const other = glob.sync(file + "*");
    const next = other.length + 1;
    const newName = `${file}.${next}`;
    const jsonFile = file.replace(".report.html", ".report.json");
    const newJsonFile = `${jsonFile}.${next}`;
    fs.renameSync(file, newName);
    logger.info(`Renamed ${file} to ${newName}`);
    fs.renameSync(jsonFile, newJsonFile);
    logger.info(`Renamed ${jsonFile} to ${newJsonFile}`);
  }
  if (!files.length) {
    logger.info("Nothing new to roll");
  }
}

module.exports = {
  main,
};
