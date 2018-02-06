var fs = require('fs');

var redis = require('redis');
var async = require('async');

var Stratum = require('stratum-pool');
var util = require('stratum-pool/lib/util.js');


const BigNumber = require('bignumber.js');

const newLogger = require('./logger.js').getLogger('PaymentProcessor');


module.exports = function (logger) {

    newLogger.info("Payment processor worker started");
    var poolConfigs = JSON.parse(process.env.pools);

    var enabledPools = [];

    Object.keys(poolConfigs).forEach(function (coin) {
        var poolOptions = poolConfigs[coin];
        if (poolOptions.paymentProcessing &&
            poolOptions.paymentProcessing.enabled) {
            enabledPools.push(coin);
            newLogger.info("Enabled %s for payment processing", coin)
        }
    });

    async.filter(enabledPools, function (coin, callback) {
        SetupForPool(logger, poolConfigs[coin], function (setupResults) {
            newLogger.debug("Processing processor initialized. Setup results %s", setupResults);
            callback(null, setupResults);
        });
    }, function (err, coins) {
        if (err) {
            newLogger.error('Error processing enabled pools in the config') // TODO: ASYNC LIB was updated, need to report a better error
        } else {
            coins.forEach(function (coin) {

                var poolOptions = poolConfigs[coin];
                var processingConfig = poolOptions.paymentProcessing;
                var logSystem = 'Payments';
                var logComponent = coin;

                logger.debug(logSystem, logComponent, 'Payment processing setup to run every '
                    + processingConfig.paymentInterval + ' second(s) with daemon ('
                    + processingConfig.daemon.user + '@' + processingConfig.daemon.host + ':' + processingConfig.daemon.port
                    + ') and redis (' + poolOptions.redis.host + ':' + poolOptions.redis.port + ')');

            });
        }
    });
};


