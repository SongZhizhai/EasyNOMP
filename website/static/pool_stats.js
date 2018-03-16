var poolWorkerData;
var poolHashrateData;
var poolBlockData;

var poolWorkerChart;
var poolHashrateChart;
var poolBlockChart;

var statData;
var poolKeys;

var totalHash;
var totalImmature;
var totalBal;
var totalPaid;
var totalShares;

var byteUnits = [' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];

this.getReadableHashRateString = function(hashrate) {
  var i = -1;
  do {
    hashrate = hashrate / 1000;
    i++;
  } while (hashrate > 1000);
  return hashrate.toFixed(2) + byteUnits[i];
};

function buildChartData() {

  var pools = {};

  poolKeys = [];
  for (var i = 0; i < statData.length; i++) {
    for (var pool in statData[i].pools) {
      if (poolKeys.indexOf(pool) === -1)
        poolKeys.push(pool);
    }
  }


  for (var i = 0; i < statData.length; i++) {
    var time = statData[i].time * 1000;
    for (var f = 0; f < poolKeys.length; f++) {
      var pName = poolKeys[f];
      if (pName !== poolName) {
        continue;
      }
      var a = pools[pName] = (pools[pName] || {
        hashrate: [],
        validShares: [],
        invalidShares: [],
        workers: [],
        confirmedBlocks: [],
        pendingBlocks: [],
        orphanedBlocks: []
      });
      var date = new Date(time).valueOf();
      if (pName in statData[i].pools) {
        a.hashrate.push({
          t: date,
          y: statData[i].pools[pName].hashrate
        });
        a.workers.push({
          t: date,
          y: statData[i].pools[pName].workerCount
        });
        a.pendingBlocks.push({
          t: date,
          y: statData[i].pools[pName].blocks.pending
        });
        a.confirmedBlocks.push({
          t: date,
          y: statData[i].pools[pName].blocks.confirmed
        });
        a.orphanedBlocks.push({
          t: date,
          y: statData[i].pools[pName].blocks.orphaned
        });
      } else {
        a.workers.push({
          t: date,
          y: 0
        });
        a.hashrate.push({
          t: date,
          y: 0
        });
        a.pendingBlocks.push({
          t: date,
          y: 0
        });
        a.confirmedBlocks.push({
          t: date,
          y: 0
        });
        a.orphanedBlocks.push({
          t: date,
          y: 0
        });
      }
    }
  }

  poolShareData = [];
  poolHashrateData = {
    label: "",
    speed: "",
    data: []
  };
  poolBlockData = {
    label: "",
    pending: [],
    orphaned: [],
    confirmed: []
  };
  if (poolName in pools) {
    var pool = pools[poolName];
    poolShareData.push({
      label: "Test",
      value: [0, 1]
    });
    var byteUnits = [' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];
    var mappedHashrate = pool.hashrate.map(x => x.y);
    var maxHash = Math.max.apply(null, mappedHashrate);
    var hashFactor = hashrateScaleFactor(maxHash);
    for (var i in pool.hashrate) {
      pool.hashrate[i].y /= Math.pow(1024, hashFactor);
    }
    poolHashrateData = {
      label: poolName,
      speed: byteUnits[hashFactor - 1],
      data: pool.hashrate,
      sma: calculateEMA(pool.hashrate, 30)
    };
    poolBlockData = {
      label: poolName,
      pending: pool.pendingBlocks,
      orphaned: pool.orphanedBlocks,
      confirmed: pool.confirmedBlocks
    }
  }
}

var getHashAverage = function(hashrates, n){
  var moveMean = [];
  var timestamp = 0;
  var skip = 60 * 60 * 1000;
  for (var i = 0; i < hashrates.length; i++) {
    if(timestamp === 0){
      timestamp = hashrates[i].t;
    } else if(timestamp + skip < hashrates[i].t || i == hashrates.length - 1){
      timestamp = hashrates[i].t;
      moveMean.push(hashrates[i]);
    }
  }
  return moveMean;
}

function hashrateScaleFactor(hashrate) {
  var i = 0;
  do {
    hashrate = hashrate / 1024;
    i++;
  } while (hashrate > 1024);
  return i;
}

function simplifyHashrate(hashrate, factor) {
  if(hashrate > 1024 && factor > 0){
    return simplifyHashrate(hashrate / 1024, factor--);
  }
  return Math.round(hashrate);
}

function timeOfDayFormat(timestamp) {
  var dStr = d3.time.format('%I:%M %p')(new Date(timestamp));
  if (dStr.indexOf('0') === 0) dStr = dStr.slice(1);
  return dStr;
}

function displayCharts() {
  var chartColors = [
    '#1976D2',
    '#388E3C',
    '#FBC02D',
    '#512DA8',
    '#C2185B',
    '#4CAF50',
    '#FFC107',
    '#F44336'
  ];
  poolHashrateChart = new Chart($("#poolHashChart"), {
    type: 'line',
    data: {
      datasets: [{
        fill: false,
        backgroundColor: chartColors[0],
        borderColor: chartColors[0],
        label: 'Real',
        data: poolHashrateData.data
      },
      {
        lineTension: 0.0,
        fill: false,
        backgroundColor: chartColors[4],
        borderColor: chartColors[4],
        label: 'EMA(30)',
        data: poolHashrateData.sma
      }]
    },
    options: {
      responsive: true,
      elements: {
        point: { radius: 0 }
      },
      scales: {
        xAxes: [{
          type: 'time',
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Time'
          },
          ticks: {
            major: {
              fontStyle: 'bold',
              fontColor: chartColors[0]
            }
          }
        }],
        yAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: poolHashrateData.speed
          }
        }]
      }
    }
  });
  poolBlockChart = new Chart($("#blockChart"), {
    type: 'line',
    data: {
      datasets: [{
        fill: false,
        backgroundColor: chartColors[5],
        borderColor: chartColors[5],
        label: 'Confirmed',
        data: poolHashrateData.confirmed
      },
      {
        fill: false,
        backgroundColor: chartColors[6],
        borderColor: chartColors[6],
        label: 'Pending',
        data: poolBlockData.pending
      },
      {
        fill: false,
        backgroundColor: chartColors[7],
        borderColor: chartColors[7],
        label: 'Orphaned',
        data: poolHashrateData.orphaned
      }]
    },
    options: {
      responsive: true,
      elements: {
        point: { radius: 0 }
      },
      scales: {
        xAxes: [{
          type: 'time',
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Time'
          },
          ticks: {
            major: {
              fontStyle: 'bold',
              fontColor: chartColors[0]
            }
          }
        }],
        yAxes: [{
          ticks: {
            beginAtZero: true,
            fixedStepSize: 1
          },
          display: true,
          stacked: true,
          scaleLabel: {
            display: true,
            labelString: 'Blocks'
          }
        }]
      }
    }
  });
}

