$(document).ready(function(){

	const urlParams = new URLSearchParams(window.location.search);
	const iface=urlParams.get("iface") || "eth0";
	$("#iface").val(iface);

	$("#iface").change(function(e){
		if($("#iface").val()!==iface){
			window.location.href=window.location.pathname+'?iface='+$("#iface").val();
		}
	});

	$("#container").tabs();
	$("#outputs").tabs();

    	$.post("cgi-bin/main.pl",
        { action: "GetMainTable", iface: $("#iface").val()},
        	function (data) {
			var resp=$(data);
			$("#iplist").html($(resp).html());
			$("#iplist tr").addClass("filtered");
			$("#main").css("visibility", "visible");
			log("ip list loaded");
			
			const trs=$("#iplist tr");
			
			function GetNextPrint(i){
				if(!trs.get(i))return;
				
				var ipid=$(trs.get(i)).attr("id");
				var pingtd=$(trs.get(i)).find("td").eq(5);
				
				$.post("cgi-bin/main.pl",
					{ action: "GetPrint", ipid: ipid},
					function (data) {
						PRINTS[ipid]=data.replace("<response>", "").replace("</response>", "");

						if(PRINTS[ipid] && PRINTS[ipid]!=""){
								$(pingtd).text(GetPorts(PRINTS[ipid]).replace(/\/(tcp).*/ig, "").replace(/\n/igm, ","));						
							}
				})
				.always(function(){
					GetNextPrint(i+1);
				});
			}
			
			GetNextPrint(0);
			
			},
		"text"
	    );
	
	$("#details").draggable();
	$("#details").click(function(e){
		e.preventDefault();
        	e.stopPropagation();
	});
	
	$("body").click(function(e){
		if($("#details").hasClass("active")){
			$("#details").removeClass("active");
		}
	});
	
	$("#print_prev, #print_next").click(function(e){
		
		var dt=$("#print_output").text().substring(0, 19);
		var act= ( $(this).attr("id")=="print_prev" ? "prev":"next" );
		
		if(dt && dt.length==19){
			var span=$(this);
			$(span).addClass("process");
			
			$.post("cgi-bin/main.pl",
					{ action: "GetPrint", ipid: $("#details").attr("ipid"), dt: dt, act: act},
					function (data) {
						$(span).removeClass("process");
						
						var print=data.replace("<response>", "").replace("</response>", "");

						if(print && print!=""){
							$("#print_output").text(print);
						}
				});
		}
		
	});	
	
	
	$("#print_alike").click(function(e){
		
		var span=$(this);
		$(span).addClass("process");
		
		var ports="";
		var os="";
		
		var parr=$("#print_output").text().match(/\d{1,5}\/tcp/img);
		if(parr && parr.length){
			ports=parr.join("%");
		}
		
		var osarr=$("#print_output").text().match(/\s(OS:).*$/img);
		if(osarr && osarr.length){
			os=$.trim(osarr.join("%"));
		}		
		
		if(os=="" && ports==""){
			$(span).removeClass("process");
			return;
		}
		
		$("#print_output").text("");
		
		if(os!="" && ports!=""){
			$.post("cgi-bin/main.pl",
					{ action: "GetAlike", ipid: $("#details").attr("ipid"), pattern: "%"+ports+"%"+os+"%" },
					function (data) {
						$(span).removeClass("process");
						
						var print=data.replace("<response>", "").replace("</response>", "");

						if(print && print!=""){
							$("#print_output").text($("#print_output").text()+"\nFull match:\n\n"+print);
						}
			});
		}
		
		if(os!=""){
			$.post("cgi-bin/main.pl",
					{ action: "GetAlike", ipid: $("#details").attr("ipid"), pattern: "%"+os+"%" },
					function (data) {
						$(span).removeClass("process");
						
						var print=data.replace("<response>", "").replace("</response>", "");

						if(print && print!=""){
							$("#print_output").text($("#print_output").text()+"\nOS only match ("+os.replace(/%/igm," ")+"):\n\n"+print);
						}
			});
		}
		
		if(ports!=""){
			$.post("cgi-bin/main.pl",
					{ action: "GetAlike", ipid: $("#details").attr("ipid"), pattern: "%"+ports+"%" },
					function (data) {
						$(span).removeClass("process");
						
						var print=data.replace("<response>", "").replace("</response>", "");

						if(print && print!=""){
							$("#print_output").text($("#print_output").text()+"\nPorts only match ("+ports.replace(/%/igm, " ")+"):\n\n"+print);
						}
			});
		}

		
	});	
	
	
	$("#iplist").delegate("tbody>tr", "click", function(e){
		if(e.shiftKey && $("tr.selected.filtered").length){
			const from=$("tr.selected.filtered").first().attr("id");
			const to=$(this).attr("id");
			const direction= from < to;

			let tr=direction ? $("tr.selected.filtered").first():$("tr.selected.filtered").last();
			$(tr).siblings(".selected").toggleClass("selected");

			while(tr && $(tr).attr("id")){
				tr = direction ? $(tr).next():$(tr).prev();
				if(direction && parseInt($(tr).attr("id")) > to) break;
				if(!direction && parseInt($(tr).attr("id")) < to) break;

				if($(tr).hasClass("filtered")){
					$(tr).toggleClass("selected");
				}
			}
			window.getSelection().empty();
		}
		else{
			$(this).siblings(".selected").toggleClass("selected");
			$(this).toggleClass("selected");
		}
	});
	
	$("#iplist").delegate("tbody>tr", "contextmenu", function(e){
		
		if($('tr.selected').length<=1){
			$(this).siblings(".selected").removeClass("selected");
			$(this).addClass("selected");
		}
		else{
			if(!$(this).hasClass('selected')){
				$(this).addClass("selected");
			}
		}
		
		var offtop=e.clientY < 330 ? ($(this).offset().top-$(document).scrollTop() + 20) : ($(this).offset().top-$(document).scrollTop()-330);
		$("#details").css("top", offtop + "px");

		printCommandOutput($(this).attr("id"));
		printNmapOutput($(this).attr("id"));
		
		$("#details").attr("ipid", $(this).attr("id"));
		$("#details").addClass("active");

		return false;

	});

	$("#iplist").delegate("#nbtscanall", "click", function(e){
		$("#iplist tr").each(function(){
			nbtscan($(this).attr("id"));
		});
	});
	
	$("#iplist").delegate("#pingall", "click", function(e){
		$("#iplist tr").each(function(){
			ping($(this).attr("id"));
		});
	});
	
	$("#iplist").delegate("#arpingall", "click", function(e){
		$("#iplist tr").each(function(){
			arping($(this).attr("id"));
		});
	});
	
	$("#iplist").delegate("#ports", "click", function(e){
		if(!$("#iplist tbody>tr").length){
			return;
		}
		if(!$(this).hasClass("process")){
			$(this).addClass("process");
			
			NMAPS_=NMAPS;
			NMAPS=new Array();
			
			NMAPWATCH=setInterval(function(){

				if($("#iplist tbody>tr.nmap_active").length>0){
					return;
				}
				var filtered=$("#iplist tbody>tr.filtered");
				var endflag=true;
				
				for(var f=0; f<filtered.length; f++){
					if($(filtered[f]).attr("id") && !$(filtered[f]).hasClass("nmap_active") && !NMAPS[$(filtered[f]).attr("id")] && !$(filtered[f]).children("td").eq(4).hasClass("norespond")){
						$(filtered[f]).addClass("nmap_active");
						nmap($(filtered[f]).attr("id"));
						endflag=false;
						
						break;
					}
				}
				
				if(endflag){
					clearInterval(NMAPWATCH);
					$("#ports").removeClass("process");
				}
							
			}, 4000);
		}
		else{
			clearInterval(NMAPWATCH);
			$(this).removeClass("process");
		}
	});
	
	$("#ping").click(function(e){		
		$("#iplist tr.selected").each(function(){
			var id=$(this).attr("id");
			ping(id, function(){
				printCommandOutput(id);
				});
		});
	});
	
	$("#arping").click(function(e){		
		$("#iplist tr.selected").each(function(){
			var id=$(this).attr("id");
			arping(id, function(){
				printCommandOutput(id);
				});
		});
	});
	
	$("#nbtscan").click(function(e){		
		$("#iplist tr.selected").each(function(){
			var id=$(this).attr("id");
			nbtscan(id, function(){
				printCommandOutput(id);
				});
		});
	});
	
	$("#nmap").click(function(e){		
		$("#iplist tr.selected").each(function(){
			var id=$(this).attr("id");
			nmap(id, function(){
				printNmapOutput(id);
				});
		});
	});
	
	$("#filter input").change(function(e){
		$("#iplist tr").has("td").removeClass("filtered");
		
		if(!$("#filter input:checked").length){
			/*$("#filter input").each(function(e){
				$(this).val([$(this).attr("value")]);
			});*/
			$("#iplist>table td.norespond").each(function(){
				if(!$(this).closest("tr").hasClass("filtered") && $(this).closest("tr").children("td.norespond").length==3){
					$(this).closest("tr").addClass("filtered");
				}
			});
		}
		else if($("#filter input:checked").length<4){
			$("#filter input:checked").each(function(){			
				var checkname=$(this).attr("name");
				if(checkname!="blank"){
					$("#iplist>table td."+$(this).attr("name")).each(function(){
						if(checkname!="norespond"){
							$(this).closest("tr").addClass("filtered");
						}
						else if($(this).closest("tr").children("td.norespond").length<3){
							$(this).closest("tr").addClass("filtered");
						}
					});
				}
				else{
					$("#iplist tr").removeClass("colored");
					
					$("#filter input").each(function(){
						if($(this).attr("name")!="blank"){
							$("#iplist>table td."+$(this).attr("name")).each(function(){
									$(this).closest("tr").addClass("colored");
							});
						}
					});
					
					$("#iplist tr:not(.colored)").addClass("filtered");
				}
				
			});
		}
		else{
			$("#iplist tr").addClass("filtered");
		}
	});
		
	$("#mainwatch").click(function(e){
		const selectedOnly=$("#iplist tr.selected").length>1;
		$(this).toggleClass("active");
		
		if($(this).hasClass("active")){
			MAINWATCH=setInterval(function(){
				var next=$("#iplist tr.nextwatch");
				if(!next.length){
					if(selectedOnly)
						next=$("#iplist tr.selected").first();
					else
						next=$("#iplist tr").eq(1);
				}
				
				if($(next).children("td").eq(0).text()!="0.0.0.0"){
					arping($(next).attr("id"));
					ping($(next).attr("id"));
					nbtscan($(next).attr("id"));
				}
				
				$(next).removeClass("nextwatch");
				next=$(next).next();
				if(selectedOnly && !$(next).hasClass('selected')){
					clearInterval(MAINWATCH);
					return;
				}
				
				if(!next.length){
					if(!selectedOnly){
						next=$("#iplist tr").eq(1);
					}
				}
				$(next).addClass("nextwatch");
				
			}, 2000);
			MAINFILTER=setInterval(function(){
				$("#filter input").eq(0).change();
			}, 2000);
			NMAPWATCH=setInterval(function(){

				if($("#iplist tbody>tr.nmap_active").length>0){
					return;
				}
				var filtered=$("#iplist tr.selected");
				if(!filtered.length)filtered=$("#iplist tbody>tr.filtered");
								
				for(var f=0; f<filtered.length; f++){
					if($(filtered[f]).attr("id") && !$(filtered[f]).hasClass("nmap_active") && !NMAPS[$(filtered[f]).attr("id")] && !$(filtered[f]).children("td").eq(4).hasClass("norespond")){
						$(filtered[f]).addClass("nmap_active");
						nmap($(filtered[f]).attr("id"));
						break;
					}
				}
				
			}, 4000);
		}
		else{
			clearInterval(MAINWATCH);
			clearInterval(MAINFILTER);
			clearInterval(NMAPWATCH);
		}
	});
	
	$("#ndstart").click(function(e){
		$(this).toggleClass("active");
		
		if($(this).hasClass("active")){
			$("#ndstatus").text("starting");
			
			$.post("cgi-bin/main.pl",
				{ action: "Ndstart", iface: $("#iface").val()},
				function(data){
					//$("#ndstatus").text("started");
				}
			);
			
			NETDISCOVER=setInterval(function(){
				$.post("cgi-bin/main.pl",
				{ action: "Ndread"},
				function(data){
					var dt=new Date();
					$("#netdiscover>textarea").text($(data).text().replace(/^\s_+\s/gi,""));
					$("#ndstatus").text("updated "+dt.toLocaleString().replace(",", ""));
					
					var raw=$(data).text().replace(/^\s_+[\s\S]*-\s/gi,"");
					var arr=raw.split("\n");

					for(var row in arr){
						var ra=$.trim(arr[row].replace(/\s{2,}/gi, ";")).split(";");

						if(ra.length>4 && ra[0]!="0.0.0.0"){
							var nextid=0;
							
							var trs=$("#iplist tr");
							
							for(var t=0; t<trs.length; t++){
								nextid=parseInt($(trs[t]).attr("id"));
								
								if($(trs[t]).children("td").eq(0).text()==ra[0]){
									ra[5]="found";
									
									if($(trs[t]).children("td").eq(1).text().toUpperCase()!=$.trim(ra[1]).toUpperCase()){
											$(trs[t]).children("td").eq(1).addClass("warning");
											$("#filter input").eq(0).change();
									}
									
									break;
								}
							}
							
							if(!ra[5] || ra[5]!="found"){
								$("#iplist tbody>tr").first().before("<tr class='filtered' id='" + ++nextid + "'><td class='warning'>" + ra[0] + "</td><td>" + ra[1].toUpperCase() + "</td><td>" + ra[4] + "</td><td></td><td></td><td></td><td></td></tr>");
								if(!MAINFILTER){
									$("#filter input").eq(0).change();
								}
							}
						}
						
					}
				}
			);
			}, 5000);
		}
		else{
			$("#ndstatus").text("stoping");
			clearInterval(NETDISCOVER);
			
			$.post("cgi-bin/main.pl",
				{ action: "Ndstop"},
				function(data){
					$("#ndstatus").text("stoped");
				}
			);
		}
		
	});
	
});

