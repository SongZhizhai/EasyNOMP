var workerHashrateData;
var workerValidShareData;
var workerInvalidShareData;
var workerHashrateChart;
var workerHistoryMax = 160;
var workerHashRate = 0;
var names = {};

var statData;
var poolData;
var poolShares = 0;
var invalidShares = 0;
var poolWorkers = 0;
var poolHashRate = 0;
var totalHash;
var totalImmature;
var totalBal;
var totalPaid;
var totalShares;
var alerted = false;
var shareGage;
var invalidGage;
var workerGage;
var hashGage;

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

function getWorkerNameFromAddress(w) {
  var worker = w;
  if (w.split(".").length > 1) {
    worker = w.split(".")[1];
    if (worker == null || worker.length < 1) {
      worker = generateName();
			alertRandomName();
    }
  } else {
    worker = generateName();
		alertRandomName();
  }
	if(!names[w]){
		names[w] = worker;
	}
  return worker;
}

function alertRandomName() {
	if(!alerted){
		$('#alertBox').append('<div class="alert alert-info" role="alert">No Worker(s) Name Given, So We Assigned Random Ones!</div>');
		alerted = true;
	}
}

function buildChartData() {
  var workers = {};
  for (var w in statData.history) {
		var history = statData.history[w];
    var worker = getWorkerNameFromAddress(w);
    var a = workers[worker] = (workers[worker] || {
      hashrate: [],
      validShares: 0,
      invalidShares: 0
    });
    for (var wh in statData.history[w]) {
      var hash = statData.history[w][wh].hashrate;
      a.hashrate.push([statData.history[w][wh].time * 1000, usingSmallScale ? getReadableYeHashRate(hash) : getReadableHashRate(hash)]);
    }
    if (a.hashrate.length > workerHistoryMax) {
      workerHistoryMax = a.hashrate.length;
    }
  }

  var i = 0;
  workerHashrateData = [];
  for (var worker in workers) {
    workerHashrateData.push({
      key: worker,
      disabled: (i > Math.min((_workerCount - 1), 3)),
      values: workers[worker].hashrate
    });
  }
}

function hashrateScaleFactor(hashrate) {
  var i = 0;
  do {
    hashrate = hashrate / 1024;
    i++;
  } while (hashrate > 1024);
  return i;
}

function displayCharts() {
  shareGage = new JustGage({
    id: "gauge",
    value: Math.min(poolShares, 100),
    min: 0,
    max: 100,
    symbol: '%',
    pointer: true,
    pointerOptions: {
      toplength: -15,
      bottomlength: 10,
      bottomwidth: 12,
      color: '#8e8e93',
      stroke: '#ffffff',
      stroke_width: 3,
      stroke_linecap: 'round'
    },
    title: "Estimated Shares This Round",
    gaugeWidthScale: 0.6,
    levelColors:["#e8e84c", "#6cdb5e"]
  });
  invalidGage = new JustGage({
    id: "validShare",
    value: Math.min(invalidShares, 100),
    min: 0,
    max: 100,
    symbol: '%',
    pointer: true,
    pointerOptions: {
      toplength: -15,
      bottomlength: 10,
      bottomwidth: 12,
      color: '#8e8e93',
      stroke: '#ffffff',
      stroke_width: 3,
      stroke_linecap: 'round'
    },
    title: "Recent Invalid Shares",
    gaugeWidthScale: 0.6,
    levelColors:["#e8e84c", "#f73d3d"]
  });
  workerGage= new JustGage({
    id: "workerDominance",
    value: workerHashrateData.length,
    min: 0,
    max: poolWorkers,
    pointer: true,
    pointerOptions: {
      toplength: -15,
      bottomlength: 10,
      bottomwidth: 12,
      color: '#8e8e93',
      stroke: '#ffffff',
      stroke_width: 3,
      stroke_linecap: 'round'
    },
    title: "Worker Dominance",
    gaugeWidthScale: 0.6,
    levelColors:["#e8e84c", "#6cdb5e"]
  });
  var high = 0;
  console.log(poolData);
  hashGage = new JustGage({
    id: "hashDominance",
    value: usingSmallScale ? getReadableYeHashRate(workerHashRate) : getReadableHashRate(workerHashRate),
    min: 0,
    max: usingSmallScale ? getReadableYeHashRate(poolHashRate) : getReadableHashRate(poolHashRate),
    symbol: usingSmallScale ? smlByteUnits[scale] : byteUnits[scale],
    title: "Hashrate Dominance",
    levelColors:["#e8e84c", "#6cdb5e"],
    pointer: true,
    pointerOptions: {
      toplength: -15,
      bottomlength: 10,
      bottomwidth: 12,
      color: '#8e8e93',
      stroke: '#ffffff',
      stroke_width: 3,
      stroke_linecap: 'round'
    },
    gaugeWidthScale: 0.6
  });

  var dataset = [];
  for(var d in workerHashrateData){
    var data = workerHashrateData[d];
    var color = getRandomColor();
    var o = {
      label: data.key,
      fill: false,
      data: data.values.map(x => {
        return {
          t: x[0],
          y: x[1]
        }
      }),
      borderWidth: 2,
      backgroundColor: color,
      borderColor: color
    };
    dataset.push(o);
  }

  workerHashrateChart = createDefaultLineChart(
    document.getElementById("workerHashChart").getContext('2d'),
    dataset,
    'Time',
    usingSmallScale ? smlByteUnits[scale] : byteUnits[scale]
  );
}

