var workerHashrateData;
var workerHashrateChart;
var workerHistoryMax = 160;
var names = {};

var statData;
var totalHash;
var totalImmature;
var totalBal;
var totalPaid;
var totalShares;
var alerted = false;

var byteUnits = [' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];

this.getReadableHashRateString = function(hashrate) {
  var i = -1;
  do {
    hashrate = hashrate / 1000;
    i++;
  } while (hashrate > 1000);
  return hashrate.toFixed(2) + byteUnits[i];
};

function timeOfDayFormat(timestamp) {
  var dStr = d3.time.format('%I:%M %p')(new Date(timestamp));
  if (dStr.indexOf('0') === 0) dStr = dStr.slice(1);
  return dStr;
}

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
      hashrate: []
    });
    for (var t in history) {
			var timestamp = history[t];
			var date = timestamp.time * 1000;
      a.hashrate.push({ t: date, y: timestamp.hashrate });
    }
    if (a.hashrate.length > workerHistoryMax) {
      workerHistoryMax = a.hashrate.length;
    }
  }

  var i = 0;
  workerHashrateData = [];
  for (var worker in workers) {
		var max = Math.max.apply(null, workers[worker].hashrate.map(x => x.y));
		var scale = hashrateScaleFactor(max);
		var factor = Math.pow(1024, scale);

		var normalized = [];
		for (var i in workers[worker].hashrate) {
			normalized.push({
				t: workers[worker].hashrate[i].t,
				y: workers[worker].hashrate[i].y / factor
			});
		}
    workerHashrateData.push({
      key: worker,
      disabled: (i > Math.min((_workerCount - 1), 3)),
      values: workers[worker].hashrate,
			normalized: normalized,
			speed: byteUnits[scale]
    });
    i++;
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


function updateChartData() {
  var workers = {};
  for (var w in statData.history) {
    var worker = getWorkerNameFromAddress(w);
    // get a reference to lastest workerhistory
    for (var wh in statData.history[w]) {}
    //var wh = statData.history[w][statData.history[w].length - 1];
    var foundWorker = false;
    for (var i = 0; i < workerHashrateData.length; i++) {
			var date = statData.history[w][wh].time * 1000;
      if (workerHashrateData[i].key === worker) {
        foundWorker = true;
        if (workerHashrateData[i].values.length >= workerHistoryMax) {
          workerHashrateData[i].values.shift();
					workerHashrateChart.data.datasets[i].shift();
        }
				workerHashrateData[i].values.push({ t: date, y: statData.history[w][wh].hashrate });
				workerHashrateChart.data.datasets[i].push({ t: date, y: statData.history[w][wh].hashrate });
        break;
      }
    }
    if (!foundWorker) {
      var hashrate = [];
			if(isNaN(statData.history[w][wh].time * 1000)){
				return false;
			}
      hashrate.push({ t: date, y: statData.history[w][wh].hashrate });
			var max = Math.max.apply(null, hashrate);
			var scale = hashrateScaleFactor(max);
			var factor = Math.pow(1024, scale);
			var normalized = [];
			for (var i in hashrate) {
				normalized.push({
					t: hashrate[i].t,
					y: hashrate[i].y / factor
				});
			}
      workerHashrateData.push({
        key: worker,
        values: hashrate,
				normalized: normalized,
				speed: byteUnits[scale]
      });
      rebuildWorkerDisplay();
      return true;
    }
  }
  triggerChartUpdates();
  return false;
}

function calculateAverageHashrate(worker) {
	var count = 0;
	var total = 1;
	var avg = 0;
	for (var i = 0; i < workerHashrateData.length; i++) {
		count = 0;
		for (var ii = 0; ii < workerHashrateData[i].values.length; ii++) {
			if (worker == null || workerHashrateData[i].key === worker) {
				count++;
				avg += parseFloat(workerHashrateData[i].values[ii].y);
			}
		}
		if (count > total)
			total = count;
	}
	avg = avg / total;
	return avg;
}

function triggerChartUpdates() {
  workerHashrateChart.update();
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
	/*
  var byteUnits = [' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];
  var hashIndex = 0;
  for (w in workerHashrateData) {
    var i = workerHashrateData[w].speedFactor;
    if (i > hashIndex) {
      hashIndex = i;
    }
  }
	*/
	var color = 0;
	var datasets = [];
	for (i in workerHashrateData) {
		if(color >= chartColors.length) {
			color = 0;
		}
		var worker = workerHashrateData[i];
		datasets.push({
			fill: false,
			label: worker.key,
			data: worker.normalized,
			borderColor: chartColors[color++]
		});
	}
  workerHashrateChart = new Chart($("#workerHashrate"), {
    type: 'line',
    data: {
			datasets: datasets
		},
    options: {
      responsive: true,
      elements: {
        point: {
          radius: 0
        }
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
            labelString: 'Hashrate'
          }
        }]
      }
    }
  });
}

