$(document).ready( function () {

    var ImageSrc = "";
    var CurrBank = GetBank();
    var playerID = 0;
    let TeamArr = [];
    let OriginalTeamArr = [];
    UpdateOriginalTeamIDs();

    $(document).on("click", '#resetGW', function(event) {   
        ResetTeam();
    });
  
    $(document).on("click", ".team", function(event) {
        //Check if a transfer is in progress
        let HasRemoved = $('img[src="assets/images/removed.png"]');

        let SubOutSet = $(this).hasClass("substitute-out");
        if(SubOutSet==false)
        {
            if(HasRemoved.length==0)
            {
                RemoveSelection("substitute-out");
                
                //Add sub Class to this element
                $(this).closest(".elementwrap").css('background-color', 'rgba(0,0,0,.2');
                $(this).addClass(" substitute-out");                 
            }  
        } 

        let HasSubIn = $(".substitute-in").hasClass("substitute-in");
        if(HasSubIn == true)
        {         
            ProcessSub(".substitute-in", this);  

            $(this).closest(".elementwrap").css('background-color', '');
            $(".substitute-in").removeClass("substitute-in");
            $(this).removeClass("substitute-out");            
        }      
    });

    $(document).on("click", ".substitute-out", function(event) {
        //Remove sub class from this element
        $(this).closest(".elementwrap").css('background-color', '');
        $(this).removeClass("substitute-out");
    });        

    $(document).on("click", ".bench", function(event) {
        //Check if a transfer is in progress
        let HasRemoved = $('img[src="assets/images/removed.png"]');

        //Allow Bench reorder
        let HasSubIn = $(".substitute-in").hasClass("substitute-in");
        if(HasSubIn == true)
        {         
            let InImgPos = $(this).closest(".elementwrap").find('img').attr('position');
            let OutImgPos = $(".substitute-in").closest(".elementwrap").find('img').attr('position');
            //Exclude Goalkeeper
            if(InImgPos != "GKP" && OutImgPos != "GKP")
            {
                ProcessSub(this, ".substitute-in");  
                RemoveSelection("substitute-in");  
                return;    
            }
            else
            {
                RemoveSelection("substitute-in");  
                return; 
            } 
        } 

        let SubInSet = $(this).hasClass("substitute-in");
        if(SubInSet==false)
        {
            if(HasRemoved.length==0)
            {
                RemoveSelection("substitute-in");  
                
                //Add sub Class to this element
                $(this).closest(".elementwrap").css('background-color', 'rgba(0,0,0,.2');
                $(this).addClass(" substitute-in");                 
            }  
        }

        let HasSubOut = $(".substitute-out").hasClass("substitute-out");
        if(HasSubOut == true)
        {         
            ProcessSub(this, ".substitute-out");  

            $(this).closest(".elementwrap").css('background-color', '');
            $(".substitute-out").removeClass("substitute-out");
            $(this).removeClass("substitute-in");            
        }

    });    
    
    $(document).on("click", ".substitute-in", function(event) {
        //Remove sub class from this element
        $(this).closest(".elementwrap").css('background-color', '');
        $(this).removeClass("substitute-in");
    });     

    $(document).on("click", '.shirt', function(event) {    
        RemoveSelection("substitute-out");  

        if($(this).attr('src') != 'assets/images/removed.png')
        {       
            if(ImageSrc == "")
            {     
                UpdateTeamIDs();
                ImageSrc = $(this).attr('src');
                playerID = parseInt($(this).attr('player-id'));
                $(this).attr('src', this.src.indexOf('assets/images/removed.png') > -1 ? ImageSrc: 'assets/images/removed.png');
                var Bank = GetBank() + parseFloat($(this).attr('sell-price'));
                $('#bank').text(Bank.toFixed(1)); 
                //Change Status
                $('.status').text($(this).attr('playername')+' has been removed from your squad');
                $('.status').removeAttr('hidden');                
                DatatableFilter();
                dataTables.columns(0).search($(this).attr('position'));              
                dataTables.draw();
                TeamArr = [];
            }
        }
        else
        {            
            $(this).attr('src', this.src.indexOf(ImageSrc) > -1 ? 'assets/images/removed.png': ImageSrc); 
            $('#bank').text(CurrBank.toFixed(1)); 
            //Change Status
            $('.status').text($(this).attr('playername')+' has been added to your squad');
            $('.status').removeAttr('hidden');             
            //Remove search and filters from datatable
            ResetFilters();
            dataTables.draw();
            ImageSrc = "";
            playerID = 0;
        }        
    });

    $('#playertable tbody').on('click', 'tr', function() {        
        if(playerID !== 0)
        {
            var data = dataTables.row(this).data();
            var InTeamPrice = parseFloat(0.0);

            //check if player was in original team
            OriginalTeamArr.forEach(function(item, index)
            {
                if(item[0] == data[3])
                {
                    InTeamPrice = item[1];
                }
            });
            
            const playerArray = data[0].split("<br>");          
            $('#'+playerID+' .playername').text(playerArray[0]);            
            $('#'+playerID+' img').attr('player-id', data[3]);
            $('#'+playerID+' .playerprice').text(data[1]);
            $('#'+playerID+' img').attr('sell-price', data[1]);
            $('#'+playerID+' img').attr('position', playerArray[1].substring(playerArray[1].length - 3, playerArray[1].length));
            $('#'+playerID+' img').attr('src', 'assets/images/'+playerArray[1].substring(0,3)+'.png');
            $('#'+playerID+' img').attr('playername', playerArray[0]);              
            
            var Transfers;
            var FreeTransfers = parseInt($('#freetransfers').text());
            var TransfersCost;

            if(InTeamPrice !== 0)
            {            
                var Bank = GetBank() - parseFloat(InTeamPrice);
                $('#'+playerID+' .playerprice').text(InTeamPrice);
                $('#'+playerID+' img').attr('sell-price', InTeamPrice);
                Transfers = parseInt($('#notransfers').text()) - 1;
                if(Transfers <= FreeTransfers)
                {
                    if(parseInt($('#xfrcost').text()) < 0)
                    {
                        TransfersCost = parseInt($('#xfrcost').text()) + 4;
                    }
                    else
                    {
                        TransfersCost = 0;
                    }
                    $('#xfrcost').css('color', 'black');
                }                
            }
            else
            {
                var Bank = GetBank() - parseFloat(data[1]);                
                Transfers = parseInt($('#notransfers').text()) + 1;
                if(Transfers > FreeTransfers)
                {
                    TransfersCost = parseInt($('#xfrcost').text()) - 4;
                    $('#xfrcost').css('color', 'red');
                }              
            }

            //Change Bank
            $('#bank').text(Bank.toFixed(1));            

            //Change Transfers
            $('#notransfers').text(Transfers);
            $('#xfrcost').text(TransfersCost);

            //Change Status
            $('.status').text(playerArray[0]+' has been added to your squad');
            $('.status').removeAttr('hidden');

            //Change div id to PlayerID last            
            $('#'+playerID).attr('id', data[3]);
            ImageSrc = "";
            playerID = 0;  
            
            ResetFilters();
            dataTables.draw();            
        }
        else
        {
            var data = dataTables.row(this).data();
            const playerArray = data[0].split("<br>");
            OpenDialog(playerArray[0]);
        }
    });

    $('#sortBy').change( function() {
        var SearchTerm = dataTables.column(0).search();
        if(ImageSrc != "")
        { 
            TeamArr = [];
            UpdateTeamIDs();
            $.fn.dataTable.ext.search.pop();
            DatatableFilter();
            dataTables.columns(0).search(SearchTerm);
        }
        else
        {
            ResetFilters();
        }
       
        switch ($(this).val()) {
            case "Points":                                    
            dataTables.order([2,'desc']);
            dataTables.draw();
            break;

            case "Price":
            dataTables.order([1,'desc']);            
            dataTables.draw();
            break;

            default:
            break;
        }
        
        });

    // Load the datatable
	$('#data').fadeIn(300);

    var dataTables = $('#playertable').DataTable( {
		"info": false,       
        "order": [2, 'desc'],
		"pageLength": 15,
		"lengthChange": false,
        columnDefs: [
            {
                "targets": [3],
                "visible": false
            },
            {
                "orderable": false,
                "targets": '_all'
            }
        ],
	});

    function RemoveSelection(MyClass)
    {
        //Remove sub class from other elements
        $(".elementwrap").css('background-color', '');
        $("."+MyClass).removeClass(MyClass);
    }

    function GetBank()
    {
        return parseFloat($('#bank').text());
    }

    function ProcessSub(MyElement, MyClass)
    {        
        let OutImgElem = $(MyClass).closest(".elementwrap").find('img');
        let OutPlayerID = OutImgElem.attr('player-id');
        let OutPlayerName = OutImgElem.attr('playername');
        let OutSellPrice = OutImgElem.attr('sell-price');
        let OutImgSrc = OutImgElem.attr('src');
        let OutImgPos = OutImgElem.attr('position');

        let InImgElem = $(MyElement).closest(".elementwrap").find('img');
        let InPlayerID = InImgElem.attr('player-id');
        let InPlayerName = InImgElem.attr('playername');
        let InSellPrice = InImgElem.attr('sell-price');
        let InImgSrc = InImgElem.attr('src');
        let InImgPos = InImgElem.attr('position');

        let positions = {
            def: $(".player-row .DEF").length,
            mid: $(".player-row .MID").length,
            fwd: $(".player-row .FWD").length,
          };

        let OutParentClass = $(MyClass).closest(".elementwrap").parent().attr('class');
        let InParentClass = $(MyElement).closest(".elementwrap").parent().attr('class');

        //Bench swap
        if(OutParentClass == "bench-row" && InParentClass == "bench-row")
        {
            $('#'+InPlayerID+' .playername').text(OutPlayerName);
            $('#'+InPlayerID+' .playerprice').text(OutSellPrice);
            InImgElem.attr('player-id', OutPlayerID);
            InImgElem.attr('playername', OutPlayerName);
            InImgElem.attr('sell-price', OutSellPrice);
            InImgElem.attr('position', OutImgPos);
            InImgElem.attr('src', OutImgSrc);
            $('#'+InPlayerID).attr('id', 'Player-Out');                

            $('#'+OutPlayerID+' .playername').text(InPlayerName);
            $('#'+OutPlayerID+' .playerprice').text(InSellPrice);
            OutImgElem.attr('player-id', InPlayerID);
            OutImgElem.attr('playername', InPlayerName);
            OutImgElem.attr('sell-price', InSellPrice);
            OutImgElem.attr('position', InImgPos);
            OutImgElem.attr('src', InImgSrc); 
            $('#'+OutPlayerID).attr('id', 'Player-In');

            $('#Player-Out').attr('id', OutPlayerID);
            $('#Player-In').attr('id', InPlayerID);
            return;
        }

        if (InImgPos === OutImgPos ||
            (OutImgPos === "DEF" && positions.def > 3 && InImgPos !== "GKP") ||
            (OutImgPos === "MID" && positions.mid > 1 && InImgPos !== "GKP") ||
            (OutImgPos === "FWD" && positions.fwd > 1 && InImgPos !== "GKP"))
        {            
            $('#'+InPlayerID+' .playername').text(OutPlayerName);
            $('#'+InPlayerID+' .playerprice').text(OutSellPrice);
            InImgElem.attr('player-id', OutPlayerID);
            InImgElem.attr('playername', OutPlayerName);
            InImgElem.attr('sell-price', OutSellPrice);
            InImgElem.attr('position', OutImgPos);
            InImgElem.attr('src', OutImgSrc);
            $('#'+InPlayerID).attr('id', 'Player-Out');                

            $('#'+OutPlayerID+' .playername').text(InPlayerName);
            $('#'+OutPlayerID+' .playerprice').text(InSellPrice);
            OutImgElem.attr('player-id', InPlayerID);
            OutImgElem.attr('playername', InPlayerName);
            OutImgElem.attr('sell-price', InSellPrice);
            OutImgElem.attr('position', InImgPos);
            OutImgElem.attr('src', InImgSrc); 
            $('#'+OutPlayerID).attr('id', 'Player-In');

            $('#Player-Out').attr('id', OutPlayerID);
            $('#Player-In').attr('id', InPlayerID);

            if(InImgPos !== OutImgPos)
            {
                if(OutParentClass.indexOf("player-row") > -1)
                {
                    $(MyClass).closest(".elementwrap").detach().appendTo(".player-row."+InImgPos);
                    $(MyClass).closest(".elementwrap").removeClass(OutImgPos);
                    $(MyClass).closest(".elementwrap").addClass(" "+InImgPos); 
                    $(MyElement).closest(".elementwrap").removeClass(InImgPos);
                    $(MyElement).closest(".elementwrap").addClass(" "+OutImgPos);                 
                }
                else
                {
                    $(MyElement).closest(".elementwrap").detach().appendTo(".player-row."+OutImgPos);
                    $(MyElement).closest(".elementwrap").removeClass(InImgPos);
                    $(MyElement).closest(".elementwrap").addClass(" "+OutImgPos); 
                    $(MyClass).closest(".elementwrap").removeClass(OutImgPos);
                    $(MyClass).closest(".elementwrap").addClass(" "+InImgPos);
                }
            }
        }        
    }

    function ResetTeam()
    {
        $("#pitch").load(location.href+" #pitch>*","");
        $("#bench").load(location.href+" #bench>*","");
        $('#bank').text(CurrBank.toFixed(1)); 
        $('#xfrcost').text(0);
        $('#xfrcost').css('color', 'black');
        $('#notransfers').text(0);
        $('.status').prop('hidden', 'hidden'); 
        //Remove search and filters from datatable
        ResetFilters();
        dataTables.draw();  
        ImageSrc = "";
        playerID = 0;     
    };

    function OpenDialog(playername) 
    {
        $( "#dialog-noplayer" ).dialog({
            modal: true,
            title: "Selected: " +playername,
            width: "500",
            open: function (event, ui) {
                $('.ui-widget-overlay').bind('click', function () {
                    $("#dialog-noplayer").dialog('close');
                });
            }            
    });
    };

    function UpdateTeamIDs()
    {    
    // Get teams IDs
    $('.shirt').each(function() {
        var container = $(this);
        TeamArr.push(container.attr('player-id')); 
    });
    }

    function UpdateOriginalTeamIDs()
    {    
    // Get teams ID, Sell Price for Original lineup
    $('.shirt').each(function() {
        var container = $(this);
        OriginalTeamArr.push([container.attr('player-id'), container.attr('sell-price')]); 
    });
    }    

    function ResetFilters()
    {
        $.fn.dataTable.ext.search.pop();
        dataTables.columns(0).search("");
        $.fn.dataTableExt.afnFiltering.length = 0;
    }

    function DatatableFilter()
    {
        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {

            var bank = parseFloat($('#bank').text());                                            
            if(data[1] < bank)
            {
                if((data[3] < parseInt(TeamArr[0]) || data[3] > parseInt(TeamArr[0])) &&
                 (data[3] < parseInt(TeamArr[1]) || data[3] > parseInt(TeamArr[1])) &&
                 (data[3] < parseInt(TeamArr[2]) || data[3] > parseInt(TeamArr[2])) &&
                 (data[3] < parseInt(TeamArr[3]) || data[3] > parseInt(TeamArr[3])) &&
                 (data[3] < parseInt(TeamArr[4]) || data[3] > parseInt(TeamArr[4])) &&
                 (data[3] < parseInt(TeamArr[5]) || data[3] > parseInt(TeamArr[5])) &&
                 (data[3] < parseInt(TeamArr[6]) || data[3] > parseInt(TeamArr[6])) &&
                 (data[3] < parseInt(TeamArr[7]) || data[3] > parseInt(TeamArr[7])) &&
                 (data[3] < parseInt(TeamArr[8]) || data[3] > parseInt(TeamArr[8])) &&
                 (data[3] < parseInt(TeamArr[9]) || data[3] > parseInt(TeamArr[9])) &&
                 (data[3] < parseInt(TeamArr[10]) || data[3] > parseInt(TeamArr[10])) &&
                 (data[3] < parseInt(TeamArr[11]) || data[3] > parseInt(TeamArr[11])) &&
                 (data[3] < parseInt(TeamArr[12]) || data[3] > parseInt(TeamArr[12])) &&
                 (data[3] < parseInt(TeamArr[13]) || data[3] > parseInt(TeamArr[13])) &&
                 (data[3] < parseInt(TeamArr[14]) || data[3] > parseInt(TeamArr[14])))
                {                            
                    return true;
                }
            }
            return false;
          })         
    }

} );