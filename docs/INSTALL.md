# Pool Installation Instructions
```
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo service redis-server start
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
source ~/.bashrc
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
nvm install v8.1.4
nvm use v8.1.4
npm update -g
npm install pm2@latest
pm2 init
git clone https://github.com/leshacat/BootNOMP.git
cd BootNOMP
npm install
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
### Startup on boot
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
npm --depth 9999 update
pm2 stop pool --watch
pm2 start pool --watch
```

***EOF***