function updateStats() {
  totalHash = statData.totalHash;
  totalPaid = statData.paid;
  totalBal = statData.balance;
  totalImmature = statData.immature;
  totalShares = statData.totalShares;
  // do some calculations
  var _blocktime = 250;
  var _networkHashRate = parseFloat(statData.networkSols) * 1.2;
  var _myHashRate = (totalHash / 1000000) * 2;
  var luckDays = ((_networkHashRate / _myHashRate * _blocktime) / (24 * 60 * 60)).toFixed(3);
  // update miner stats
  $("#statsHashrate").text(getReadableHashRateString(totalHash));
  $("#statsHashrateAvg").text(getReadableHashRateString(calculateAverageHashrate(null)));
  $("#statsLuckDays").text(luckDays);
  $("#statsTotalImmature").text(totalImmature);
  $("#statsTotalBal").text(totalBal);
  $("#statsTotalPaid").text(totalPaid);
  $("#statsTotalShares").text(totalShares.toFixed(2));
}

function updateWorkerStats() {
  // update worker stats
  var i = 0;
  for (var w in statData.workers) {
    i++;
    var htmlSafeWorkerName = names[w];
    var saneWorkerName = getWorkerNameFromAddress(w);
    $("#statsHashrate" + htmlSafeWorkerName).text(getReadableHashRateString(statData.workers[w].hashrate));
    $("#statsHashrateAvg" + htmlSafeWorkerName).text(getReadableHashRateString(calculateAverageHashrate(saneWorkerName)));
    $("#statsLuckDays" + htmlSafeWorkerName).text(statData.workers[w].luckDays);
    $("#statsPaid" + htmlSafeWorkerName).text(statData.workers[w].paid);
    $("#statsBalance" + htmlSafeWorkerName).text(statData.workers[w].balance);
    $("#statsShares" + htmlSafeWorkerName).text(Math.round(statData.workers[w].currRoundShares * 100) / 100);
    $("#statsDiff" + htmlSafeWorkerName).text(statData.workers[w].diff);
  }
}

function addWorkerToDisplay(name, htmlSafeName, workerObj) {
  var htmlToAdd = "";
  htmlToAdd = '<div class="boxStats" id="boxStatsLeft" style="float:left; margin: 9px; min-width: 260px;"><div class="boxStatsList">';
  if (htmlSafeName) {
    htmlToAdd += '<div class="boxLowerHeader">' + htmlSafeName.substr(htmlSafeName.indexOf("_") + 1, htmlSafeName.length) + '</div>';
  } else {
    htmlToAdd += '<div class="boxLowerHeader">noname</div>';
  }
  htmlToAdd += '<div><i class="fa fa-tachometer"></i> <span id="statsHashrate' + htmlSafeName + '">' + getReadableHashRateString(workerObj.hashrate) + '</span> (Now)</div>';
  htmlToAdd += '<div><i class="fa fa-tachometer"></i> <span id="statsHashrateAvg' + htmlSafeName + '">' + getReadableHashRateString(calculateAverageHashrate(name)) + '</span> (Avg)</div>';
  htmlToAdd += '<div><i class="fa fa-shield"></i> <small>Diff:</small> <span id="statsDiff' + htmlSafeName + '">' + workerObj.diff + '</span></div>';
  htmlToAdd += '<div><i class="fa fa-cog"></i> <small>Shares:</small> <span id="statsShares' + htmlSafeName + '">' + (Math.round(workerObj.currRoundShares * 100) / 100) + '</span></div>';
  htmlToAdd += '<div><i class="fa fa-gavel"></i> <small>Luck <span id="statsLuckDays' + htmlSafeName + '">' + workerObj.luckDays + '</span> Days</small></div>';
  htmlToAdd += '<div><i class="fa fa-money"></i> <small>Bal: <span id="statsBalance' + htmlSafeName + '">' + workerObj.balance + '</span></small></div>';
  htmlToAdd += '<div><i class="fa fa-money"></i> <small>Paid: <span id="statsPaid' + htmlSafeName + '">' + workerObj.paid + '</span></small></div>';
  htmlToAdd += '</div></div></div>';
  $("#boxesWorkers").html($("#boxesWorkers").html() + htmlToAdd);
}

function rebuildWorkerDisplay() {
  $("#boxesWorkers").html("");
  var i = 0;
  for (var w in statData.workers) {
    i++;
		console.log(names[w]);
    var htmlSafeWorkerName = names[w];
    var saneWorkerName = getWorkerNameFromAddress(w);
    addWorkerToDisplay(saneWorkerName, htmlSafeWorkerName, statData.workers[w]);
  }
}

// resize chart on window resize
nv.utils.windowResize(triggerChartUpdates);

// grab initial stats
$.getJSON('/api/worker_stats?' + _miner, function(data) {
  statData = data;
  for (var w in statData.workers) {
    _workerCount++;
  }
  buildChartData();
  displayCharts();
  rebuildWorkerDisplay();
  updateStats();
});

// live stat updates
statsSource.addEventListener('message', function(e) {
  // TODO, create miner_live_stats...
  // miner_live_stats will return the same josn except without the worker history
  // FOR NOW, use this to grab updated stats
  $.getJSON('/api/worker_stats?' + _miner, function(data) {
    statData = data;
    // check for missing workers
    var wc = 0;
    var rebuilt = false;
    // update worker stats
    for (var w in statData.workers) {
      wc++;
    }
    // TODO, this isn't 100% fool proof!
    if (_workerCount != wc) {
      if (_workerCount > wc) {
        rebuildWorkerDisplay();
        rebuilt = true;
      }
      _workerCount = wc;
    }
    rebuilt = (rebuilt || updateChartData());
    updateStats();
    if (!rebuilt) {
      updateWorkerStats();
    }
  });
});