var MAINWATCH=null;
var MAINFILTER=null;
var NETDISCOVER=null;
var NMAPWATCH=null;

function printCommandOutput(id){
		
		$("#ping_output").text("");
		$("#output").removeClass("active");
		
		if(ARPINGS[id]){
			$("#ping_output").text(ARPINGS[id]+"-----------------------------------------------------\n\n");
			$("#output").addClass("active");
		}

		if(NBTSCANS[id]){
			$("#ping_output").text($("#ping_output").text()+NBTSCANS[id]+"-----------------------------------------------------\n\n");
			$("#output").addClass("active");
		}
		
		if(PINGS[id]){
			$("#ping_output").text($("#ping_output").text()+PINGS[id]);
			$("#output").addClass("active");
		}
	
}

function printNmapOutput(id){
	
	$("#nmap_output").text("");
	
	if(NMAPS[id]){
			$("#nmap_output").text(NMAPS[id]);
	}
		
	$("#print_output").text("");
	
	if(PRINTS[id]){
			$("#print_output").text(PRINTS[id]);
	}
	
}

function log(message){
	
	var dt=new Date();
	if($("#log>textarea").text().split("\n",515).length>512){
		$("#log>textarea").text("...");
	}
	$("#log>textarea").text(dt.toLocaleString().replace(",", "") + " " + message + "\n" + $("#log>textarea").text());
	
}

