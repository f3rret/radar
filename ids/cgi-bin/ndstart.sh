#!/bin/sh

./ndstop.sh
netdiscover -P -i ${1} > netdiscover.txt
