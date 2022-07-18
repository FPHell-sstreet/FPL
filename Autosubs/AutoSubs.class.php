<?php

class AutoSubs
{
    function SetSubs()
    {
        $fpl = new FPL();
        $gameweek = $fpl->Get_Gameweek();
		$season = $fpl->Get_Season();

        echo date("h:i:sa") . "\t" . "Auto Subs started" . PHP_EOL;

        // Get Livegw
        $sql= "SELECT PlayerID, livegw.minutes, live_points, fixtures.finished_provisional FROM livegw 
        LEFT JOIN fixtures ON fixtures.id = livegw.fixture WHERE livegw.event=$gameweek";
        $liveinfo = $fpl->Get_SQL_Array($sql);

        // Get league entries
        $sql = "SELECT * FROM league_entries WHERE LeagueID=1454";
        $leagueinfo = $fpl->Get_SQL_Array($sql);

		// Get Players
		$sql = "SELECT id,element_type, web_name FROM players WHERE season='$season'"; 
        $playerinfo = $fpl->Get_SQL_Array($sql);

		//Reset Subs
		$sql = "UPDATE gameweek SET Sub1=NULL, Sub2=NULL, Sub3=NULL, Sub4=NULL, Sub5=NULL, Sub6=NULL, Sub7=NULL, Sub8=NULL, Sub9=NULL, Sub10=NULL, Sub11=NULL, 
        Sub12=NULL, Sub13=NULL, Sub14=NULL, Sub15=NULL WHERE event=$gameweek";	
		$fpl->SQLQueryHandler($sql, "gameweek", "single");
        
        // Get some managers
        $sql = "SELECT t.entry,overall_total,last_overall_points,gw.event_transfers_cost,gw.captain,gw.vice,gw.active_chip,gw.ID1,gw.Multiplier1,gw.ID2,gw.Multiplier2,gw.ID3,
        gw.Multiplier3,gw.ID4,gw.Multiplier4, gw.ID5,gw.Multiplier5,gw.ID6,gw.Multiplier6,gw.ID7,gw.Multiplier7,gw.ID8,gw.Multiplier8,gw.ID9,gw.Multiplier9,gw.ID10,gw.Multiplier10,
        gw.ID11,gw.Multiplier11, gw.ID12,gw.Multiplier12,gw.ID13,gw.Multiplier13,gw.ID14,gw.Multiplier14,gw.ID15,gw.Multiplier15
        FROM (SELECT entry FROM managers ORDER BY entry) q JOIN managers t ON t.entry = q.entry JOIN gameweek gw ON gw.entry = t.entry WHERE gw.event=$gameweek ORDER BY t.entry";
        $managerinfo = $fpl->Get_SQL_Array($sql);

		foreach ($managerinfo as $manager)
		{
			$subout = array();
			$subin = array();
			$sqlsub = "";

			// Available to sub on
			for ($i = 12; $i <= 15; $i+=1)
			{
				foreach ($playerinfo as $player)
				{
					$playerscore = 0;
					$playersmins = 0;
					$fixturecount = 0;
					$finished = 0;
					if($manager['ID' . $i] == $player['id'])
					{												
						foreach($liveinfo as $live)
						{	
							if ($manager['ID' . $i] == $live['PlayerID'])	
							{					
								$playerscore = $playerscore + ($live['live_points']);													
								$playersmins = $playersmins + $live['minutes'];
								$fixturecount = $fixturecount + 1;
								$finished = $finished + $live['finished_provisional'];
							}
						}

						if($fixturecount!=0 && $playersmins!=0 || $finished==0)
						{
							$subin[$i-11][0] = (int)$player['id'];
							$subin[$i-11][1] = (int)$player['element_type'];
							$subin[$i-11][2] = $playerscore;
						}
					}				
				}	
			}	

			// Available to sub out
			$captainblank=false;		
			for ($i = 1; $i <= 11; $i+=1)
			{
				foreach ($playerinfo as $player)
				{
					$playerscore = 0;
					$playersmins = 0;
					$fixturecount = 0;
					$finished = 0;
					if($manager['ID' . $i] == $player['id'])
					{												
						foreach($liveinfo as $live)
						{	
							if ($manager['ID' . $i] == $live['PlayerID'])	
							{					
								$playerscore = $playerscore + ($live['live_points'] * $manager['Multiplier' . $i]);														
								$playersmins = $playersmins + $live['minutes'];
								$fixturecount = $fixturecount + 1;
								$finished = $finished + $live['finished_provisional'];
							}
						}

						if($fixturecount==0 || $playersmins==0 && $finished>=$fixturecount)
						{
							if($manager['ID' . $i] == $manager['captain'])
							{
								$captainblank=true;
							}	
							$subout[$i][0] = (int)$player['id'];
							$subout[$i][1] = (int)$player['element_type'];					
						}
					}				
				}	
			}							
;		
			// Show team and points
			$defcount = 0;
			$midcount = 0;
			$forcount = 0;
			$totalscore = 0;			
			for ($i = 1; $i <= 11; $i+=1)
			{
				foreach ($playerinfo as $player)
				{
					$playerscore = 0;
					$playersmins = 0;
					$fixturecount = 0;
					$finished = 0;
					$isvice=0;
					if($manager['ID' . $i] == $player['id'])
					{
						// Count player types
						if($player['element_type']==2)
						{
							$defcount = $defcount + 1;
						}
						if($player['element_type']==3)
						{
							$midcount = $midcount + 1;
						}	
						if($player['element_type']==4)
						{
							$forcount = $forcount + 1;
						}				

						if($manager['ID' . $i] == $manager['vice'])
						{
							$isvice=1;
						}						

						foreach($liveinfo as $live)
						{	
							if ($manager['ID' . $i] == $live['PlayerID'])	
							{		
								if($captainblank==true && $isvice==1)
								{
									if($manager['active_chip']=='3xc')
									{
										$playerscore = $playerscore + ($live['live_points'] * 3);	
									}
									else
									{
										$playerscore = $playerscore + ($live['live_points'] * 2);	
									}									
								}
								else
								{
									$playerscore = $playerscore + ($live['live_points'] * $manager['Multiplier' . $i]);	
								}																					
								$playersmins = $playersmins + $live['minutes'];
								$fixturecount = $fixturecount + 1;
								$finished = $live['finished_provisional'];
							}
						}						

					}
					$totalscore = $totalscore + $playerscore;					
				}	
			}	

			// Show Subs and points
			$benchscore = 0;
			for ($i = 12; $i <= 15; $i+=1)
			{
				foreach ($playerinfo as $player)
				{
					$playerscore = 0;
					$playersmins = 0;
					$fixturecount = 0;
					$finished = 0;
					if($manager['ID' . $i] == $player['id'])
					{						
						foreach($liveinfo as $live)
						{	
							if ($manager['ID' . $i] == $live['PlayerID'])	
							{					
								$playerscore = $playerscore + $live['live_points'];														
								$playersmins = $playersmins + $live['minutes'];
								$fixturecount = $fixturecount + 1;
								$finished = $live['finished_provisional'];
							}
						}
					}
					$benchscore = $benchscore + $playerscore;					
				}	
				
			}

			// Sub Rules

			// Must have a goalkeeper
			foreach ($subout as $keyo => $subo)
			{
				foreach ($subin as $keyi => $subi)
				{
					if($subo[1]==1)
					{
						if($subi[1]==1)
						{
							for ($i = 1; $i <= 15; $i+=1)
							{
								if($manager['ID' . $i]==$subo[0] || $manager['ID' . $i]==$subi[0])
								{
									$sqlsub .= "Sub" . $i . "=1,";
								}
							}							
							$totalscore =  $totalscore + $subi[2];	
							unset($subin[$keyi]);
							unset($subout[$keyo]);							
							break;						
						}
					}
				}
			}

			// Must have 3 defenders
			foreach ($subout as $keyo => $subo)
			{
				foreach ($subin as $keyi => $subi)
				{
					if($subo[1]==2)
					{
						if($subi[1]==2)
						{
							if($defcount==3)
							{
								for ($i = 1; $i <= 15; $i+=1)
								{
									if($manager['ID' . $i]==$subo[0] || $manager['ID' . $i]==$subi[0])
									{
										$sqlsub .= "Sub" . $i . "=1,";
									}
								}								
								$totalscore =  $totalscore + $subi[2];	
								unset($subin[$keyi]);
								unset($subout[$keyo]);
								break;								
							}							
						}
					}
				}
			}	
			
			// Must have 2 midfielders
			foreach ($subout as $keyo => $subo)
			{
				foreach ($subin as $keyi => $subi)
				{
					if($subo[1]==3)
					{
						if($subi[1]==3)
						{
							if($midcount==2)
							{
								for ($i = 1; $i <= 15; $i+=1)
								{
									if($manager['ID' . $i]==$subo[0] || $manager['ID' . $i]==$subi[0])
									{
										$sqlsub .= "Sub" . $i . "=1,";
									}
								}								
								$totalscore =  $totalscore + $subi[2];	
								unset($subin[$keyi]);
								unset($subout[$keyo]);	
								break;							
							}							
						}
					}
				}
			}	
			
			// Must have 1 forward
			$subforwardcount=0;
			foreach ($subout as $keyo => $subo)
			{
				if($subo[1]==4)
				{
					$subforwardcount = $subforwardcount +1;
				}
				foreach ($subin as $keyi => $subi)
				{
					if($subo[1]==4)
					{						
						if($subi[1]==4)
						{
							if($forcount==1)
							{
								for ($i = 1; $i <= 15; $i+=1)
								{
									if($manager['ID' . $i]==$subo[0] || $manager['ID' . $i]==$subi[0])
									{
										$sqlsub .= "Sub" . $i . "=1,";
									}
								}								
								$totalscore =  $totalscore + $subi[2];	
								unset($subin[$keyi]);
								unset($subout[$keyo]);
								break;
								$subforwardcount = $subforwardcount -1;								
							}							
						}
					}
				}
			}	
			
			foreach ($subout as $keyo => $subo)
			{
				if($subo[1]==4)
				{
					if($forcount==$subforwardcount)
					{
						unset($subin[$keyi]);
						unset($subout[$keyo]);
						$subforwardcount = $subforwardcount -1;	
					}					
				}
			}
			
			// Normal Subs
			restart:
			foreach ($subout as $keyo => $subo)
			{
				foreach ($subin as $keyi => $subi)
				{
					if($subo[1]!=1)
					{
						if($subi[1]!=1)
						{
							for ($i = 1; $i <= 15; $i+=1)
							{
								if($manager['ID' . $i]==$subo[0] || $manager['ID' . $i]==$subi[0])
								{
									$sqlsub .= "Sub" . $i . "=1,";
								}
							}							
							$totalscore =  $totalscore + $subi[2];	
							unset($subin[$keyi]);
							unset($subout[$keyo]);	
							goto restart;				
						}
					}				
				}
			}	

			unset($subout);
			unset($subin);

			if($manager['active_chip']=='bboost')
			{
				$totalscore = $totalscore + $benchscore;
			}

			if($sqlsub!="")
			{
				$sqlsub = "," . rtrim($sqlsub, ",");
			}

			$sql .= "UPDATE gameweek SET GW_Points=$totalscore, Total_Points=$manager[last_overall_points]+$totalscore+$manager[event_transfers_cost] " . $sqlsub . " 
            WHERE entry=$manager[entry] AND event=" . $gameweek . ";";
		}        

        		// Update League Rank
		$sql .= "UPDATE league_entries l INNER JOIN(SELECT gw.entry, (RANK() OVER(ORDER BY Total_Points DESC, last_deadline_total_transfers ASC)) rn FROM gameweek gw LEFT JOIN managers ON managers.entry = gw.entry WHERE event=" . $gameweek . ") r	on r.entry = l.EntryID SET l.rank=r.rn;";

		if ($sql != "")
		{
			$sql = "START TRANSACTION;" . $sql . "COMMIT;";
			$fpl->SQLQueryHandler($sql, "gameweek", "multi");			
		}		
										
        echo date("h:i:sa") . "\t" . "Auto Subs finished" . PHP_EOL;
    }
    
}