var PINGS=new Array();
var ARPINGS=new Array();
var NBTSCANS=new Array();
var NMAPS=new Array();
var NMAPS_=new Array();
var PRINTS=new Array();

function ping(id, callback){

	var tr=$("#"+id);
	$(tr).find("td").eq(3).addClass("process");

	$.post("cgi-bin/main.pl",
		{ action: "Ping", count: 4, address: $(tr).find("td").eq(0).text(), iface: $("#iface").val()},
		function (data) {
		
			var pingtd=$(tr).find("td").eq(3);
			$(pingtd).removeClass("process");
			
			var resp=$(data);
			PINGS[id]=$(resp).html();
			
			log("ping result for #"+id+" (" + $(tr).find("td").eq(0).text() + ") received");
			if(callback){callback();}
			
			$(pingtd).removeClass("norespond loss");
			
			var arr=PINGS[id].split("rtt min/avg/max/mdev = ");
			if(arr.length>1){
				var arr2=arr[1].split("/");
				if(arr2[1]){
					$(pingtd).text(arr2[1]);
					
					var regex=/\s0%\spacket\sloss/gi;
					if(!arr[0].match(regex)){
						$(pingtd).addClass("loss");
					}
				}
				else{
					$(pingtd).addClass("norespond");
				}
			}
			else{
				$(pingtd).addClass("norespond");
			}
			
		},
		"text"
	);

}

