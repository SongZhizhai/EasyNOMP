#!/bin/sh

# This is the EasyNOMP install script.
echo "EasyNOMP INSTALL script."
echo "Please do NOT run as root, run as the pool user!"

echo "THIS SCRIPT PURGES REDIS DATA! YOU HAVE 10 SECONDS TO ABORT (CTRL + C)"

sleep 7

echo "Installing... Please wait!"

sleep 3


#
#	Update APT sources, packages, system packages, install dependency.
#

echo "Updating Apt Sources - Please wait..."
apt update > /dev/null 2&>1

echo "Installing software-properties-common - Please wait..."
sudo apt-get install -y software-properties-common

echo "Adding Apt Sources (ppa:bitcoin/bitcoin) - Please wait..."
sudo add-apt-repository -y ppa:bitcoin/bitcoin

echo "Updating Apt Sources - Please wait..."
apt update > /dev/null 2&>1

echo "Upgrading Packages - Please wait..."
apt upgrade -y > /dev/null 2&>1

echo "Upgrading System Packages - Please wait..."
apt dist-upgrade -y > /dev/null 2&>1

echo "Installing system dependencies - Please wait..."
sudo apt-get install -y sudo git nano wget curl ntp build-essential libtool autotools-dev autoconf pkg-config libssl-dev libboost-all-dev git npm nodejs nodejs-legacy libminiupnpc-dev redis-server software-properties-common fail2ban libdb4.8-dev libdb4.8++-dev > /dev/null 2&>1


#
#	Start/Enable services on boot
#

echo "Start redis-server, enable on boot, flush redis data"
sudo systemctl enable redis-server
sudo systemctl start redis-server
redis-cli FLUSHALL

echo "Start fail2ban, enable on boot"
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

echo "Start ntp, enable on boot"
sudo systemctl enable ntp
sudo systemctl start ntp


#
#	Install NVM & NodeJS
#

echo "Installing NVM - Please wait..."
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
source ~/.bashrc

echo "Installing NodeJS - Please wait..."
nvm install v8.1.4 > /dev/null 2&>1
nvm use v8.1.4 > /dev/null 2&>1
npm update -g > /dev/null 2&>1

echo "Installing ProcessManager 2 - Please wait..."
npm install -g pm2@latest > /dev/null 2&>1
npm install -g npm@latest > /dev/null 2&>1

pm2 init


#
#	Install EasyNOMP
#

cd ~

git clone https://github.com/leshacat/EasyNOMP.git

cd BootNOMP

npm install > /dev/null 2&>1

npm audit fix > /dev/null 2&>1

echo "Starting pool..."
pm2 start init.js -i max --watch --name pool

echo "Installation completed!"
echo "Please resume installation at the EasyNOMP Wiki: https://github.com/leshacat/EasyNOMP/wiki"

exit 0
