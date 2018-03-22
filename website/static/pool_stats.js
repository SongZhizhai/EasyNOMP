var poolWorkerData;
var poolHashrateData;
var poolBlockData;

var hashChartData;

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

var highest = 0;
var scale = 0;
var usingSmallScale = false;

var byteUnits = [' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];
var smlByteUnits = [' H/s', ' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];

this.getReadableYeHashRateString = function(hashrate) {
  hashrate = hashrate * 100000;
  var i = -1;
  do {
    hashrate = hashrate / 1000;
    i++;
  } while (hashrate > 1000);
  var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
  hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
  return Math.floor(hashrate.toFixed(2)) + smlByteUnits[i];
};

this.getReadableHashRateString = function(hashrate) {
  var i = -1;
  do {
    hashrate = hashrate / 1000;
    i++;
  } while (hashrate > 1000);
  return Math.floor(hashrate.toFixed(2)) + byteUnits[i];
};

this.getReadableYeHashRate = function(hashrate) {
  hashrate = (hashrate * 100000);
  var needsRescale = false;
  if (highest < hashrate) {
    highest = hashrate;
    needsRescale = true;
  }
  var i = -1;
  do {
    hashrate = hashrate / 1000;
    i++;
  } while (hashrate > 1000);
  if (needsRescale) {
    scale = i;
  }
  var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
	hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
  return Math.floor(hashrate.toFixed(2));
};

this.getReadableHashRate = function(hashrate) {
  var needsRescale = false;
  if (highest < hashrate) {
    highest = hashrate;
    needsRescale = true;
  }
  var i = -1;
  do {
    hashrate = hashrate / 1000;
    i++;
  } while (hashrate > 1000);
  if (needsRescale) {
    scale = i;
  }
  return Math.floor(hashrate.toFixed(2));
};

function buildChartData() {

  var pool = {
    hashrate: [],
    workers: [],
    blocks: []
  };

  for (var i = 0; i < statData.length; i++) {
    var time = statData[i].time * 1000;
    if (poolName in statData[i].pools) {
      var hash;
      if(poolName.startsWith('wavi')){ //TODO Make this not so hackish
        hash = getReadableYeHashRate(statData[i].pools[poolName].hashrate);
        usingSmallScale = true;
      } else {
        hash = getReadableHashRate(statData[i].pools[poolName].hashrate);
        usingSmallScale = false;
      }
      pool.hashrate.push([time, hash]);
      pool.workers.push([time, statData[i].pools[poolName].workerCount]);
      pool.blocks.push([time, statData[i].pools[poolName].blocks.pending])
    } else {
      pool.hashrate.push([time, 0]);
      pool.workers.push([time, 0]);
      pool.blocks.push([time, 0])
    }
  }
  //correct hashrate if needed
  if(usingSmallScale){
    $("#poolHashRate").text(pool.hashrate[pool.hashrate.length - 1][1] + ' ' + (usingSmallScale ? smlByteUnits[scale] : byteUnits[scale]));
  }

  hashChartData = {
    labels: pool.hashrate.map(x => x[0]),
    series: pool.hashrate.map(x => x[1])
  };
  var avg = calculateExpMovingAvg(pool.hashrate, 30);
  if(Math.max.apply(null, avg.map(x => x[1])) > 0){
    for(i in pool.hashrate){
      if((Math.abs(pool.hashrate[i][1] - avg[i][1]) / avg[i][1]) > 1){
        var adj = i > 0 ? i - 1 : i < pool.hashrate.length ? i + 1 : i;
        pool.hashrate[i][1] = pool.hashrate[adj][1];
      }
    }
  }
  poolHashrateData = [{
      key: 'Real',
      values: pool.hashrate
    },
    {
      key: 'Moving Average',
      values: calculateExpMovingAvg(pool.hashrate, 30)
    }
  ];
  poolBlockData = [{
    key: poolName,
    values: pool.blocks
  }];
  poolWorkerData = [{
    key: 'Workers',
    values: pool.workers
  },
  {
    key: 'Moving Average',
    values: calculateExpMovingAvg(pool.workers, 30)
  }];
}

function timeOfDayFormat(timestamp) {
  var dStr = d3.time.format('%I:%M %p')(new Date(timestamp));
  if (dStr.indexOf('0') === 0) dStr = dStr.slice(1);
  return dStr;
}

function displayCharts() {
  poolHashrateChart = createDefaultLineChart(
    document.getElementById("poolHashChart").getContext('2d'),
    [{
        label: 'Actual',
        fill: false,
        data: poolHashrateData[0].values.map(x => {
          return {
            t: x[0],
            y: x[1]
          }
        }),
        borderWidth: 2,
        backgroundColor: '#348EA9',
        borderColor: '#348EA9'
      },
      {
        label: 'Moving Average',
        fill: false,
        data: poolHashrateData[1].values.map(x => {
          return {
            t: x[0],
            y: x[1]
          }
        }),
        borderWidth: 2,
        backgroundColor: '#E81D62',
        borderColor: '#E81D62'
    }],
    'Time',
    usingSmallScale ? smlByteUnits[scale] : byteUnits[scale]
  );
  poolWorkerChart = createLineChart(
    document.getElementById("poolWorkerChart").getContext('2d'),
    [{
        label: 'Actual',
        fill: false,
        data: poolWorkerData[0].values.map(x => {
          return {
            t: x[0],
            y: x[1]
          }
        }),
        borderWidth: 2,
        backgroundColor: '#0061B5',
        borderColor: '#0061B5'
      },
      {
        label: 'Moving Average',
        fill: false,
        data: poolWorkerData[1].values.map(x => {
          return {
            t: x[0],
            y: x[1]
          }
        }),
        borderWidth: 2,
        backgroundColor: '#FF9400',
        borderColor: '#FF9400'
    }],
    'Time',
    'Workers',
    {
      beginAtZero: true,
      fixedStepSize: 1
    }
  );
  poolBlockChart = createLineChart(
    document.getElementById("blockChart").getContext('2d'),
    [{
        label: 'Currently Pending',
        fill: true,
        steppedLine: true,
        data: poolBlockData[0].values.map(x => {
          return {
            t: x[0],
            y: x[1]
          }
        }),
        borderWidth: 1,
        backgroundColor: '#FBA41F',
        borderColor: '#FBA41F'
    }],
    'Time',
    'Blocks',
    {
      beginAtZero: true,
      fixedStepSize: 1
    }
  );
  /*
  nv.addGraph(function() {
      poolHashrateChart = nv.models.lineChart()
          .margin({left: 60, right: 40})
          .x(function(d){ return d[0] })
          .y(function(d){ return d[1] })
          .useInteractiveGuideline(true);

      poolHashrateChart.xAxis.tickFormat(timeOfDayFormat);

      poolHashrateChart.yAxis.tickFormat(function(d){
          return d + " " + byteUnits[scale];
      });

      d3.select('#poolHashChart')
      .datum(poolHashrateData)
      .transition().duration(500)
      .call(poolHashrateChart);

      return poolHashrateChart;
  });

  nv.addGraph(function() {
    poolBlockChart = nv.models.multiBarChart()
      .x(function(d) {
        return d[0]
      })
      .y(function(d) {
        return d[1]
      });

    poolBlockChart.xAxis.tickFormat(timeOfDayFormat);

    poolBlockChart.yAxis.tickFormat(d3.format('d'));

    d3.select('#blockChart')
      .datum(poolBlockData)
      .transition().duration(500)
      .call(poolBlockChart);

    return poolBlockChart;
  });
    */
}

function createDefaultLineChart(ctx, datasets, xLabel, yLabel) {
  return createLineChart(ctx, datasets, xLabel, yLabel, { beginAtZero: true });
}

function createLineChart(ctx, datasets, xLabel, yLabel, ticks) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      datasets: datasets
    },
    options: {
      animation: {
          easing: 'easeInExpo',
          duration: 1000,
          xAxis: true,
          yAxis: true,
      },
      responsive: true,
      maintainAspectRatio: false,
      elements: {
        point: { radius: 0 }
      },
      scales: {
        xAxes: [{
          type: 'time'
        }],
        yAxes: [{
          ticks: ticks,
          display: true,
          scaleLabel: {
            display: true,
            labelString: yLabel
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

$.getJSON('/api/pool_stats?' + poolName, function(data) {
  statData = data;
  buildChartData();
  displayCharts();
});

statsSource.addEventListener('message', function(e) {
  var stats = JSON.parse(e.data);
  console.log(stats);
  statData.push(stats);
  if (!poolHashrateData || !poolHashrateChart || !poolBlockData || !poolBlockChart) {
    buildChartData();
    displayCharts();
  } else {
    var hash;
    if(poolName in stats.pools && stats.pools[poolName].algorithm.startsWith('yescrypt')){
      hash = poolName in stats.pools ? getReadableYeHashRate(stats.pools[poolName].hashrate) : 0;
      usingSmallScale = true;
    } else {
      hash = poolName in stats.pools ? getReadableHashRate(stats.pools[poolName].hashrate) : 0;
      usingSmallScale = false;
    }
    $("#validShares").text(poolName in stats.pools ? stats.pools[poolName].poolStats.validShares : 0);
    $("#poolHashRate").text(hash + ' ' + (usingSmallScale ? smlByteUnits[scale] : byteUnits[scale]));
    $("#poolWorkers").text(poolName in stats.pools ? stats.pools[poolName].workerCount : 0);
    $("#pendingBlocks").text(poolName in stats.pools ? stats.pools[poolName].blocks.pending : 0);
    $("#confirmedBlocks").text(poolName in stats.pools ? stats.pools[poolName].blocks.confirmed : 0);
    var time = stats.time * 1000;
    poolHashrateData[0].values.shift();
    poolHashrateData[0].values.push([time, hash]);
    var avg = calculateExpMovingAvg(poolHashrateData[0].values, 30);
    addChartData(poolHashrateChart, poolHashrateChart.data.datasets[0], {t: time, y: hash}, false);
    addChartData(poolHashrateChart, poolHashrateChart.data.datasets[1], {t: time, y: avg[avg.length - 1][1]}, true);
    addChartData(poolBlockChart, poolBlockChart.data.datasets[0], {t: time, y: poolName in stats.pools ? stats.pools[poolName].blocks.pending : 0}, true);
  }
});