function arping(id, callback){

	var tr=$("#"+id);
	$(tr).find("td").eq(4).addClass("process");
	
	$.post("cgi-bin/main.pl",
		{ action: "Arping", count: 4, address: $(tr).find("td").eq(0).text(), iface: $("#iface").val()},
		function (data) {
		
			var pingtd=$(tr).find("td").eq(4);
			$(pingtd).removeClass("process");
			
			var resp=$(data);
			ARPINGS[id]=$(resp).html();
			
			log("arping result for #"+id+" (" + $(tr).find("td").eq(0).text() + ") received");
			if(callback){callback();}
			
			var regex=/([0-9A-F]{2}:){5}[0-9A-F]{2}/gi;
			var mac=ARPINGS[id].match(regex);
			
			$(pingtd).removeClass("warning norespond");
			
			if(mac){	
				if(mac.length>1 || mac[0]!=$(tr).find("td").eq(1).text()){
					$(pingtd).addClass("warning");
				}
				
				regex=/\s[0-9\.]+ms/gi;
				var ms=ARPINGS[id].match(regex);
				
				if(ms && ms.length==1){
					$(pingtd).text(parseFloat(ms[0]));
				}
				else{
					$(pingtd).addClass("warning");
				}
			}
			else{
				$(pingtd).addClass("norespond");
			}
			
		},
		"text"
	);

}

