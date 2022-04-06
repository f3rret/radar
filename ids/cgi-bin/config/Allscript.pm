package Allscript;
use strict;
use Exporter;

our @ISA = qw{Exporter};
our @EXPORT = qw{%DATA &trim};

our %DATA;

$DATA{"DBHOST"} = "127.0.0.1"; #your db connection
$DATA{"DBLOGIN"} = "admin";
$DATA{"DBPASSWORD"} = "mypass" ;
$DATA{"DBNAME"} = "ids";

sub trim{
	
	my $param=shift();
	$param=~s/\s+//g;
	return $param;
	
}

