const fs = require("fs");
const path = require("path");

const kleur = require("kleur");
const glob = require("glob");

const KEYS = [
  "performance__score",
  "first-contentful-paint",
  "interactive",
  "speed-index",
  "total-blocking-time",
  "largest-contentful-paint",
  "cumulative-layout-shift",
];

const BIGGER_IS_BETTER = ["performance__score"];

async function main(reportfolder, logger) {
  const files = glob.sync(path.join(reportfolder, "*.report.json"));
  if (!files.length) {
    logger.warn("Nothing new to report!");
    return;
  }
  const urls = new Map();
  const countRuns = new Map();
  for (const file of files) {
    const other = glob.sync(file + ".*");
    const report = JSON.parse(fs.readFileSync(file));
    const url = report.requestedUrl;
    countRuns.set(url, other.length + 1);
    const audits = new Map();
    audits.set("performance__score", [
      {
        score: report.categories.performance.score,
        numericValue: report.categories.performance.score,
        numericUnit: "score",
      },
    ]);
    for (const [key, value] of Object.entries(report.audits)) {
      if (
        "score" in value &&
        value.score !== null &&
        "numericValue" in value &&
        value.scoreDisplayMode !== "binary"
      ) {
        // console.log(key, value);
        // console.log({
        //   key,
        //   score: value.score,
        //   numericValue: value.numericValue,
        // });
        audits.set(key, [
          {
            score: value.score,
            numericValue: value.numericValue,
            numericUnit: value.numericUnit,
          },
        ]);
      }
    }
    for (const reportFile of other) {
      const report = JSON.parse(fs.readFileSync(reportFile));
      if (report.runtimeError) {
        console.log(`Skipping report ${reportFile} because of runtime error`);
        console.log(report.runtimeError);
        continue;
      }
      audits.get("performance__score").push({
        score: report.categories.performance.score,
        numericValue: report.categories.performance.score,
        numericUnit: "score",
      });
      for (const [key, value] of Object.entries(report.audits)) {
        if (audits.has(key)) {
          if (value.numericValue === undefined) {
            throw new Error("BAD REPORT!");
          }
          audits.get(key).push({
            score: value.score,
            numericValue: value.numericValue,
          });
        }
      }
    }

    urls.set(url, audits);
  }

  const auditSummaries = new Map();
  for (const [url, audits] of urls) {
    auditSummaries.set(url, new Map());
    for (const key of KEYS) {
      const biggerIsBetter = BIGGER_IS_BETTER.includes(key);
      auditSummaries.get(url).set(key, new Map());
      const values = audits.get(key).map((v) => v.numericValue);
      const best = biggerIsBetter
        ? getHighest(...values)
        : getLowest(...values);
      auditSummaries.get(url).get(key).set("best", best);
      auditSummaries.get(url).get(key).set("median", getMedian(values));
    }
  }

  const LONGEST_KEY = Math.max(...KEYS.map((k) => k.length));
  const PAD = 20;
  for (const [url, audits] of urls) {
    console.log(
      kleur.white().bold(url),
      kleur.cyan(`${countRuns.get(url)} runs`)
    );
    console.log(
      "".padEnd(LONGEST_KEY + 1),
      "|",
      kleur.bold("BEST".padEnd(PAD + 1)),
      "|",
      kleur.bold("MEDIAN".padEnd(PAD))
    );
    for (const key of KEYS) {
      const biggerIsBetter = BIGGER_IS_BETTER.includes(key);
      const min = auditSummaries.get(url).get(key).get("best");
      const minComparison = getComparison(
        auditSummaries,
        url,
        key,
        "best",
        min,
        biggerIsBetter,
        PAD / 2
      );
      const median = auditSummaries.get(url).get(key).get("median");
      const medianComparison = getComparison(
        auditSummaries,
        url,
        key,
        "median",
        median,
        biggerIsBetter,
        PAD / 2
      );
      const unit = audits.get(key)[0].numericUnit;
      console.log(
        key.padEnd(LONGEST_KEY + 1),
        "|",
        format(min, unit, key).padEnd(PAD / 2),
        minComparison,
        "|",
        format(median, unit, key).padEnd(PAD / 2),
        medianComparison
      );
    }
    console.log("\n");
  }
}

function getComparison(
  auditSummaries,
  url,
  key,
  measure,
  value,
  biggerIsBetter = false,
  PAD
) {
  for (const [url_, audits] of auditSummaries) {
    if (url_ === url) continue;
    for (const [key_, numbers] of audits) {
      if (key_ !== key) continue;
      const comp = numbers.get(measure);
      if (!comp) {
        return "n/a".padEnd(PAD);
      }
      return formatRatio(value / comp, biggerIsBetter, PAD);
    }
  }
}

function formatRatio(r, biggerIsBetter, PAD) {
  const p = (100 * r - 100) * (biggerIsBetter ? 1 : -1);
  const percentage = `${p > 0 ? "+" : ""}${p.toFixed(1)}%`.padEnd(PAD);
  if (biggerIsBetter) {
    if (r > 1) {
      return kleur.green(percentage);
    } else if (r < 1) {
      return kleur.red(percentage);
    }
    return kleur.yellow(percentage);
  }

  if (r > 1) {
    return kleur.red(percentage);
  } else if (r < 1) {
    return kleur.green(percentage);
  }
  return kleur.yellow(percentage);
}

function getLowest(...numbers) {
  return Math.min(...numbers);
}

function getHighest(...numbers) {
  return Math.max(...numbers);
}

function format(number, unit, key) {
  function inner(number, unit, key) {
    if (unit === "millisecond") {
      return `${number.toFixed(1)}ms`;
    } else if (key === "cumulative-layout-shift") {
      return number.toFixed(4);
    } else if (key === "performance__score") {
      return number.toFixed(2);
    } else {
      throw new Error(`${unit} ??`);
    }
  }
  return inner(number, unit, key);
}

function getMedian(values) {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  return (values[half - 1] + values[half]) / 2.0;
}

module.exports = {
  main,
};