function nbtscan(id, callback){

	var tr=$("#"+id);
	$(tr).find("td").eq(2).addClass("process");

	$.post("cgi-bin/main.pl",
		{ action: "Nbtscan", address: $(tr).find("td").eq(0).text(), iface: $("#iface").val()},
		function (data) {
		
			var pingtd=$(tr).find("td").eq(2);
			$(pingtd).removeClass("process");
			
			var resp=data.replace("<response>", "").replace("</response>", "");
			NBTSCANS[id]=resp;
			
			log("nbtscan result for #"+id+" (" + $(tr).find("td").eq(0).text() + ") received");
			if(callback){callback();}
			
			$(pingtd).removeClass("warning loss norespond");
			
			var arr=NBTSCANS[id].split("#");
			if(arr.length>1){
				if($.trim(arr[1])!=$.trim($(pingtd).text().toUpperCase())){
					$(pingtd).addClass("loss");
				}
			}
			else if(NBTSCANS[id]==""){
				$(pingtd).addClass("norespond");
			}
			else{
				$(pingtd).addClass("warning");
			}
			
		},
		"text"
	);

}

function nmap(id, callback){

	var tr=$("#"+id);
	$(tr).addClass("nmap_active");
	$(tr).find("td").eq(5).addClass("process");

	$.post("cgi-bin/main.pl",
		{ action: "Nmap", address: $(tr).find("td").eq(0).text(), iface: $("#iface").val()},
		function (data) {
			
			log("nmap result for #"+id+" (" + $(tr).find("td").eq(0).text() + ") received");
			var pingtd=$(tr).find("td").eq(5);
			$(pingtd).removeClass("process");
			
			var resp=data.replace("<response>", "").replace("</response>", "");
			NMAPS[id]=resp;
			
			var print=GetPorts(resp);
			
			/*var guesses=resp.match(/^Aggressive OS guesses.*$/img);
			if(guesses && guesses.length){
				print += String.fromCharCode(10) + guesses.join(";");
			}*/
			
			if (resp.indexOf("|   OS:")>-1){
				print += String.fromCharCode(10) + resp.substring(resp.indexOf("|   OS:"), resp.indexOf("|_  System time:")).replace(/\\x/igm, "x");
			}
			
			if(print && print !="" && PRINTS[id].substring(21)!=print){
				log("machine fingerprint mismatch for #"+id+" (" + $(tr).find("td").eq(0).text() + ")");
				
				$.post("cgi-bin/main.pl",
				{ action: "AddPrintInfo", ipid: id, print: print },
				function(data){
					$(pingtd).addClass("warning");
				});
				
			}
			
			$(tr).removeClass("nmap_active");
			if(callback){callback();}
						
		},
		"text"
	);

}

function GetPorts(print){
	
	var result="";
	var ports=print.match(/\d{1,5}\/(tcp|udp).*$/img);
	
	if(ports && ports.length){
		result += ports.join(String.fromCharCode(10)).replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/igm, "$datetime");
	}
	
	return result;
}





