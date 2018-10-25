# Pool Installation Instructions
### Install Requirements
```
sudo apt-get install build-essential libtool autotools-dev autoconf pkg-config libssl-dev
sudo apt-get install libboost-all-dev git npm nodejs nodejs-legacy libminiupnpc-dev redis-server
sudo apt-get install -y software-properties-common
sudo add-apt-repository ppa:bitcoin/bitcoin
sudo apt-get update
sudo apt-get install libdb4.8-dev libdb4.8++-dev
sudo apt-get -y install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl enable redis-server
sudo systemctl start redis-server
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
source ~/.bashrc
nvm install v8.1.4
nvm use v8.1.4
npm update -g
npm install pm2@latest
pm2 init
```

-------
### Install Pool
```

git clone https://github.com/leshacat/BootNOMP.git
cd BootNOMP
npm install
npm update
npm audit fix
pm2 start init.js -i max --watch --name pool
```

-------
### Watching Pool Logs
```
pm2 logs pool
or
tail -f ~/.pm2/logs/pool-error.log
```

-------
### Restarting Pool
```
pm2 stop pool --watch
pm2 start pool --watch
```

-------
### Startup on Boot
```
pm2 startup
```
Copy & paste the command

-------
### Update Pool Source (should be done monthly at minimum)
```
cd BootNOMP
git pull
npm update -g
npm install
npm --depth 9999 update
npm audit fix
pm2 stop pool --watch
pm2 start pool --watch
```

***EOF***
