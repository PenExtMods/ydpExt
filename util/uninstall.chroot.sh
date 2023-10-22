#!/bin/sh

echo "Before all: make sure your chroot container is installed in '/userdisk/chroot'."
echo ""
echo "This script will remove ydpExt and ALL THE DATA IT PRODUCED from you device."
echo ""
echo "Since it is in a chroot container, you have to remove 'nodejs' from your container by youself if you want."
echo ""
echo "Warning: the following files and dirs will be removed."
echo " - /userdisk/Music/textweb"
echo " - /userdisk/Music/gpt"
echo " - /userdisk/Music/bing-url.json"
echo ""
echo "Operation will start in 10s."

sleep 10

rm /usr/bin/youdaoExt
rm ./youdaoExt.sh

rm /usr/bin/node
rm ./node

rm -r /userdisk/Music/textweb
rm -r /userdisk/Music/gpt
rm /userdisk/Music/bing-url.json

rm -r ./chroot/youdaoExt
rm ./chroot/youdaoExt.sh

echo "done."