#!/bin/sh

pid=`lsof -t netdiscover.txt`

for i in $pid
do
	kill -9 $i
done

