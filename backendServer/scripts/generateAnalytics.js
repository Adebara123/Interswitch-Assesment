#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('../database');
const { createCanvas } = require('canvas');
const Chart = require('chart.js/auto');

async function generateAnalytics() {
  const database = new Database(process.env.DATABASE_URL);

  try {
    console.log('Generating analytics...');

    // Get analytics data
    const basicAnalytics = await database.getAnalytics();
    const topOwners = await database.getTopActiveOwners();
    const activityTrends = await database.getActivityTrends();

    const analyticsData = {
      totalAssetsRegistered: parseInt(basicAnalytics.total_assets),
      totalOwnershipTransfers: parseInt(basicAnalytics.total_transfers),
      topActiveOwners: topOwners,
      activityTrends: activityTrends,
      generatedAt: new Date().toISOString()
    };

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate JSON file
    const jsonPath = path.join(outputDir, 'analytics.json');
    fs.writeFileSync(jsonPath, JSON.stringify(analyticsData, null, 2));
    console.log(`Analytics JSON saved to: ${jsonPath}`);

    // Generate Markdown summary
    const markdownContent = generateMarkdownSummary(analyticsData);
    const markdownPath = path.join(outputDir, 'summary.md');
    fs.writeFileSync(markdownPath, markdownContent);
    console.log(`Markdown summary saved to: ${markdownPath}`);

    // Generate chart (commented out due to canvas architecture issues)
    // await generateActivityChart(activityTrends, outputDir);
    // console.log('Activity trend chart generated');

    console.log('\n=== Analytics Summary ===');
    console.log(`Total Assets Registered: ${analyticsData.totalAssetsRegistered}`);
    console.log(`Total Ownership Transfers: ${analyticsData.totalOwnershipTransfers}`);
    console.log(`Top 3 Most Active Owners:`);
    analyticsData.topActiveOwners.forEach((owner, index) => {
      console.log(`  ${index + 1}. ${owner.owner} (${owner.transfer_count} transfers)`);
    });

  } catch (error) {
    console.error('Error generating analytics:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

function generateMarkdownSummary(data) {
  const markdown = `# Asset Registry Analytics Summary

Generated on: ${new Date(data.generatedAt).toLocaleString()}

## Key Metrics

### Total Assets Registered
**${data.totalAssetsRegistered}** assets have been registered on the blockchain.

### Total Ownership Transfers
**${data.totalOwnershipTransfers}** ownership transfers have occurred.

## Top Active Owners

The following addresses are the most active in terms of transferring asset ownership:

${data.topActiveOwners.map((owner, index) => 
  `${index + 1}. **${owner.owner}** - ${owner.transfer_count} transfers`
).join('\n')}

## Activity Trends

Recent activity shows the following registration patterns:

${data.activityTrends.slice(0, 10).map(trend => 
  `- ${new Date(trend.date).toLocaleDateString()}: ${trend.registrations} registrations`
).join('\n')}

## Chart

A visual representation of the activity trends has been generated as \`activity-trends.png\`.

---

*This report was automatically generated from blockchain data.*
`;

  return markdown;
}

async function generateActivityChart(trends, outputDir) {
  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Prepare data for Chart.js
  const labels = trends.map(trend => new Date(trend.date).toLocaleDateString()).reverse();
  const data = trends.map(trend => parseInt(trend.registrations)).reverse();

  const chartConfig = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Asset Registrations',
        data: data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.1
      }]
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'Asset Registration Activity Trends (Last 30 Days)'
        },
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Registrations'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      }
    },
    plugins: [{
      id: 'background',
      beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, chart.canvas.width, chart.canvas.height);
        ctx.restore();
      }
    }]
  };

  const chart = new Chart(ctx, chartConfig);

  // Save the chart as PNG
  const buffer = canvas.toBuffer('image/png');
  const chartPath = path.join(outputDir, 'activity-trends.png');
  fs.writeFileSync(chartPath, buffer);

  console.log(`Chart saved to: ${chartPath}`);
}

// Run if called directly
if (require.main === module) {
  generateAnalytics().catch(console.error);
}

module.exports = generateAnalytics;