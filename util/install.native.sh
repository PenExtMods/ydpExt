#!/bin/sh

mv ./youdaoExt.sh.native ./youdaoExt.sh
chmod +x ./youdaoExt.sh
rm ./youdaoExt.sh.chroot
rm ./youdaoExt.sh.inchroot
ln -sr ./youdaoExt.sh /usr/bin/youdaoExt
chmod +x /usr/bin/youdaoExt

mv ./node.native ./node
chmod +x ./node
ln -sr ./node /usr/bin/node
chmod +x ./usr/bin/node
rm ./node.chroot

mkdir /userdisk/Music/gpt
mkdir -p /userdisk/Music/textweb/offline
mkdir -p /userdisk/Music/textweb/cookie
mv ./bing-url.json /userdisk/Music/bing-url.json

sed -i '1i sleep 5' /usr/bin/runDictPen
sed -i '1i youdaoExt &' /usr/bin/runDictPen
sed -i '1i #!/bin/sh' /usr/bin/runDictPen
chmod +x /usr/bin/runDictPen

rm ./install.chroot.sh
rm ./unintall.chroot.sh

echo "done."