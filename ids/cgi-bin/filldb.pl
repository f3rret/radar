#!/usr/bin/perl -w

use DBI;
use LWP::UserAgent;

use lib "./config";
use Allscript qw( :DEFAULT);


open(MYFILE, "0.csv") || die "$!";  #change 0.csv to your filename
@contents=<MYFILE>;
close(MYFILE);


my $ds="DBI:mysql:" . $DATA{"DBNAME"} . ":" . $DATA{"DBHOST"};
my $db=DBI->connect($ds, $DATA{"DBLOGIN"}, $DATA{"DBPASSWORD"});

if(!$db){
	print "no database connection";
	exit();
}
$db->do("SET NAMES utf8");

my $q_entry;
my $count=0;
my @row;

foreach (@contents){
		
	print $_;
	@row=split(/;/, $_);
	
	$q_entry="INSERT INTO main VALUES (NULL, '$row[1]', '$row[0]', '$row[2]', '$row[3]', 'eth0')";  #change eth0 to your iface if needed
	$count=$db->do($q_entry);
	
	if($count==1){
		print " OK\n";
	}
	else{
		exit();
	}
	
}

$db->disconnect();