function updateStats() {


  $("#validShares").text(luckDays);
  $("#confirmedBlocks").text(totalImmature);
}

function pastelColors() {
  var r = (Math.round(Math.random() * 127) + 127).toString(16);
  var g = (Math.round(Math.random() * 127) + 127).toString(16);
  var b = (Math.round(Math.random() * 127) + 127).toString(16);
  return '#' + r + g + b;
}

function TriggerChartUpdates() {
  poolHashrateChart.update();
  poolBlockChart.update();
}

$.getJSON('/api/pool_stats?' + poolName, function(data) {
  statData = data;
  buildChartData();
  displayCharts();
});

statsSource.addEventListener('message', function(e) {
  var stats = JSON.parse(e.data);
  statData.push(stats);

  var newPoolAdded = (function() {
    for (var p in stats.pools) {
      if (poolKeys.indexOf(p) === -1)
        return true;
    }
    return false;
  })();

  if (newPoolAdded || Object.keys(stats.pools).length > poolKeys.length) {
    buildChartData();
    displayCharts();
  } else {
    $("#validShares").text(poolName in stats.pools ? stats.pools[poolName].poolStats.validShares : 0);
    $("#poolHashRate").text(poolName in stats.pools ? stats.pools[poolName].hashrateString : '0.00H/s');
    $("#poolWorkers").text(poolName in stats.pools ? stats.pools[poolName].workerCount : 0);
    $("#pendingBlocks").text(poolName in stats.pools ? stats.pools[poolName].blocks.pending : 0);
    $("#confirmedBlocks").text(poolName in stats.pools ? stats.pools[poolName].blocks.confirmed : 0);
  }
});
