#!/usr/bin/perl -w

use CGI::Carp qw(fatalsToBrowser);
use CGI qw( :standard);
use DBI;
use LWP::UserAgent;

use lib "./config";
use Allscript qw( :DEFAULT);

print "Content-type: text/html\n\n";


#my $var;
#foreach $var (keys(%ENV)){
#    print "$var => $ENV{$var}\n";
#}
#exit();
my $request=new CGI;
my $action=$request->param("action");
my $result;

my %ACTIONS=("GetMainTable"=>1, "Ping"=>1, "Arping"=>1, "Nbtscan"=>1, "Ndstart"=>1, "Ndstop"=>1, "Ndread"=>1, "Nmap"=>1, "AddPrintInfo"=>1, "GetPrint"=>1, "GetAlike"=>1);
if(exists($ACTIONS{$action})){
    $result=&$action();
}
else{
    $result="unknown action";
}

print "<response>$result</response>";


sub GetMainTable{

	my $iface=$request->param("iface");
	my $ds="DBI:mysql:" . $DATA{"DBNAME"} . ":" . $DATA{"DBHOST"};
	my $db=DBI->connect($ds, $DATA{"DBLOGIN"}, $DATA{"DBPASSWORD"});
	$db->do("SET NAMES utf8");

	if(!$db){
		print "no database connection";
		exit();
	}

	my $table="<table><thead><th>ip</th><th>mac</th><th id='nbtscanall'>nbname</th><th id='pingall'>ping</th><th id='arpingall'>arping</th><th id='ports'>ports</th><th id='descr'>description</th></thead>";

	my $query="SELECT * FROM main WHERE iface='".$iface."'";
	my $result=$db->prepare($query);
	$result->execute();
	if(!$result->err){
		while(my @row=$result->fetchrow_array()){
			$table.="<tr id='$row[0]'><td>$row[1]</td><td>$row[2]</td><td>$row[3]</td><td></td><td></td><td></td><td>$row[4]</td></tr>";
		}
	}
	$result->finish();
	$db->disconnect();
	
	$table.="</table>";
	
	return $table;
}

sub Ping{

	my $count=$request->param("count");
	my $address=$request->param("address");
	my $iface=$request->param("iface");
	my $p=`ping $address -c $count -I $iface`;
	
	return $p;
}

sub Arping{

	my $count=$request->param("count");
	my $address=$request->param("address");
	my $iface=$request->param("iface");
	my $p=`sudo arping $address -I $iface -f -w $count`;
	
	return $p;
}

sub Nbtscan{

	my $address=$request->param("address");
	my $iface=$request->param("iface");
	my $p=`sudo nbtscan -s '#' $address`;
	
	return $p;
}

sub Ndstart{

	my $iface=$request->param("iface");
	return `sudo ./ndstart.sh $iface`;

}

sub Ndstop{
	
	return `sudo ./ndstop.sh`;
	
}

sub Ndread{
	
	my $lsof=`sudo ./ndstat.sh`;

	my @pids= $lsof =~ m/\d+/gi;
	if(@pids != 2){
		Ndstart();
		return "restarting";
	}
	
	return `cat netdiscover.txt`;

}

sub Nmap{

	my $address=$request->param("address");
	my $iface=$request->param("iface");
	my $p=`sudo nmap -A -PN -e $iface -n -T4 $address`; #-p-
	
	return $p;
}

sub AddPrintInfo{

	my $ds="DBI:mysql:" . $DATA{"DBNAME"} . ":" . $DATA{"DBHOST"};
	my $db=DBI->connect($ds, $DATA{"DBLOGIN"}, $DATA{"DBPASSWORD"});
	$db->do("SET NAMES utf8");

	if(!$db){
		print "no database connection";
		exit();
	}
	
	my $ipid=$request->param("ipid");
	my $print=$request->param("print");
	
	my $q_entry="INSERT INTO prints VALUES (NULL, NULL, $ipid, '$print')";
	my $count=$db->do($q_entry);
	
	$db->disconnect();
	
	return $count;
	
}

sub GetPrint{

	my $ds="DBI:mysql:" . $DATA{"DBNAME"} . ":" . $DATA{"DBHOST"};
	my $db=DBI->connect($ds, $DATA{"DBLOGIN"}, $DATA{"DBPASSWORD"});
	$db->do("SET NAMES utf8");

	if(!$db){
		print "no database connection";
		exit();
	}

	my $print="";
	
	my $ipid=$request->param("ipid");
	my $dt=$request->param("dt");
	my $act=$request->param("act");
	my $query="SELECT * FROM prints WHERE ipid=$ipid";
	
	if($dt && $act ne ""){
		if($act eq "prev"){
			$query .= " AND date<'$dt' ORDER BY date DESC LIMIT 1";
		}
		else{
			$query .= " AND date>'$dt' ORDER BY date ASC LIMIT 1";
		}
	}
	
	my $result=$db->prepare($query);
	$result->execute();
	
	if(!$result->err){
		while(my @row=$result->fetchrow_array()){
			$print=$row[1] .  "\n\n" . $row[3];
		}
	}
	$result->finish();
	$db->disconnect();
	
	return $print;
}


sub GetAlike{

	my $ds="DBI:mysql:" . $DATA{"DBNAME"} . ":" . $DATA{"DBHOST"};
	my $db=DBI->connect($ds, $DATA{"DBLOGIN"}, $DATA{"DBPASSWORD"});
	$db->do("SET NAMES utf8");

	if(!$db){
		print "no database connection";
		exit();
	}

	my $print="";
	
	my $ipid=$request->param("ipid");
	my $pattern=$request->param("pattern");
	
	if(os eq "" && ports eq ""){
		$db->disconnect();
		return $print;
	}
	
	my $query="SELECT DISTINCT main.id, main.ip, main.nbname FROM prints LEFT OUTER JOIN main ON prints.ipid=main.id WHERE print LIKE '$pattern' ORDER BY main.id";
	my $result=$db->prepare($query);
	$result->execute();
	
	if(!$result->err){
		while(my @row=$result->fetchrow_array()){
			$print .= $row[0] .  "\t" . $row[1] . "\t" . $row[2] . "\n";
		}
	}
	$result->finish();
	$db->disconnect();
	
	return $print;
}

