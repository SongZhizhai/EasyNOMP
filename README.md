# LeshaCat fork of BootNOMP
### [leshacat/BootNOMP:development](https://github.com/leshacat/BootNOMP/tree/development) pool is live @ [http://miningpool.easyx.info:44420/](http://miningpool.easyx.info:44420/)
#### Support in #easyx-pool channel on discord: https://discord.gg/vzcbVNW
#### Visit the EasyX Community website: http://www.easyx.info/
##### Current Version: v1.1.4

-------

## !~ PAYMENT BUG WARNING ~!
***THERE IS A KNOWN PAYMENT BUG: https://github.com/foxer666/node-open-mining-portal/issues/106*** which is being fixed within 24-48 hours. Please monitor that issue on GitHub. If you have more than 10 miners, this bug affects you. The bug is with the payment processor's batch payments when it pays more than 10-15 miners at the same time, and it fails.

***This crypto is not lost, it is still in your pool wallet.*** Once the fix is made, you can update BootNOMP and restart the pool, and the payments should then go through.

Once fixed, I will push the fix to parent project [1301313Y/BootNOMP](https://github.com/1301313Y/BootNOMP) and original project [foxer666/node-open-mining-portal](https://github.com/foxer666/node-open-mining-portal)

***Sorry for the inconvenience!***

-------
## !~ DEVELOPMENT WARNING ~!
***_While the master branch is considered stable, leshacat/BootNOMP is currently under loads of development - check out the development branch (git checkout development)_***

***NOTE:***  Someone please test Docker, I made a few quick changes. Will come back to it later! ~LeshaCat

-------

## Helping give NOMP new life, with some style!
***LeshaCat:*** _"BootNOMP gives NOMP a sleek looking new design, and fully re-designed and re-coded user interface! I saw the original dev working on BootNOMP and the source code and figured I could lend a hand. I have plans to rework the documentation, Block Explorer, Docker source, and some various configuration options. I decided a soft fork with pull requests to the original and parent projects would be best suited. But if you would like to contribute, please consider looking at the parent project [1301313Y/BootNOMP](https://github.com/1301313Y/BootNOMP) and original project [foxer666/node-open-mining-portal](https://github.com/foxer666/node-open-mining-portal) first, as these two guys are the only ones who are helping get the NOMP rebirthing process started."_

***1301313Y:*** _"BootNOMP is all the things great about NOMP, now with modern style and design of BootStrap 4! Having disliked the previous UI, due to cramping, little to no info displayed while what is displayed is not very helpful to users. I decided to fork a already great project, and add some stylistic touches it severely needs. I would of considered requesting pulls to the main branch, though with such heavy changes to the project, I decided a hard fork would be well suited. But if you would like to contribute, please consider looking at the original project [foxer666/node-open-mining-portal](https://github.com/foxer666/node-open-mining-portal) first, as these guys are the ones who helped get this NOMP rebirthing process started."_

***NOTE:*** If you want to help contribute, please look at the original project [foxer666/node-open-mining-portal](https://github.com/foxer666/node-open-mining-portal) first!<br />
***NOTE:*** If you want to help contribute, please look at the parent project [1301313Y/BootNOMP](https://github.com/1301313Y/BootNOMP) first!<br />

***NOTE:*** _You can fork this repository by clicking "fork" in the top right._

-------
## Node Open Mining Portal consists of 3 main modules:
| Project | Link |
| ------------- | ------------- |
| [BootNOMP](https://github.com/leshacat/BootNOMP.git) | https://github.com/leshacat/BootNOMP.git |
| [Stratum Pool](https://github.com/leshacat/node-stratum-pool) | https://github.com/leshacat/node-stratum-pool |
| [Node Multihashing](https://github.com/leshacat/node-multi-hashing) | https://github.com/leshacat/node-multi-hashing |

***NOTE:*** _Stratum Pool can be replaced with [node-merged-pool](https://github.com/UNOMP/node-merged-pool) - https://github.com/UNOMP/node-merged-pool._<br />
***NOTE:*** _Add new algorithms using [Node Multihashing](https://github.com/leshacat/node-multi-hashing) - https://github.com/leshacat/node-multi-hashing._

-------
## License
Released under the GNU General Public License v2
http://www.gnu.org/licenses/gpl-2.0.html

-------
## Requirements
***NOTE:*** _These requirements will be installed in the install section!_<br />
* Node Version Manager
* Node 8.1.4 or higher
* Redis Server
* Process Manager 2
* ntp
* Coin daemon(s)

-------
## Install Pool

Install instructions are in [docs/README.md](https://github.com/leshacat/BootNOMP/blob/development/docs/INSTALL.md)

-------
## Run in Docker

Docker instructions are in [docs/README.md](https://github.com/leshacat/BootNOMP/blob/development/docs/DOCKER.md)

-------
## Changelog

Changelog is in [docs/CHANGELOG.md](https://github.com/leshacat/BootNOMP/blob/development/docs/CHANGELOG.md)

-------
## Hashing algorithms
#### Working
|   | Algorithm | Comment|
| ------------- | ------------- | ------------- |
| ✓ | __C11__ | tested shares and payments with Dixicoin |
| ✓ | __Groestl__ | tested only shares with AuroraCoin, blocks not tested |
| ✓ | __lyra2rev2__ | shares work, needs tests with payments. currently being tested with Lunex coin |
| ✓ | __lyra2z__ | Working in testnet *mining* and *payouts* |
| ✓ | __NeoScrypt__ | working now thanks to @foxer666 pushing update to parent repo |
| ✓ | __Qubit__ | Shares works, and blocks should now too. |
| ✓ | __Scrypt__ | tested with AntiLiteCoin, 1CREDIT, ArgusCoin, WAYAWOLFCOIN and many others |
| ✓ | __SHA256__ | tested with VCOIN, don't use with BTC, no Segwit tested |
| ✓ | __X11__ | tested with BrainCoin, CannabisCoin, AdzCoin and many others |
| ✓ | __X16r__ | tested with RavenCoin |
| ✓ | __Yescrypt__ | needs tests, though should work |
| ✓ | __YescryptR16__ | needs tests, though should work |
| ✓ | __YescryptR32__ | currently being tested with WaviCoin. shares work, payments unconfirmed |

#### Need tests
|   | Algorithm | Comment|
| ------------- | ------------- | ------------- |
| ? | __Argon2__ | need tests |
| ? | __Blake__ | need tests |
| ? | __Blake2S__ | need tests |
| ? | __Cryptonight__ | need tests |
| ? | __Dcrypt__ | need tests |
| ? | __Decred__ | need tests |
| ? | __Fresh__ | need tests |
| ? | __Fugue__ | need tests |
| ? | __GroestlMyriad__ | need tests |
| ? | __Quark__ | need tests |
| ? | __Hefty1__ | need tests |
| ? | __Keccak__ | need tests |
| ? | __Lbry__ | need tests |
| ? | __lyra2re__ | need tests |
| ? | __lyra2re2__ | need tests |
| ? | __lyra2z330__ | need tests |
| ? | __NIST5__ | need tests |
| ? | __S3__ | need tests |
| ? | __Scrypt-N__ | need tests |
| ? | __Scrypt-OG__ | need tests |
| ? | __Sha1__ | need tests |
| ? | __SHAvite-3__ | need tests |
| ? | __Skein__ | need tests |
| ? | __X11Ghost__ | need tests |
| ? | __X13__ | need tests |
| ? | __X14__ | need tests |
| ? | __X15__ | need tests |
| ? | __zr5__ | need tests |
| ? | __ziftr__ | need tests |

#### Don't work yet
|   | Algorithm | Comment|
| ------------- | ------------- | ------------- |
| - | __Scrypt-Jane__ | submitblock not working tested with CacheCoin, Yacoin |

-------
## Screenshots
#### Home<br />
![Home](https://github.com/leshacat/BootNOMP/blob/master/docs/screenshots/home.png)

#### Pool Stats<br />
![Pool Stats](https://github.com/leshacat/BOOTNOMP/blob/master/docs/screenshots/poolstats.png)<br /><br />

#### Miner Stats<br />
![Miner Stats](https://github.com/leshacat/BootNOMP/blob/development/docs/screenshots/minerstats.png)<br /><br />

#### Block Explorer<br />
![Block Explorer](https://github.com/leshacat/BOOTNOMP/blob/master/docs/screenshots/blockexplorer.png)<br /><br />

-------
## Credits
| User | Comment|
| ------------- | ------------- |
| [foxer666](//github.com/foxer666) | How could anyone forget the original [foxer666/node-open-mining-portal](https://github.com/foxer666/node-open-mining-portal) dev? |
| [1301313Y](//github.com/1301313Y) | How could anyone forget the original [1301313Y/BootNOMP](https://github.com/1301313Y/BootNOMP) dev? |
| [leshacat](//github.com/leshacat) | How could anyone forget the original [leshacat/BootNOMP](https://github.com/leshacat/BootNOMP) dev?<br /> - Fixed lots of documentation, configuration, and block explorer |
| [a2hill](//github.com/a2hill) | helped with X16r |
| [devnulled](//github.com/devnull-ed) | helped with lyra2z, neoscrypt algo |
| [Kris Klosterman / krisklosterman](https://github.com/krisklosterman) | Updated code for work with Node.JS >=8 |
| [Jerry Brady / mintyfresh68](https://github.com/bluecircle) | got coin-switching fully working and developed proxy-per-algo feature |
| [Tony Dobbs](http://anthonydobbs.com) | designs for front-end and created the NOMP logo |
| [LucasJones](//github.com/LucasJones) | got p2p block notify working and implemented additional hashing algos |
| [UdjinM6](//github.com/UdjinM6) | helped implement fee withdrawal in payment processing |
| [Alex Petrov / sysmanalex](https://github.com/sysmanalex) | contributed the pure C block notify script |
| [svirusxxx](//github.com/svirusxxx) | sponsored development of MPOS mode |
| [icecube45](//github.com/icecube45) | helping out with the repo wiki |
| [yoshuki43](//github.com/yoshuki43) | his K-Nomp project has really help the development! |

***Those that contributed to [node-stratum-pool](//github.com/zone117x/node-stratum-pool#credits)***

-------

## Plz Buy Me Some Coffee?

I drink about 3 pots a day... I will love you forever!


BTC: `1PvSxjrpzNXCuBHCupAGuuzeUe5DE7kB7H`

LTC: `LU6x6qjdMz4btBEhUU1AukJfUNmrwuaJJD`

ETH/ERC20: `0x67a5A070012aBa9dFB50e571A40b3263C258d7D5`

XMR: `88LqrMZhweMGP61EUrHbkqRcxcYuL7fNRG3UrBYW8eGaN19KCjAuM3fTcr5BniFsf2g8Dmi7YVchBBmbHjWdCPkm1axmMUD`

-------

***EOF***