// grab initial stats
$.getJSON('/api/worker_stats?' + _miner, function(data) {
  // grab initial stats
  $.getJSON('/api/stats', function(pdata) {
    for(var p in pdata.pools){
      for(var w in pdata.pools[p].workers){
        if(w.split(".")[0] === _miner){
          usingSmallScale = pdata.pools[p].algorithm.startsWith('yescrypt');
          poolData = pdata.pools[p];
          poolShares = pdata.pools[p].workers[w].shares * 100;
          invalidShares =pdata.pools[p].workers[w].invalidshares * 100;
          if(poolWorkers === 0 || poolHashRate === 0){
              poolHashRate = pdata.pools[p].hashrate;
              workerHashRate = pdata.pools[p].workers[w].hashrate;
          } else {
              poolHashRate = (poolHashRate + pdata.pools[p].hashrate) / 2;
              workerHashRate = (pdata.pools[p].workers[w].hashrate) / 2;
          }
          poolWorkers = Object.keys(pdata.pools[p].workers).length;
          $('#total-paid-label').append(data.paid.toFixed(8) + ' ' + pdata.pools[p].symbol);
          console.log(data);
          statData = data;
          for (var w in statData.workers) {
            _workerCount++;
          }
          buildChartData();
          displayCharts();
        }
      }
    }
  });
});

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


// live stat updates
statsSource.addEventListener('message', function(e) {
  var stats = JSON.parse(e.data);
  var count = 0;
  var poolCount = 0;
  var pH = [0];
  var wH = [0];
  var shares = 0;
  var invalid = 0;
  $.getJSON('/api/stats', function(data) {
    for(var p in stats.pools){
      for(var w in stats.pools[p].workers){
        if(w.split(".")[0] === _miner){
          count++;
          console.log(stats.pools[p].workers[w]);
          shares += stats.pools[p].workers[w].shares;
          invalid += stats.pools[p].workers[w].invalidshares;
          pH.push(usingSmallScale ? getReadableYeHashRate(stats.pools[p].hashrate) : getReadableHashRate(stats.pools[p].hashrate));
          wH.push(usingSmallScale ? getReadableYeHashRate(data.pools[p].workers[w].hashrate) : getReadableHashRate(data.pools[p].workers[w].hashrate));
          for(var index in workerHashrateData){
            var time = stats.time * 1000;
            var hash;
            if(usingSmallScale){
              hash = getReadableYeHashRate(data.pools[p].workers[w].hashrate);
            } else {
              hash = getReadableHashRate(data.pools[p].workers[w].hashrate);
            }
            addChartData(workerHashrateChart, workerHashrateChart.data.datasets[index], {t: time, y: hash}, true);
          }
        }
      }
    }

    invalidGage.refresh(Math.min(invalid * 100, 100));
    shareGage.refresh(Math.min(shares * 100, 100));
    hashGage.refresh(Math.max.apply(null, wH), Math.max.apply(null, pH));
    workerGage.refresh(count);
  });
});
