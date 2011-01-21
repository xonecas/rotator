#!/bin/bash 
# start the wallpaper rotation

sleep 60

#node /home/sean/rotator/rotator.js /home/sean/Pictures 30 &> /home/sean/rotator/rotator.log
node /home/sean/rotator/rotator.js /home/sean/Pictures 30 web &> /home/sean/rotator/rotator.log

exit
