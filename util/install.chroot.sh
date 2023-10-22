#!/bin/sh

echo "Before all: make sure your chroot container is installed in '/userdisk/chroot'."
echo ""
echo "Operation will start in 10s."

sleep 10

mv ./youdaoExt ./chroot/youdaoExt
mv ./youdaoExt.sh.inchroot ./chroot/youdaoExt.sh
chmod +x ./chroot/youdaoExt.sh

mkdir ./chroot/ydp
mkdir ./chroot/ydpsys

mv ./youdaoExt.sh.chroot ./youdaoExt.sh
chmod +x ./youdaoExt.sh
ln -sr ./youdaoExt.sh /usr/bin/youdaoExt
chmod +x /usr/bin/youdaoExt

sed -i '1i sleep 5' /usr/bin/runDictPen
sed -i '1i youdaoExt &' /usr/bin/runDictPen
sed -i '1i #!/bin/sh' /usr/bin/runDictPen
chmod +x /usr/bin/runDictPen

mkdir /userdisk/Music/gpt
mkdir -p /userdisk/Music/textweb/offline
mkdir -p /userdisk/Music/textweb/cookie
mv ./bing-url.json /userdisk/Music/bing-url.json

rm ./node.native
rm ./youdaoExt.sh.native

mv ./node.chroot ./chroot/node.sh
chmod +x ./chroot/node.sh
chroot ./chroot /node.sh
rm ./chroot/node.sh

cp /usr/bin/memsize ./chroot/usr/bin/memsize

rm ./install.native.sh
rm ./unintall.native.sh

echo "done."