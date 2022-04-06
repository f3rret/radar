#!/usr/bin/perl -w

use CGI::Carp qw(fatalsToBrowser);
print "Content-type: text/html\n\n";

my $var;
foreach $var (keys(%ENV)){
	print "$var => $ENV{$var}<br>";
}