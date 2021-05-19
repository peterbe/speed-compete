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
    logger.info(`Renamed ${bname(file)} to ${bname(newName)}`);
    fs.renameSync(jsonFile, newJsonFile);
    logger.info(`Renamed ${bname(jsonFile)} to ${bname(newJsonFile)}`);
  }
  if (!files.length) {
    logger.info("Nothing new to roll");
  }
}

function bname(fp) {
  return path.basename(fp);
}

module.exports = {
  main,
};
