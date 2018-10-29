#!/bin/sh

# This is the EasyNOMP install script.
echo "EasyNOMP UPDATER script."
echo "Please do NOT run as root, run as the pool user!"

echo "Installing... Please wait!"

sleep 3

echo "Updating Apt Sources - Please wait..."
apt update > /dev/null 2&>1

echo "Upgrading Packages - Please wait..."
apt upgrade -y > /dev/null 2&>1

echo "Upgrading System Packages - Please wait..."
apt dist-upgrade -y > /dev/null 2&>1

cd ~/BootNOMP

git pull

echo "Installing new version - Please wait..."
npm install > /dev/null 2&>1

echo "Auditing new version - Please wait..."
npm audit fix > /dev/null 2&>1

echo "Restarting pool - Please wait..."
pm2 stop pool --watch

pm2 start init.js -i max --watch --name pool

echo "Installation completed!"
echo "Please resume installation at the EasyNOMP Wiki: https://github.com/leshacat/EasyNOMP/wiki"

exit 0