function SetupForPool(logger, poolOptions, setupFinished) {


    var coin = poolOptions.coin.name;
    var processingConfig = poolOptions.paymentProcessing;

    var logSystem = 'Payments';
    var logComponent = coin;

    var daemon = new Stratum.daemon.interface([processingConfig.daemon], function (severity, message) {
        logger[severity](logSystem, logComponent, message);
    });
    var redisClient = redis.createClient(poolOptions.redis.port, poolOptions.redis.host);

    var minPaymentSatoshis;

    const satoshisInBtc = new BigNumber(100000000);
    const coinPrecision = 8;
    var paymentInterval;

    newLogger.debug('Validating address and balance');

    async.parallel([
        function (callback) {
            daemon.cmd('validateaddress', [poolOptions.address], function (result) {
                newLogger.silly('Validated %s address with result %s', poolOptions.address, result);
                if (result.error) {
                    logger.error(logSystem, logComponent, 'Error with payment processing daemon ' + JSON.stringify(result.error));
                    callback(true);
                }
                else if (!result.response || !result.response.ismine) {
                    logger.error(logSystem, logComponent,
                        'Daemon does not own pool address - payment processing can not be done with this daemon, '
                        + JSON.stringify(result.response));
                    callback(true);
                }
                else {
                    callback()
                }
            }, true);
        },
        function (callback) {
            daemon.cmd('getbalance', [], function (result) {
                var wasICaught = false;
                if (result.error) {
                    callback(true);
                    return;
                }
                try {
                    let minimumPayment = new BigNumber(processingConfig.minimumPayment);
                    newLogger.silly('minimumPayment = %s', minimumPayment.toString(10));
                    minPaymentSatoshis = minimumPayment.multipliedBy(satoshisInBtc);
                }
                catch (e) {
                    console.log(e);
                    logger.error(logSystem, logComponent, 'Error detecting number of satoshis in a coin, cannot do payment processing. Tried parsing: ' + result.data);
                    wasICaught = true;
                }
                finally {
                    if (wasICaught) {
                        callback(true);
                    } else {
                        callback();
                    }
                }

            }, true, true);
        }
    ], function (err) {
        if (err) {
            setupFinished(false);
            return;
        }
        paymentInterval = setInterval(function () {
            try {
                processPayments();
            } catch (e) {
                throw e;
            }
        }, processingConfig.paymentInterval * 1000);
        setTimeout(processPayments, 100);
        setupFinished(true);
    });


    var satoshisToCoins = function (satoshis) {
        return satoshis.dividedBy(satoshisInBtc);
    };

    var coinsToSatoshies = function (coins) {
        return coins.multipliedBy(coinPrecision);
    };

    /* Deal with numbers in smallest possible units (satoshis) as much as possible. This greatly helps with accuracy
       when rounding and whatnot. When we are storing numbers for only humans to see, store in whole coin units. */

    var processPayments = function () {

        var startPaymentProcess = Date.now();

        var timeSpentRPC = 0;
        var timeSpentRedis = 0;

        var startTimeRedis;
        var startTimeRPC;

        var startRedisTimer = function () {
            startTimeRedis = Date.now()
        };
        var endRedisTimer = function () {
            timeSpentRedis += Date.now() - startTimeRedis
        };

        var startRPCTimer = function () {
            startTimeRPC = Date.now();
        };
        var endRPCTimer = function () {
            timeSpentRPC += Date.now() - startTimeRedis
        };

        async.waterfall([

            /* Call redis to get an array of rounds - which are coinbase transactions and block heights from submitted
               blocks. */
            function (callback) {

                startRedisTimer();
                redisClient.multi([
                    ['hgetall', coin + ':balances'],
                    ['smembers', coin + ':blocksPending']
                ]).exec(function (error, results) {
                    endRedisTimer();

                    if (error) {
                        logger.error(logSystem, logComponent, 'Could not get blocks from redis ' + JSON.stringify(error));
                        callback(true);
                        return;
                    }



                    var workers = {};
                    for (var w in results[0]) {
                        workers[w] = { balance: coinsToSatoshies(new BigNumber(results[0][w]))};
                    }

                    var rounds = results[1].map(function (r) {
                        var details = r.split(':');
                        return {
                            blockHash: details[0],
                            txHash: details[1],
                            height: details[2],
                            serialized: r
                        };
                    });

                    callback(null, workers, rounds);
                });
            },

            /* Does a batch rpc call to daemon with all the transaction hashes to see if they are confirmed yet.
               It also adds the block reward amount to the round object - which the daemon gives also gives us. */
            function (workers, rounds, callback) {

                var batchRPCcommand = rounds.map(function (r) {
                    return ['gettransaction', [r.txHash]];
                });

                batchRPCcommand.push(['getaccount', [poolOptions.address]]);

                startRPCTimer();
                daemon.batchCmd(batchRPCcommand, function (error, txDetails) {
                    endRPCTimer();

                    if (error || !txDetails) {
                        logger.error(logSystem, logComponent, 'Check finished - daemon rpc error with batch gettransactions '
                            + JSON.stringify(error));
                        callback(true);
                        return;
                    }

                    var addressAccount;

                    txDetails.forEach(function (tx, i) {

                        if (i === txDetails.length - 1) {
                            addressAccount = tx.result;
                            return;
                        }

                        var round = rounds[i];

                        if (tx.error && tx.error.code === -5) {
                            logger.warning(logSystem, logComponent, 'Daemon reports invalid transaction: ' + round.txHash);
                            round.category = 'kicked';
                            return;
                        }
                        else if (!tx.result.details || (tx.result.details && tx.result.details.length === 0)) {
                            logger.warning(logSystem, logComponent, 'Daemon reports no details for transaction: ' + round.txHash);
                            round.category = 'kicked';
                            return;
                        }
                        else if (tx.error || !tx.result) {
                            logger.error(logSystem, logComponent, 'Odd error with gettransaction ' + round.txHash + ' '
                                + JSON.stringify(tx));
                            return;
                        }

                        var generationTx = tx.result.details.filter(function (tx) {
                            return tx.address === poolOptions.address;
                        })[0];


                        if (!generationTx && tx.result.details.length === 1) {
                            generationTx = tx.result.details[0];
                        }

                        if (!generationTx) {
                            logger.error(logSystem, logComponent, 'Missing output details to pool address for transaction '
                                + round.txHash);
                            return;
                        }

                        round.category = generationTx.category;
                        if (round.category === 'generate') {
                            round.reward = generationTx.amount || generationTx.value;
                        }

                    });

                    var canDeleteShares = function (r) {
                        for (var i = 0; i < rounds.length; i++) {
                            var compareR = rounds[i];
                            if ((compareR.height === r.height)
                                && (compareR.category !== 'kicked')
                                && (compareR.category !== 'orphan')
                                && (compareR.serialized !== r.serialized)) {
                                return false;
                            }
                        }
                        return true;
                    };


                    //Filter out all rounds that are immature (not confirmed or orphaned yet)
                    rounds = rounds.filter(function (r) {
                        switch (r.category) {
                            case 'orphan':
                            case 'kicked':
                                r.canDeleteShares = canDeleteShares(r);
                            case 'generate':
                                return true;
                            default:
                                return false;
                        }
                    });


                    callback(null, workers, rounds, addressAccount);

                });
            },


            /* Does a batch redis call to get shares contributed to each round. Then calculates the reward
               amount owned to each miner for each round. */
            function (workers, rounds, addressAccount, callback) {
                var shareLookups = rounds.map(function (r) {
                    return ['hgetall', coin + ':shares:round' + r.height]
                });

                newLogger.silly('Calling redis for %s', shareLookups);

                startRedisTimer();
                redisClient.multi(shareLookups).exec(function (error, allWorkerShares) {
                    endRedisTimer();
                    newLogger.silly('Response from redis allWorkerShares = %s', JSON.stringify(allWorkerShares));
                    if (error) {
                        callback('Check finished - redis error with multi get rounds share');
                        return;
                    }

                    newLogger.silly('allWorkerShares before merging %s', JSON.stringify(allWorkerShares));

                    // This snippet will parse all workers and merge different workers into 1 payout address
                    allWorkerShares = allWorkerShares.map((roundShare) => {
                        let resultForRound = {};

                        Object.keys(roundShare).forEach((workerStr) => {
                            //test workername is not null (those may be if miner mine on stratum without user and worker)
                            if (workerStr) {
                                if (workerStr.indexOf(".") !== -1) {
                                    //we have address and worker
                                    let workerInfo = workerStr.split('.');
                                    if (workerInfo.length === 2) {
                                        //todo validate by daemon
                                        let address = workerInfo[0];
                                        if (resultForRound[address]) {
                                            resultForRound[address] = resultForRound[address].plus(roundShare[workerStr]);
                                        } else {
                                            resultForRound[address] = new BigNumber(roundShare[workerStr]);

                                        }
                                    }
                                } else {
                                    //todo validate by daemon
                                    let address = workerStr;
                                    if (resultForRound[address]) {
                                        resultForRound[address] = resultForRound[address].plus(roundShare[workerStr]);
                                    } else {
                                        resultForRound[address] = new BigNumber(roundShare[workerStr]);
                                    }
                                }
                            } else {
                                logger.error(logSystem, logComponent, 'Warning! We have anonymous shares, null worker');
                            }
                        });
                        return resultForRound;
                    });

                    newLogger.debug('Merged workers into payout address');
                    newLogger.silly('allWorkerShares after merging %s', JSON.stringify(allWorkerShares));


                    rounds.forEach(function (round, i) {
                        newLogger.silly('iterating round #%s from allWorkerShares', i);
                        newLogger.silly('round = %s', JSON.stringify(round));

                        var workerSharesForRound = allWorkerShares[i];
                        newLogger.silly('workerSharesForRound = %s', JSON.stringify(workerSharesForRound));
                        if (!workerSharesForRound) {
                            logger.error(logSystem, logComponent, 'No worker shares for round: '
                                + round.height + ' blockHash: ' + round.blockHash);
                            return;
                        }

                        switch (round.category) {
                            case 'kicked':
                            case 'orphan':
                                round.workerShares = workerSharesForRound;
                                break;

                            case 'generate':
                                /* We found a confirmed block! Now get the reward for it and calculate how much
                                   we owe each miner based on the shares they submitted during that block round. */
                                newLogger.info("We have found confirmed block #%s ready for payout", round.height);
                                newLogger.silly("round.reward = %s", round.reward);
                                var reward = new BigNumber(round.reward).multipliedBy(satoshisInBtc);
                                newLogger.silly("reward = %s", reward.toString(10));

                                var totalShares = Object.keys(workerSharesForRound).reduce(function (p, c) {
                                    if (p === 0) {
                                        p = new BigNumber(0)
                                    }
                                    return p.plus(workerSharesForRound[c])
                                }, 0);
                                newLogger.silly('totalShares = %s', totalShares.toString(10));

                                Object.keys(workerSharesForRound).forEach((workerAddress) => {
                                    newLogger.debug("Calculating reward for workerAddress %s", workerAddress);
                                    let percent = workerSharesForRound[workerAddress].dividedBy(totalShares);
                                    newLogger.silly("percent = %s", percent.toString(10));
                                    let workerRewardTotal = reward.multipliedBy(percent);
                                    newLogger.silly("workerRewardTotal = %s", workerRewardTotal.toString(10));
                                    let worker = workers[workerAddress] = (workers[workerAddress] || {});
                                    newLogger.silly("worker = %s", JSON.stringify(worker));
                                    worker.reward = (worker.reward || new BigNumber(0)).plus(workerRewardTotal);
                                    newLogger.silly('worker.reward = %s', worker.reward.toString(10));
                                });

                                break;
                        }
                    });

                    callback(null, workers, rounds, addressAccount);
                });
            },


            /* Calculate if any payments are ready to be sent and trigger them sending
             Get balance different for each address and pass it along as object of latest balances such as
             {worker1: balance1, worker2, balance2}
             when deciding the sent balance, it the difference should be -1*amount they had in db,
             if not sending the balance, the differnce should be +(the amount they earned this round)
             */
            function (workers, rounds, addressAccount, callback) {
                newLogger.info("Almost ready to send funds, calculating against existing balances");
                var trySend = function (withholdPercent) {
                    newLogger.debug('Trying to send');
                    newLogger.silly('withholdPercent = %s', withholdPercent.toString(10));
                    var addressAmounts = {};
                    var totalSent = new BigNumber(0);
                    newLogger.silly('totalSent = %s', totalSent);
                    for (var w in workers) {
                        newLogger.silly('w = %s', w);
                        var worker = workers[w];
                        newLogger.silly('worker = %s', worker);
                        worker.balance = worker.balance || new BigNumber(0);
                        newLogger.silly('worker.balance = %s', worker.balance.toString(10));
                        worker.reward = worker.reward || new BigNumber(0);
                        newLogger.silly('worker.reward = %s', worker.reward.toString(10));
                        var toSend = (worker.balance.plus(worker.reward)).multipliedBy(new BigNumber(1).minus(withholdPercent));
                        newLogger.silly('toSend = %s', toSend.toString(10));
                        if (toSend.isGreaterThanOrEqualTo(minPaymentSatoshis)) {
                            newLogger.info('Worker %s have reached minimum payout threshold (%s above minimum %s)', w, toSend.toString(10), minPaymentSatoshis.dividedBy(satoshisInBtc).toString(10));
                            totalSent = totalSent.plus(toSend);
                            newLogger.silly('totalSent = %s', totalSent.toString(10));
                            var address = worker.address = (worker.address || getProperAddress(w));
                            newLogger.silly('address = %s', address);
                            worker.sent = addressAmounts[address] = satoshisToCoins(toSend);
                            newLogger.silly('worker.sent = %s', worker.sent.toString(10));
                            worker.balanceChange = BigNumber.min(worker.balance, toSend).multipliedBy(new BigNumber(-1));
                            newLogger.silly('worker.balanceChange = %s', worker.balanceChange.toString(10));
                        }
                        else {
                            newLogger.debug('Worker %s have not reached minimum payout threshold %s', minPaymentSatoshis.dividedBy(satoshisInBtc).toString(10));
                            worker.balanceChange = BigNumber.max(toSend.minus(worker.balance), new BigNumber(0));
                            newLogger.silly('worker.balanceChange = %s', worker.balanceChange.toString(10));
                            worker.sent = new BigNumber(0);
                            newLogger.silly('worker.sent = %s', worker.sent.toString(10));
                        }
                    }

                    if (Object.keys(addressAmounts).length === 0) {
                        newLogger.info('No workers was chosen for paying out');
                        callback(null, workers, rounds);
                        return;
                    }

                    newLogger.info('Final result for payments to miners: %s', JSON.stringify(addressAmounts))
     /*               daemon.cmd('sendmany', [addressAccount || '', addressAmounts], function (result) {
                        //Check if payments failed because wallet doesn't have enough coins to pay for tx fees
                        if (result.error && result.error.code === -6) {
                            var higherPercent = withholdPercent.plus(new BigNumber(0.01));
                            logger.warning(logSystem, logComponent, 'Not enough funds to cover the tx fees for sending out payments, decreasing rewards by '
                                + (higherPercent.multipliedBy(new BigNumber(100)).toNumber()) + '% and retrying');
                            trySend(higherPercent);
                        }
                        else if (result.error) {
                            logger.error(logSystem, logComponent, 'Error trying to send payments with RPC sendmany '
                                + JSON.stringify(result.error));
                            callback(true);
                        }
                        else {
                            logger.debug(logSystem, logComponent, 'Sent out a total of ' + (totalSent.dividedBy(satoshisInBtc))
                                + ' to ' + Object.keys(addressAmounts).length + ' workers');
                            if (withholdPercent.isGreaterThan(new BigNumber(0))) {
                                logger.warning(logSystem, logComponent, 'Had to withhold ' + (withholdPercent * new BigNumber(100)).toNumber()
                                    + '% of reward from miners to cover transaction fees. '
                                    + 'Fund pool wallet with coins to prevent this from happening');
                            }
                            callback(null, workers, rounds);
                        }
                    }, true, true);*/
                };
                trySend(new BigNumber(0));

            },
            function (workers, rounds, callback) {

                var totalPaid = new BigNumber(0);

                var balanceUpdateCommands = [];
                var workerPayoutsCommand = [];

                for (var w in workers) {
                    var worker = workers[w];
                    if (!worker.balanceChange.eq(new BigNumber(0))) {
                        balanceUpdateCommands.push([
                            'hincrbyfloat',
                            coin + ':balances',
                            w,
                            satoshisToCoins(worker.balanceChange).toFixed(coinPrecision)
                        ]);
                    }
                    if (worker.sent !== 0) {
                        workerPayoutsCommand.push(['hincrbyfloat', coin + ':payouts', w, worker.sent]);
                        totalPaid = totalPaid.plus(worker.sent);
                    }
                }


                var movePendingCommands = [];
                var roundsToDelete = [];
                var orphanMergeCommands = [];

                var moveSharesToCurrent = function (r) {
                    var workerShares = r.workerShares;
                    Object.keys(workerShares).forEach(function (worker) {
                        orphanMergeCommands.push(['hincrby', coin + ':shares:roundCurrent',
                            worker, workerShares[worker].toFixed(coinPrecision)]);
                    });
                };

                rounds.forEach(function (r) {

                    switch (r.category) {
                        case 'kicked':
                            movePendingCommands.push(['smove', coin + ':blocksPending', coin + ':blocksKicked', r.serialized]);
                        case 'orphan':
                            movePendingCommands.push(['smove', coin + ':blocksPending', coin + ':blocksOrphaned', r.serialized]);
                            if (r.canDeleteShares) {
                                moveSharesToCurrent(r);
                                roundsToDelete.push(coin + ':shares:round' + r.height);
                            }
                            return;
                        case 'generate':
                            movePendingCommands.push(['smove', coin + ':blocksPending', coin + ':blocksConfirmed', r.serialized]);
                            roundsToDelete.push(coin + ':shares:round' + r.height);
                            return;
                    }

                });

                var finalRedisCommands = [];

                if (movePendingCommands.length > 0)
                    finalRedisCommands = finalRedisCommands.concat(movePendingCommands);

                if (orphanMergeCommands.length > 0)
                    finalRedisCommands = finalRedisCommands.concat(orphanMergeCommands);

                if (balanceUpdateCommands.length > 0)
                    finalRedisCommands = finalRedisCommands.concat(balanceUpdateCommands);

                if (workerPayoutsCommand.length > 0)
                    finalRedisCommands = finalRedisCommands.concat(workerPayoutsCommand);

                if (roundsToDelete.length > 0)
                    finalRedisCommands.push(['del'].concat(roundsToDelete));

                if (!totalPaid.eq(new BigNumber(0)))
                    finalRedisCommands.push(['hincrbyfloat', coin + ':stats', 'totalPaid', totalPaid.toFixed(coinPrecision)]);

                if (finalRedisCommands.length === 0) {
                    callback();
                    return;
                }

                startRedisTimer();
                redisClient.multi(finalRedisCommands).exec(function (error, results) {
                    endRedisTimer();
                    if (error) {
                        clearInterval(paymentInterval);
                        logger.error(logSystem, logComponent,
                            'Payments sent but could not update redis. ' + JSON.stringify(error)
                            + ' Disabling payment processing to prevent possible double-payouts. The redis commands in '
                            + coin + '_finalRedisCommands.txt must be ran manually');
                        fs.writeFile(coin + '_finalRedisCommands.txt', JSON.stringify(finalRedisCommands), function (err) {
                            logger.error('Could not write finalRedisCommands.txt, you are fucked.');
                        });
                    }
                    callback();
                });
            }

        ], function () {


            var paymentProcessTime = Date.now() - startPaymentProcess;
            logger.debug(logSystem, logComponent, 'Finished interval - time spent: '
                + paymentProcessTime + 'ms total, ' + timeSpentRedis + 'ms redis, '
                + timeSpentRPC + 'ms daemon RPC');

        });
    };


    var getProperAddress = function (address) {
        if (address.length === 40) {
            return util.addressFromEx(poolOptions.address, address);
        }
        else return address;
    };


}