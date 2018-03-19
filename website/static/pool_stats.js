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

var highest = 0;
var scale = 0;

var byteUnits = [' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];

this.getReadableHashRateString = function(hashrate) {
  var i = -1;
  do {
    hashrate = hashrate / 1000;
    i++;
  } while (hashrate > 1000);
  return Math.floor(hashrate.toFixed(2)) + byteUnits[i];
};

this.getReadableHashRate = function(hashrate) {
  var needsRescale = false;
  if(highest < hashrate){
    highest = hashrate;
    needsRescale = true;
  }
  var i = -1;
  do {
    hashrate = hashrate / 1000;
    i++;
  } while (hashrate > 1000);
  if(needsRescale) {
    scale = i;
  }
  return Math.floor(hashrate.toFixed(2));
};

this.getReadableHashRateString = function(hashrate) {
  var i = -1;
  do {
    hashrate = hashrate / 1000;
    i++;
  } while (hashrate > 1000);
  return Math.floor(hashrate.toFixed(2)) + byteUnits[i];
};

function buildChartData(){

    var pool = {
        hashrate: [],
        workers: [],
        blocks: []
    };

    for (var i = 0; i < statData.length; i++){
        var time = statData[i].time * 1000;
        if (poolName in statData[i].pools){
            pool.hashrate.push([time, getReadableHashRate(statData[i].pools[poolName].hashrate)]);
            pool.workers.push([time, statData[i].pools[poolName].workerCount]);
            pool.blocks.push([time, statData[i].pools[poolName].blocks.pending])
        } else{
            pool.hashrate.push([time, 0]);
            pool.workers.push([time, 0]);
            pool.blocks.push([time, 0])
        }
    }

    poolWorkerData = [];
    poolHashrateData = [{
        key: 'Real',
        values: pool.hashrate
    },
    {
        key: 'Moving Average',
        values: calculateExpMovingAvg(pool.hashrate, 30)
    }];
    poolBlockData = [{
        key: poolName,
        values: pool.blocks
    }];
    poolWorkerData.push({
        key: poolName,
        values: pool.workers
    });
}

function timeOfDayFormat(timestamp) {
  var dStr = d3.time.format('%I:%M %p')(new Date(timestamp));
  if (dStr.indexOf('0') === 0) dStr = dStr.slice(1);
  return dStr;
}

function updateCharts(){

  nv.addGraph(function() {
      poolHashrateChart = nv.models.lineChart()
          .margin({left: 60, right: 40})
          .x(function(d){ return d[0] })
          .y(function(d){ return d[1] })
          .useInteractiveGuideline(true);

      poolHashrateChart.xAxis.tickFormat(timeOfDayFormat);

      poolHashrateChart.yAxis.tickFormat(function(d){
          return getReadableHashRateString(d);
      });

      d3.select('#poolHashChart').datum(poolHashrateData).call(poolHashrateChart);

      return poolHashrateChart;
  });

  nv.addGraph(function() {
      poolBlockChart = nv.models.multiBarChart()
          .x(function(d){ return d[0] })
          .y(function(d){ return d[1] });

      poolBlockChart.xAxis.tickFormat(timeOfDayFormat);

      poolBlockChart.yAxis.tickFormat(d3.format('d'));

      d3.select('#blockChart').datum(poolBlockData).call(poolBlockChart);

      return poolBlockChart;
  });
}

function displayCharts(){

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
          .x(function(d){ return d[0] })
          .y(function(d){ return d[1] });

      poolBlockChart.xAxis.tickFormat(timeOfDayFormat);

      poolBlockChart.yAxis.tickFormat(d3.format('d'));

      d3.select('#blockChart')
      .datum(poolBlockData)
      .transition().duration(500)
      .call(poolBlockChart);

      return poolBlockChart;
  });
}

nv.utils.windowResize(triggerChartUpdates);

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

function triggerChartUpdates() {
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
  if (!poolHashrateData || !poolHashrateChart || !poolBlockData || !poolBlockChart) {
    buildChartData();
    displayCharts();
  } else {
    $("#validShares").text(poolName in stats.pools ? stats.pools[poolName].poolStats.validShares : 0);
    $("#poolHashRate").text(poolName in stats.pools ? stats.pools[poolName].hashrateString : '0.00H/s');
    $("#poolWorkers").text(poolName in stats.pools ? stats.pools[poolName].workerCount : 0);
    $("#pendingBlocks").text(poolName in stats.pools ? stats.pools[poolName].blocks.pending : 0);
    $("#confirmedBlocks").text(poolName in stats.pools ? stats.pools[poolName].blocks.confirmed : 0);
    var time = stats.time * 1000;
    poolHashrateData[0].values.shift();
    poolHashrateData[0].values.push([time, poolName in stats.pools ? getReadableHashRate(stats.pools[poolName].hashrate) : 0]);
    poolHashrateData[1].values.shift();
    var avg = calculateExpMovingAvg(poolHashrateData[0].values, 30);
    poolHashrateData[1].values.push([time, avg[avg.length - 1]]);
    poolBlockData[0].values.shift();
    poolBlockData[0].values.push([time, poolName in stats.pools ? stats.pools[poolName].blocks.pending : 0]);
    triggerChartUpdates();
  }
});
