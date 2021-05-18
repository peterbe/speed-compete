#!/bin/bash
set -e  # Exit on non-zero status
set -u  # Treat unset variables as an error

echo "Sites to test..."
cat sites.txt

echo "Here we go!"

yarn run roll-reports

lighthouse-batch -f sites.txt --html --params "--only-categories=performance --preset perf --throttling.cpuSlowdownMultiplier=6"

yarn run report-reports
#yarn run merge-summaries report/lighthouse/summary.json
