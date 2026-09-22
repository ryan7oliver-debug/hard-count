"""Deeper pool. Compact rows:  name|school|year|tier|tag|attribute deltas
tier: h=heisman a=all-american c=all-conference w=walk-on. Stats = tier base + deltas + small stable per-player variation."""
import zlib
ATTRS = {'QB':['ARM','ACC','DEEP','MOB','IQ','POC','CLU','LEAD'],'RB':['SPD','POW','ELU','VIS','REC','PBK','STA','CLU'],
 'WR':['SPD','RTE','HND','YAC','CTR','BLK','IQ','CLU'],'OL':['RBK','PBK','STR','ANC','FT','IQ','DIS','STA'],
 'EDGE':['RSH','RS','STR','GET','MOT','STA','IQ','DIS'],'DB':['COV','TKL','SPD','BALL','IQ','PHY','STA','CLU'],
 'LB':['TKL','COV','RS','BLZ','SPD','STR','IQ','STA']}
BASE = {'h':83,'a':86,'c':84,'w':82}
TN = {'h':'heisman','a':'allamerican','c':'allconf','w':'walkon'}

QB = """
Joe Montana|Notre Dame|1978|a|Notre Dame's comeback king and the Chicken Soup Game legend.|ACC+2 IQ+6 CLU+10 LEAD+8 ARM-8 DEEP-8 MOB-4
Joe Namath|Alabama|1964|a|Broadway Joe, a national champion with a rocket arm.|ARM+8 DEEP+4 CLU+8 LEAD+4 MOB-8 POC-2
Warren Moon|Washington|1977|a|Huskies' Rose Bowl MVP who forced the league to pay attention.|ARM+6 DEEP+4 MOB+2 CLU+6 LEAD+4 IQ+2
Brett Favre|Southern Miss|1990|c|Golden Eagles gunslinger with a cannon and no fear.|ARM+10 DEEP+6 MOB+2 CLU+4 POC-8 IQ-8 ACC-4
Terry Bradshaw|Louisiana Tech|1969|c|Bulldogs' rocket-armed farm boy who went No. 1.|ARM+12 DEEP+8 MOB+2 ACC-8 IQ-6 POC-4
Dan Fouts|Oregon|1972|c|Ducks' pinpoint passer with a quick release.|ACC+6 IQ+6 POC+2 ARM+2 MOB-16
Jim Harbaugh|Michigan|1986|c|Wolverines' Rose Bowl-guaranteeing field general.|LEAD+8 CLU+6 IQ+4 ARM-4 DEEP-6 MOB-2
Ben Roethlisberger|Miami (OH)|2003|c|Big Ben, the RedHawks' huge, hard-to-bring-down passer.|ARM+6 POC+8 CLU+4 DEEP+2 IQ-2
Matthew Stafford|Georgia|2008|c|Bulldogs' cannon-armed leader.|ARM+12 DEEP+8 ACC-2 IQ-4 MOB-6
Justin Herbert|Oregon|2019|a|Ducks' prototype-sized Rose Bowl winner.|ARM+8 DEEP+4 IQ+2 CLU-4 LEAD+2
Jordan Love|Utah State|2018|c|Aggies' big-armed gunslinger.|ARM+10 DEEP+8 ACC-6 IQ-8
Zach Wilson|BYU|2020|a|Cougars' improvising sensation in a near-perfect season.|ACC+6 MOB+8 ARM+4 DEEP+2 POC-6 IQ-2
Mitch Trubisky|North Carolina|2016|c|Tar Heels' one-year wonder with a smooth release.|ACC+6 MOB+2 ARM-2
Jared Goff|California|2015|c|Cal's record-setting, poised pocket passer.|ACC+6 IQ+2 POC+2 MOB-12
Kirk Cousins|Michigan State|2011|w|Spartans' steady, tough-minded leader.|IQ+6 POC+4 LEAD+6 CLU+4 ARM-8 MOB-6 DEEP-4
Ryan Tannehill|Texas A&M|2011|w|Aggies' converted receiver who learned quarterback on the fly.|MOB+4 ARM+2 ACC-2 IQ-4
Andy Dalton|TCU|2010|w|Horned Frogs' Rose Bowl-winning redhead.|IQ+6 POC+4 CLU+6 LEAD+6 ARM-10 DEEP-10 MOB-2
Dwayne Haskins|Ohio State|2018|a|Buckeyes' record-shattering one-year star.|ARM+8 ACC+4 DEEP+6 POC+2 MOB-18 IQ-2
J.T. Barrett|Ohio State|2016|c|Buckeyes' dual-threat, program-record setter.|MOB+8 IQ+6 LEAD+8 CLU+4 ARM-10 DEEP-10
Braxton Miller|Ohio State|2013|c|Two-time Big Ten Offensive Player of the Year, all jukes and speed.|MOB+14 ARM-6 ACC-6 DEEP-6 POC-4
Tajh Boyd|Clemson|2012|c|Tigers' Orange Bowl-winning record-setter.|ARM+4 MOB+4 CLU+4 IQ-2 ACC-2
Geno Smith|West Virginia|2012|c|Mountaineers' record-setting, accurate passer.|ACC+8 ARM+2 DEEP+2 MOB+2
Chad Pennington|Marshall|1999|c|Thundering Herd's cerebral, accurate passer.|ACC+6 IQ+8 POC+4 ARM-8 MOB-10 DEEP-6
Byron Leftwich|Marshall|2002|c|Thundering Herd's gutsy, cannon-armed passer who played through pain.|ARM+10 DEEP+6 CLU+8 LEAD+8 MOB-20
Carson Wentz|North Dakota State|2015|c|Bison's FCS dynasty passer.|ARM+6 POC+6 MOB+2 IQ+2
Sam Darnold|USC|2016|c|Trojans' Rose Bowl-winning gunslinger.|ARM+4 MOB+4 POC-2 IQ-2 CLU+2
Kurt Warner|Northern Iowa|1993|w|The grocery-store backup who became a legend.|ACC+8 IQ+8 CLU+8 LEAD+4 ARM-6 MOB-8 DEEP-4
Trent Dilfer|Fresno State|1993|w|Bulldogs' big-armed, gutsy passer.|ARM+10 DEEP+4 CLU+2 IQ-6 ACC-4 MOB-4
Jake Plummer|Arizona State|1996|c|Sun Devils' Rose Bowl scrambler.|MOB+8 CLU+8 ARM+4 IQ-6 POC-4
Cade McNown|UCLA|1998|c|Bruins' dual-threat Pac-10 champion.|MOB+6 ARM+2 CLU+4 IQ-2 ACC-2
Akili Smith|Oregon|1998|w|Ducks' one-year wonder with a big arm.|ARM+8 MOB+6 DEEP+4 IQ-10 POC-6
Jordan Travis|Florida State|2023|c|Seminoles' dual-threat leader of an undefeated ACC champ.|MOB+10 IQ+2 LEAD+6 ARM-4 DEEP-4
Spencer Rattler|South Carolina|2023|w|Gamecocks' strong-armed transfer after a start at Oklahoma.|ARM+8 DEEP+4 MOB+2 IQ-4 POC-4
Quinn Ewers|Texas|2023|c|Longhorns' precise Big 12 champion.|ACC+6 ARM+6 POC+2 MOB-10
Will Levis|Kentucky|2022|w|Wildcats' cannon-armed, heavy-duty passer.|ARM+12 DEEP+6 ACC-8 IQ-4 POC-4
Anthony Richardson|Florida|2022|w|Gators' ultra-athletic, raw-armed freak.|MOB+14 ARM+10 DEEP+6 ACC-14 IQ-10 POC-8
Malik Willis|Liberty|2021|w|Flames' electric dual-threat transfer.|MOB+16 ARM+8 ACC-10 IQ-8 POC-6
Kenny Pickett|Pittsburgh|2021|a|Panthers' ACC Player of the Year and program-record passer.|ACC+4 IQ+6 POC+2 LEAD+8 ARM-6 MOB-2 DEEP-4
Cam Ward|Miami (FL)|2024|a|Hurricanes' gunslinging record-setter.|ARM+8 DEEP+6 MOB+4 ACC-2 POC-2
Dillon Gabriel|Oregon|2024|a|Ducks' record-setting transfer and decision-maker.|ACC+6 IQ+6 LEAD+4 ARM-6 DEEP-6
Jalen Milroe|Alabama|2023|w|Tide's dual-threat with a ton of raw upside.|MOB+14 ARM+6 DEEP+6 ACC-14 IQ-8
Jaxson Dart|Ole Miss|2023|c|Rebels' dual-threat leader and bowl winner.|MOB+4 ARM+4 ACC-2
Desmond Ridder|Cincinnati|2021|c|Bearcats' unbeaten regular-season leader.|MOB+8 LEAD+8 IQ+2 ARM-6 DEEP-6
Terrelle Pryor|Ohio State|2010|w|Buckeyes' 6'6" athletic freak.|MOB+14 ARM+8 ACC-14 IQ-10 POC-6
Brandon Weeden|Oklahoma State|2011|w|Cowboys' 28-year-old record-setting passer.|ARM+8 DEEP+6 ACC+2 MOB-16 POC+2
"""

RB = """
Walter Payton|Jackson State|1974|a|Sweetness, the SWAC's unstoppable back.|SPD+4 POW+8 ELU+6 VIS+8 STA+10 PBK+4 CLU+6 REC+2
Eric Dickerson|SMU|1982|a|Pony Express workhorse with a graceful, upright stride.|SPD+10 POW+4 ELU+2 VIS+2 STA+4 REC-6 PBK-6
Marshall Faulk|San Diego State|1993|a|Aztecs' do-everything back who ran, caught, and returned.|SPD+6 ELU+8 VIS+8 REC+10 POW-8 PBK-2
Fred Taylor|Florida|1997|c|Gators' smooth big-play back.|SPD+6 ELU+2 POW+2 VIS+2 PBK-4
Jamal Lewis|Tennessee|1999|c|Volunteers' punishing north-south hammer.|POW+10 SPD+2 ELU-6 STA+4 REC-8
Thomas Jones|Virginia|1999|c|Cavaliers' tough, patient runner.|POW+4 VIS+4 STA+4 SPD-2 ELU-2
Ahman Green|Nebraska|1997|c|Cornhuskers' powerful, fast national champion.|SPD+6 POW+4 STA+2 ELU-2
Priest Holmes|Texas|1996|c|Longhorns' patient, complete back.|VIS+4 REC+4 PBK+4 STA+2 SPD-2
Warrick Dunn|Florida State|1996|c|Seminoles' small but shifty national champion.|SPD+6 ELU+10 REC+4 POW-14 STA+2
Errict Rhett|Florida|1993|c|Gators' workhorse rusher.|POW+6 STA+6 VIS+2 SPD-4 ELU-4
Rudi Johnson|Auburn|2000|c|Tigers' physical, workmanlike runner.|POW+8 STA+4 SPD-2 ELU-6 REC-6
Brian Westbrook|Villanova|2001|c|Wildcats' FCS record-setter with elite hands.|SPD+4 ELU+10 REC+10 VIS+4 POW-10
Larry Johnson|Penn State|2002|a|Nittany Lions' Maxwell and Doak Walker winner.|POW+8 STA+8 SPD+2 VIS+4 ELU-2 CLU+4
Cadillac Williams|Auburn|2004|c|Tigers' Sugar Bowl-winning back.|SPD+4 POW+4 CLU+6 STA+2
Ronnie Brown|Auburn|2004|c|Tigers' perfect-season back with nice hands.|POW+4 REC+4 PBK+4 SPD+2 CLU+2
Beanie Wells|Ohio State|2008|w|Buckeyes' big, powerful runner.|POW+8 SPD+2 ELU-4 STA-2 REC-6
Eddie Lacy|Alabama|2012|w|Tide's bruising, dancing-feet national champion.|POW+8 ELU+6 STA+2 SPD-4 REC-4
T.J. Yeldon|Alabama|2013|c|Tide's smooth, versatile 1,000-yard back.|SPD+2 ELU+4 REC+4 VIS+2
Bishop Sankey|Washington|2013|c|Huskies' single-season rushing record-setter.|ELU+6 SPD+4 VIS+4 STA+4 POW-6
Ka'Deem Carey|Arizona|2013|c|Wildcats' back-to-back 1,800-yard runner.|ELU+8 VIS+6 STA+6 POW-2 REC-8
Tevin Coleman|Indiana|2014|c|Hoosiers' speedy 2,000-yard back.|SPD+10 STA+4 ELU+2 POW-6 REC-4
Marlon Mack|South Florida|2016|c|Bulls' all-time rushing leader.|SPD+8 ELU+4 STA+4 POW-2
Samaje Perine|Oklahoma|2016|c|Sooners' single-game rushing record-setter.|POW+8 STA+6 SPD-4 ELU-6 REC-8
Royce Freeman|Oregon|2017|c|Ducks' all-time leading rusher.|POW+6 STA+6 SPD-2 VIS+2
Bryce Love|Stanford|2017|a|Cardinal's Heisman runner-up with track speed.|SPD+12 ELU+6 STA-2 POW-10 REC-6 PBK-4
Devin Singletary|Florida Atlantic|2018|c|Owls' scoring machine.|ELU+10 VIS+6 SPD+2 POW-8 STA+2
Miles Sanders|Penn State|2018|c|Nittany Lions' explosive, patient back.|SPD+6 VIS+4 ELU+4 POW-2
Benny Snell|Kentucky|2018|w|Wildcats' all-time rushing leader.|POW+8 STA+6 SPD-8 ELU-4
Zack Moss|Utah|2019|c|Utes' powerful, all-time rushing leader.|POW+8 ELU+2 STA+4 SPD-4
J.K. Dobbins|Ohio State|2019|a|Buckeyes' record-setting explosive runner.|SPD+6 ELU+6 VIS+4 POW+2 STA+2
Cam Akers|Florida State|2019|w|Seminoles' powerful, versatile grinder.|POW+4 ELU+4 REC+2 STA+2
Clyde Edwards-Helaire|LSU|2019|c|Tigers' small, quick national champion.|ELU+6 REC+8 SPD+2 VIS+4 POW-10
Chuba Hubbard|Oklahoma State|2019|c|Cowboys' 2,000-yard sprinter.|SPD+10 STA+4 ELU+2 POW-6 REC-4
Kyren Williams|Notre Dame|2021|c|Irish's shifty, sure-handed back.|ELU+8 REC+6 PBK+6 SPD-2 POW-8
Isiah Pacheco|Rutgers|2021|w|Scarlet Knights' aggressive, physical back.|POW+8 SPD+4 STA+2 CLU+4 REC-8
Tyler Allgeier|BYU|2021|c|Cougars' 1,600-yard workhorse.|POW+6 STA+6 ELU-4
Blake Corum|Michigan|2023|a|Wolverines' national champion who lived at the goal line.|ELU+6 VIS+6 CLU+8 SPD-2 STA+4
Zach Charbonnet|UCLA|2022|c|Bruins' balanced, powerful transfer.|POW+6 REC+4 VIS+4 SPD-2
Bucky Irving|Oregon|2023|c|Ducks' shifty, small back.|ELU+8 SPD+2 REC+4 POW-10
Trey Benson|Florida State|2023|c|Seminoles' big, fast transfer.|SPD+8 POW+4
Ashton Jeanty|Boise State|2024|a|Broncos' Doak Walker winner and near-Heisman rusher.|POW+8 ELU+10 VIS+8 STA+6 REC+2
Omarion Hampton|North Carolina|2024|c|Tar Heels' bruising, powerful back.|POW+8 STA+6 VIS+4 SPD-2
TreVeyon Henderson|Ohio State|2024|c|Buckeyes' explosive, versatile playoff back.|SPD+8 ELU+6 REC+4 POW-6
Kaleb Johnson|Iowa|2024|c|Hawkeyes' 1,500-yard power-and-speed back.|POW+6 SPD+4 STA+4 ELU-2
Quinshon Judkins|Ohio State|2024|c|Buckeyes' physical transfer who started in Oxford.|POW+8 STA+4 VIS+2 SPD-4
Cam Skattebo|Arizona State|2024|c|Sun Devils' hard-running, heart-of-a-lion back.|POW+10 STA+8 CLU+6 SPD-8 ELU-4
Garrison Hearst|Georgia|1992|c|Bulldogs' Doak Walker-winning back.|SPD+4 POW+4 VIS+2 STA+2
Terrell Davis|Georgia|1994|w|The one-year Bulldog who became a Hall of Famer.|VIS+8 SPD+2 POW+2 STA+4
Ottis Anderson|Miami (FL)|1978|c|Hurricanes' big, physical back.|POW+8 STA+4 SPD-2 ELU-6
Billy Cannon|LSU|1959|a|Tigers' Heisman winner and Halloween-night legend.|SPD+8 POW+6 ELU+2 CLU+10 STA+4
"""

WR = """
Fred Biletnikoff|Florida State|1964|a|Seminoles' sticky-handed namesake of the receiving award.|HND+12 RTE+8 CTR+4 IQ+6 SPD-12 YAC-8 BLK-2
Lynn Swann|USC|1973|a|Trojans' balletic, acrobatic receiver.|HND+4 CTR+8 CLU+8 YAC+4 SPD+2 BLK-2
Art Monk|Syracuse|1979|c|Orange's strong, reliable possession man.|HND+6 CTR+4 BLK+4 IQ+4 SPD-4 YAC-2
Henry Ellard|Fresno State|1982|c|Bulldogs' record-setting receiver and returner.|SPD+6 YAC+6 HND+2 CTR-6 BLK-6
Irving Fryar|Nebraska|1983|c|Cornhuskers' explosive playmaker.|SPD+6 YAC+6 BLK-2
Eric Moulds|Mississippi State|1995|c|Bulldogs' physical, powerful receiver.|CTR+8 YAC+4 HND+2 BLK+2 SPD-4
Joey Galloway|Ohio State|1994|c|Buckeyes' speed merchant.|SPD+10 YAC+4 CTR-8 BLK-6
Terry Glenn|Ohio State|1995|a|Buckeyes' 17-touchdown playmaker.|SPD+6 RTE+4 HND+4 YAC+4 CTR-2 BLK-6
Peter Warrick|Florida State|1999|a|Seminoles' national-title-winning playmaker.|SPD+4 YAC+8 RTE+4 HND+2 CTR-4
Plaxico Burress|Michigan State|1999|c|Spartans' giant jump-ball specialist.|CTR+12 HND+4 SPD-6 YAC-6 RTE-2
Roy E. Williams|Texas|2003|a|Longhorns' big-bodied star.|CTR+8 HND+4 RTE+2 BLK+2
Anquan Boldin|Florida State|2002|c|Seminoles' tough, physical possession receiver.|CTR+10 HND+4 YAC+6 BLK+6 SPD-6
Vincent Jackson|Northern Colorado|2005|w|Bears' big-bodied small-school deep threat.|CTR+8 SPD+2 RTE-6 YAC-4
Lee Evans|Wisconsin|2003|c|Badgers' fast, record-setting deep threat.|SPD+8 HND+2 RTE+2 CTR-6 BLK-4
Greg Jennings|Western Michigan|2005|w|Broncos' smooth, dependable star.|RTE+6 HND+4 YAC+2 CTR-4
Jeremy Maclin|Missouri|2008|c|Tigers' all-purpose speedster.|SPD+8 YAC+8 RTE+2 CTR-8 BLK-4
DeSean Jackson|California|2007|c|Bears' blazing, return-game-breaking playmaker.|SPD+10 YAC+8 CTR-10 BLK-10
Julian Edelman|Kent State|2008|w|Golden Flashes' quarterback-turned-slot-weapon.|RTE+8 YAC+6 IQ+6 CLU+6 SPD-2 CTR-8
Jordan Matthews|Vanderbilt|2013|c|Commodores' SEC-record receiver.|RTE+6 HND+6 CTR+4 IQ+4 SPD-4
Allen Robinson|Penn State|2013|c|Nittany Lions' physical, contested-catch star.|CTR+8 HND+4 RTE+2 SPD-4
Davante Adams|Fresno State|2013|c|Bulldogs' record-setting route runner.|RTE+8 HND+6 CTR+4 CLU+4 SPD-4
Randall Cobb|Kentucky|2010|c|Wildcats' do-it-all weapon.|YAC+8 SPD+2 RTE+2 BLK-4
Kenny Golladay|Northern Illinois|2016|c|Huskies' big, contested-catch specialist.|CTR+10 HND+2 SPD-2 RTE-4
Michael Thomas|Ohio State|2015|c|Buckeyes' route-running technician.|RTE+8 HND+6 CTR+2 SPD-4 BLK+2
Corey Davis|Western Michigan|2016|a|Broncos' all-time FBS receiving-yardage leader.|RTE+6 HND+6 CTR+6 CLU+6 SPD-2
John Ross|Washington|2016|c|Huskies' record-setting 40-yard-dash sensation.|SPD+14 YAC+4 CTR-12 BLK-8 HND-2
D.J. Moore|Maryland|2017|c|Terrapins' explosive, versatile playmaker.|SPD+4 YAC+8 RTE+2 CTR-2
Courtland Sutton|SMU|2017|c|Mustangs' 6'4" jump-ball ace.|CTR+10 HND+2 RTE-4 YAC-2
Christian Kirk|Texas A&M|2017|c|Aggies' explosive slot and returner.|YAC+8 SPD+4 RTE+4 CTR-8
N'Keal Harry|Arizona State|2018|c|Sun Devils' physical, jumbo-sized target.|CTR+10 YAC+6 SPD-4 BLK+2
A.J. Brown|Ole Miss|2018|a|Rebels' powerful, YAC-monster receiver.|YAC+10 CTR+8 SPD+2 BLK+6 RTE-2
Tyler Lockett|Kansas State|2014|c|Wildcats' shifty, big-play receiver and returner.|SPD+6 RTE+6 YAC+6 CTR-8 BLK-6
Cole Beasley|SMU|2011|w|Mustangs' small, sudden slot.|RTE+8 YAC+4 CTR-10 BLK-6
Tyreek Hill|West Alabama|2015|c|Tigers' blazing return-game star after a fresh start.|SPD+14 YAC+8 CTR-12 BLK-10 HND-2
Josh Gordon|Baylor|2010|c|Bears' explosive, long-striding deep threat.|SPD+6 CTR+4 YAC+2 RTE-2 IQ-10
Kendall Wright|Baylor|2011|c|Bears' 1,600-yard playmaker.|SPD+6 RTE+6 YAC+6 CTR-4
Tavon Austin|West Virginia|2012|a|Mountaineers' all-purpose, video-game star.|SPD+10 YAC+10 RTE+4 CTR-12 BLK-10
Rashee Rice|SMU|2022|c|Mustangs' physical, YAC-heavy star.|YAC+8 CTR+6 SPD-2 BLK+4
Zay Flowers|Boston College|2022|c|Eagles' dynamic, all-time receiving leader.|SPD+6 RTE+6 YAC+6 CTR-8 BLK-4
Quentin Johnston|TCU|2022|c|Horned Frogs' huge, big-play target.|CTR+8 YAC+8 SPD+2 RTE-8 HND-4
Jordan Addison|Pittsburgh|2021|a|Panthers' Biletnikoff-winning route runner.|RTE+8 HND+4 SPD+2 IQ+2 CTR-6 BLK-6
Jahan Dotson|Penn State|2021|c|Nittany Lions' reliable, sure-handed weapon.|RTE+6 HND+6 YAC+2 CTR-6
Drake London|USC|2021|c|Trojans' giant, contested-catch, basketball-bred star.|CTR+12 HND+4 IQ+2 SPD-6 YAC-2
Treylon Burks|Arkansas|2021|c|Razorbacks' power-and-YAC wideout.|YAC+8 CTR+4 SPD+2 RTE-6
Chris Godwin|Penn State|2016|c|Nittany Lions' big-game, contested-catch star.|CTR+6 HND+4 YAC+4 BLK+4
Tyler Boyd|Pittsburgh|2015|c|Panthers' record-setting slot.|RTE+8 HND+4 YAC+2 CTR-6
Keenan Allen|California|2011|c|Bears' smooth, physical possession target.|RTE+8 HND+4 CTR+2 CLU+2
"""

OL = """
Dan Dierdorf|Michigan|1970|a|Wolverines' massive, punishing Hall-of-Fame tackle.|STR+8 RBK+6 ANC+4 STA-2 FT-4
Joe DeLamielleure|Michigan State|1972|a|Spartans' pulling-guard force of nature.|RBK+8 STR+4 STA+2 PBK-2
Jim Otto|Miami (FL)|1959|c|Hurricanes' ironman center.|IQ+6 STR+2 STA+8 ANC-2
Tom Mack|Michigan|1965|c|Wolverines' rugged, pulling guard.|RBK+4 STR+4 STA+2
Walter Jones|Alabama|1996|a|Tide's rare mix of size and athleticism.|PBK+10 FT+8 ANC+4 STR+2 STA+2
Willie Roaf|Louisiana Tech|1992|c|Bulldogs' quick, athletic tackle.|PBK+6 FT+6 STR+2
Dermontti Dawson|Kentucky|1987|c|Wildcats' quick, smart center.|FT+8 IQ+6 RBK+2 STR-4
Kevin Mawae|LSU|1993|c|Tigers' tough, cerebral center.|IQ+8 DIS+6 RBK+2 STR-2
Nick Hardwick|Purdue|2003|w|Boilermakers' intelligent, sturdy center.|IQ+6 ANC+4 DIS+4 STR-2
Olin Kreutz|Washington|1997|c|Huskies' undersized-but-nasty center.|STR+4 IQ+4 DIS+2 STA+2
Matt Birk|Harvard|1997|w|Crimson's smart, sturdy Ivy League center.|IQ+8 DIS+6 STR+2 FT-2
Kris Dielman|Indiana|2002|w|Hoosiers' nasty, hard-nosed lineman.|STR+4 DIS-2 ANC+2 STA+4
Marshal Yanda|Iowa|2006|c|Hawkeyes' technician and dependable anchor.|RBK+6 STR+4 IQ+4 DIS+4 FT+2
Logan Mankins|Fresno State|2004|c|Bulldogs' powerful, mean-streak guard.|STR+8 RBK+6 ANC+2 FT-4
Mike Iupati|Idaho|2009|c|Vandals' 331-pound road-grader.|STR+10 RBK+8 ANC+6 FT-8 STA-4
Anthony Castonzo|Boston College|2010|c|Eagles' smart, technical left tackle.|PBK+6 IQ+6 FT+6 STR-2
Nate Solder|Colorado|2010|c|Buffaloes' converted tight end turned left tackle.|PBK+6 FT+4 STR-2 ANC-2
Ben Grubbs|Auburn|2006|c|Tigers' powerful guard.|STR+6 RBK+6 ANC+2 FT-4
Michael Oher|Ole Miss|2008|c|Rebels' massive blindside protector.|PBK+6 STR+4 ANC+2 FT-2 IQ-4
Cordy Glenn|Georgia|2011|c|Bulldogs' massive, rolling tackle.|STR+8 ANC+6 RBK+2 FT-6
Kyle Long|Oregon|2012|w|Ducks' athletic converted defensive lineman.|STR+4 FT+2 RBK+4 IQ-6
Chance Warmack|Alabama|2012|a|Tide's bulldozing national-title guard.|RBK+8 STR+8 ANC+4 FT-6
Jonathan Cooper|North Carolina|2012|c|Tar Heels' athletic, technique-driven guard.|FT+8 RBK+4 PBK+4 STR-4
D.J. Fluker|Alabama|2012|c|Tide's huge, nasty tackle.|STR+8 RBK+6 ANC+6 FT-8 STA-2
Barrett Jones|Alabama|2012|a|Tide's Outland winner and national champion at three positions.|IQ+10 FT+6 DIS+6 RBK+2
La'el Collins|LSU|2014|c|Tigers' tough, versatile tackle-guard.|STR+6 RBK+6 PBK+2 FT-2
Brandon Brooks|Miami (OH)|2011|w|RedHawks' massive, athletic guard.|STR+8 RBK+6 ANC+2 FT-4
Cody Whitehair|Kansas State|2015|c|Wildcats' smart, versatile lineman.|IQ+6 FT+4 RBK+2 STR-2
Taylor Decker|Ohio State|2015|c|Buckeyes' anchor at left tackle.|PBK+4 STR+4 ANC+4 DIS+4
Isaiah Wynn|Georgia|2017|c|Bulldogs' quick-footed tackle-guard.|FT+8 PBK+4 RBK+2 STR-6
Connor Williams|Texas|2016|c|Longhorns' athletic, dependable tackle.|PBK+6 RBK+4 STR+2 FT+2
Mike McGlinchey|Notre Dame|2017|c|Irish's massive, physical right tackle.|RBK+6 STR+6 ANC+4 FT-2
Kolton Miller|UCLA|2017|w|Bruins' long, athletic left tackle.|PBK+4 FT+4 STR-4 ANC-2
Orlando Brown Jr.|Oklahoma|2017|c|Sooners' giant, physical tackle.|STR+8 ANC+8 RBK+4 FT-8
Erik McCoy|Texas A&M|2018|c|Aggies' tough, technical center.|IQ+6 STR+2 DIS+4 ANC+2
Garrett Bradbury|NC State|2018|a|Wolfpack's Rimington Trophy-winning center.|FT+8 IQ+8 RBK+6 STR-2
Charles Cross|Mississippi State|2021|c|Bulldogs' Air Raid pass blocker.|PBK+8 FT+6 STR-4 RBK-4
Evan Neal|Alabama|2021|a|Tide's massive, athletic blindside protector.|STR+6 ANC+6 PBK+2 FT+2
Ikem Ekwonu|NC State|2021|c|Wolfpack's pancake-machine tackle.|RBK+10 STR+6 DIS-2 FT-2
Trevor Penning|Northern Iowa|2021|w|Panthers' nasty, small-school tackle.|RBK+8 STR+6 DIS-4 FT-2
Peter Skoronski|Northwestern|2022|c|Wildcats' smart, technically brilliant tackle.|PBK+8 FT+8 IQ+8 STR-6 ANC-2
Paris Johnson Jr.|Ohio State|2022|c|Buckeyes' long, athletic left tackle.|PBK+6 FT+6 ANC+2 RBK-2
Olu Fashanu|Penn State|2023|a|Nittany Lions' massive, blindside-protecting star.|PBK+8 FT+4 ANC+4 STR+2
JC Latham|Alabama|2023|c|Tide's mauling right tackle.|RBK+8 STR+8 ANC+4 FT-4
Cooper Beebe|Kansas State|2023|c|Wildcats' powerful, run-blocking guard.|RBK+8 STR+6 ANC+4 FT-6
"""

EDGE = """
Leonard Little|Tennessee|1997|c|Volunteers' fast, relentless rusher.|RSH+8 GET+8 MOT+4 STR-6
Kevin Carter|Florida|1994|c|Gators' athletic, powerful end.|RSH+6 STR+4 GET+4 RS+2
Patrick Kerney|Virginia|1998|c|Cavaliers' motor-driven end.|MOT+8 RSH+4 RS+2 STR-2
Jason Taylor|Akron|1996|c|Zips' long, athletic rusher.|RSH+6 GET+6 STA+4 STR-6
Trevor Pryce|Clemson|1996|c|Tigers' big, athletic tackle.|STR+6 RSH+4 GET+2 IQ-2
Adewale Ogunleye|Indiana|2000|w|Hoosiers' hard-working, powerful end.|RSH+6 STR+4 MOT+6 IQ-2
John Abraham|South Carolina|1999|c|Gamecocks' explosive, quick-twitch edge.|GET+10 RSH+8 RS-4 STR-4
Kyle Vanden Bosch|Nebraska|2000|c|Cornhuskers' relentless, motor-first end.|MOT+10 STA+6 STR+2 GET-4
Chris Long|Virginia|2007|c|Cavaliers' Lombardi finalist with the family motor.|MOT+8 IQ+6 RSH+2
Vernon Gholston|Ohio State|2007|c|Buckeyes' freakish athletic rusher.|GET+8 STR+6 RSH+4 IQ-6 DIS-2
LaMarr Woodley|Michigan|2006|c|Wolverines' Lombardi winner and pass-rush terror.|RSH+6 STR+6 MOT+4 STA+2
Cameron Wake|Penn State|2004|w|Nittany Lions' late-bloomer who went undrafted.|GET+8 RSH+6 STR+2 IQ-4
Robert Mathis|Alabama A&M|2002|c|Bulldogs' strip-sack artist.|GET+8 RSH+8 MOT+4 STR-8 RS-6
Greg Hardy|Ole Miss|2009|w|Rebels' big, athletic end.|GET+6 RSH+6 STR+4 DIS-6 IQ-4
Brandon Graham|Michigan|2009|c|Wolverines' relentless, powerful end.|MOT+8 STR+6 RS+4 RSH+2
Cliff Avril|Purdue|2007|c|Boilermakers' quick-first-step rusher.|GET+8 RSH+8 STR-6 RS-4
Everson Griffen|USC|2009|w|Trojans' powerful, athletic rusher.|STR+4 GET+4 RSH+2 IQ-4
Carlos Dunlap|Florida|2009|c|Gators' 6'6" pass-rush disruptor.|RSH+6 GET+6 STR+2 DIS-2
Ryan Kerrigan|Purdue|2010|c|Boilermakers' tireless, technical edge.|MOT+8 IQ+6 RSH+2 STR-2 GET-2
Justin Houston|Georgia|2010|c|Bulldogs' sack-heavy edge.|RSH+8 GET+6 MOT+4 STR-2
Aldon Smith|Missouri|2010|c|Tigers' long, explosive pass rusher.|RSH+8 GET+6 STR-4 RS-4
Melvin Ingram|South Carolina|2011|c|Gamecocks' versatile, athletic edge.|RSH+4 STR+4 GET+4 MOT+4
Whitney Mercilus|Illinois|2011|c|Illini's sack-and-strip machine.|RSH+8 MOT+6 GET+4 STR-2
Chandler Jones|Syracuse|2011|c|Orange's long, athletic edge.|RSH+6 GET+4 RS+2 STR-2
Sheldon Richardson|Missouri|2012|c|Tigers' disruptive, athletic tackle.|GET+8 RSH+6 STR+2 IQ-4
Ezekiel Ansah|BYU|2012|w|Cougars' raw, ultra-athletic late bloomer.|GET+8 STR+4 RSH+4 IQ-8
Anthony Barr|UCLA|2013|c|Bruins' converted running back pass rusher.|GET+8 RSH+6 STR-4 IQ-4
Dee Ford|Auburn|2013|c|Tigers' explosive, quick edge.|GET+8 RSH+8 STR-6 RS-4
Trey Flowers|Arkansas|2014|c|Razorbacks' powerful, technical end.|STR+6 RS+6 RSH+2 IQ+2
Shaq Barrett|Colorado State|2013|w|Rams' motor-heavy edge.|MOT+8 RSH+4 STA+4 STR-4
Leonard Williams|USC|2014|a|Trojans' powerful, versatile lineman.|STR+8 RS+6 RSH+4 GET+2
Vic Beasley|Clemson|2014|c|Tigers' record-setting, explosive pass rusher.|GET+8 RSH+8 STR-6 RS-6
Dante Fowler Jr.|Florida|2014|c|Gators' explosive, versatile edge.|GET+6 RSH+6 MOT+4 IQ-4
Bud Dupree|Kentucky|2014|c|Wildcats' athletic freak rusher.|GET+6 RSH+4 STR+2 IQ-4
Yannick Ngakoue|Maryland|2015|c|Terrapins' quick, bendy sack artist.|GET+8 RSH+8 STR-8 RS-4
Carl Nassib|Penn State|2015|a|Nittany Lions' Lombardi winner and former walk-on.|MOT+10 RSH+6 IQ+2 STR-2 GET-4
Derek Barnett|Tennessee|2016|c|Volunteers' all-time sack leader.|RSH+6 MOT+6 STR+2 GET-2
Solomon Thomas|Stanford|2016|c|Cardinal's powerful, versatile lineman.|STR+6 RS+4 MOT+4 RSH+2
Jonathan Allen|Alabama|2016|a|Tide's Nagurski Trophy winner.|STR+8 RS+8 RSH+6 GET+2 IQ+2
Bradley Chubb|NC State|2017|a|Wolfpack's Nagurski Trophy winner.|RSH+8 RS+6 STR+4 GET+4
Rashan Gary|Michigan|2018|c|Wolverines' massive, explosive top recruit.|STR+8 GET+4 RSH+2 IQ-4
Gregory Rousseau|Miami (FL)|2019|c|Hurricanes' long, athletic rusher.|RSH+6 STR+2 GET+2 IQ-4
Jaelan Phillips|Miami (FL)|2020|a|Hurricanes' comeback-story edge.|RSH+8 GET+6 STR+2 IQ+2 MOT+4
A.J. Epenesa|Iowa|2019|c|Hawkeyes' powerful, technical end.|STR+6 RS+4 RSH+4 IQ+2
Kwity Paye|Michigan|2020|c|Wolverines' powerful, high-motor end.|MOT+6 STR+6 RS+4
"""

DB = """
Mike Haynes|Arizona State|1975|c|Sun Devils' shutdown corner.|COV+10 SPD+4 IQ+4 BALL+2
Kenny Easley|UCLA|1980|a|Bruins' bone-rattling safety.|TKL+8 PHY+10 BALL+4 COV+2 IQ+4
Darrell Green|Texas A&I|1982|c|Javelinas' blazing corner.|SPD+14 COV+6 BALL+2 PHY-10 TKL-6
Steve Atwater|Arkansas|1988|c|Razorbacks' bone-crushing strong safety.|PHY+12 TKL+8 COV-8
Carnell Lake|UCLA|1988|c|Bruins' versatile, hard-hitting defender.|TKL+6 PHY+4 IQ+4 COV+2
Eric Allen|Arizona State|1987|c|Sun Devils' ball-hawking corner.|BALL+8 COV+6 IQ+4 PHY-4
Mark Carrier|USC|1989|a|Trojans' Thorpe Award-winning safety.|BALL+6 TKL+6 IQ+6 COV+4 PHY+4
Darren Woodson|Arizona State|1991|c|Sun Devils' rangy, physical safety.|TKL+8 PHY+6 SPD+2 BALL-2
Ty Law|Michigan|1994|a|Wolverines' aggressive, press-man corner.|COV+8 PHY+6 BALL+6 SPD+2
Lito Sheppard|Florida|2001|c|Gators' smooth, ball-hawking corner.|COV+6 BALL+6 SPD+4 PHY-6 TKL-4
Fabian Washington|Nebraska|2004|c|Cornhuskers' sub-4.3 lockdown corner.|SPD+12 COV+4 PHY-10 TKL-8
Antrel Rolle|Miami (FL)|2004|c|Hurricanes' physical, versatile defensive back.|COV+4 PHY+6 TKL+4 IQ+2
Carlos Rogers|Auburn|2004|a|Tigers' Thorpe Award-winning corner.|COV+8 BALL+8 SPD+2 PHY-2 IQ+2
Nate Clements|Ohio State|1999|c|Buckeyes' big, athletic corner and returner.|COV+6 PHY+4 SPD+2 BALL+2
Asante Samuel|UCF|2002|w|Golden Knights' relentless ball hawk.|BALL+10 COV+6 IQ+6 PHY-10 TKL-8
Ronde Barber|Virginia|1996|c|Cavaliers' tough, undersized playmaker.|BALL+8 TKL+4 IQ+8 PHY-8 SPD-2
Rashean Mathis|Bethune-Cookman|2002|w|Wildcats' HBCU lockdown corner.|COV+6 SPD+4 BALL+4
Dunta Robinson|South Carolina|2003|c|Gamecocks' physical, ball-hawking corner.|COV+6 PHY+4 BALL+4
Chris Gamble|Ohio State|2003|c|Buckeyes' two-way star corner-receiver.|COV+6 BALL+6 SPD+4 PHY+2
Quentin Jammer|Texas|2001|c|Longhorns' big, physical corner.|PHY+8 COV+4 TKL+4 SPD-2
Josh Norman|Coastal Carolina|2011|w|Chanticleers' loud, tough small-school corner.|COV+6 BALL+6 PHY+4 CLU+6 IQ+2
Byron Maxwell|Clemson|2010|w|Tigers' long, physical corner.|COV+4 PHY+6 BALL+2 SPD-2
Brandon Flowers|Virginia Tech|2007|c|Hokies' tough, small, ball-hawking corner.|BALL+6 COV+6 TKL+4 PHY-6
Kenny Vaccaro|Texas|2012|c|Longhorns' versatile, hitting safety.|TKL+6 PHY+6 COV+2 IQ+4
Eric Reid|LSU|2012|c|Tigers' rangy, sure-tackling safety.|TKL+6 COV+2 IQ+4 SPD+2
Bradley Roby|Ohio State|2013|c|Buckeyes' Thorpe Award-winning corner.|COV+8 SPD+4 BALL+4 PHY-4
Darqueze Dennard|Michigan State|2013|a|Spartans' Thorpe-winning No-Fly Zone corner.|COV+10 PHY+6 BALL+4 SPD-2
Justin Gilbert|Oklahoma State|2013|c|Cowboys' long, quick, ball-hawking corner.|BALL+8 SPD+4 COV+4 TKL-8
Vernon Hargreaves III|Florida|2015|a|Gators' fluid, aggressive corner.|COV+8 BALL+6 SPD+2 PHY-6
Mackensie Alexander|Clemson|2015|c|Tigers' tenacious, sticky corner.|COV+8 PHY+2 SPD+2 TKL-4
Eli Apple|Ohio State|2015|c|Buckeyes' tall, physical corner.|COV+4 PHY+6 TKL-2
Justin Simmons|Boston College|2015|c|Eagles' versatile safety with elite ball skills.|BALL+8 COV+4 IQ+6 PHY-2
Desmond King|Iowa|2016|a|Hawkeyes' Thorpe-winning ball hawk.|BALL+10 COV+6 IQ+6 PHY-4 SPD-2
Jourdan Lewis|Michigan|2016|c|Wolverines' sticky, undersized corner.|COV+8 BALL+6 PHY-6 TKL-4
Marlon Humphrey|Alabama|2016|a|Tide's long, physical, hurdle-happy corner.|COV+6 PHY+8 SPD+4 TKL+4
Tre'Davious White|LSU|2016|c|Tigers' sticky, reliable corner.|COV+8 BALL+4 IQ+4 PHY-2
Malik Hooker|Ohio State|2016|c|Buckeyes' one-year ball-hawking center fielder.|BALL+12 COV+6 SPD+4 TKL-8 IQ-2
Jaire Alexander|Louisville|2017|c|Cardinals' aggressive, twitchy corner.|COV+8 SPD+4 BALL+4 PHY-6
Denzel Ward|Ohio State|2017|c|Buckeyes' rocket-fast, sticky corner.|SPD+10 COV+8 BALL+2 PHY-8
Josh Jackson|Iowa|2017|c|Hawkeyes' eight-interception ball hawk.|BALL+10 COV+4 IQ+4 PHY-6
Jeffrey Okudah|Ohio State|2019|a|Buckeyes' Thorpe-winning shutdown corner.|COV+10 SPD+4 PHY+2 BALL+2
CJ Henderson|Florida|2019|c|Gators' long, fluid corner.|COV+8 SPD+4 BALL+2 TKL-4
Jaylon Johnson|Utah|2019|c|Utes' physical, mean corner.|COV+6 PHY+6 BALL+4 TKL+2
Xavier McKinney|Alabama|2019|c|Tide's versatile, ball-hawking safety.|BALL+6 TKL+4 IQ+6 COV+2
Antoine Winfield Jr.|Minnesota|2019|a|Gophers' All-American ball-hawking safety.|BALL+8 TKL+6 IQ+8 PHY+2
Trent McDuffie|Washington|2021|c|Huskies' quick, technical corner.|COV+8 IQ+6 SPD+2 PHY-4
Kaiir Elam|Florida|2021|c|Gators' long, athletic corner.|COV+6 SPD+2 PHY+2 BALL+2
Cooper DeJean|Iowa|2023|a|Hawkeyes' Thorpe-winning corner and returner.|BALL+8 COV+6 TKL+6 IQ+4 SPD+2
Nate Wiggins|Clemson|2023|c|Tigers' rangy, blazing corner.|SPD+8 COV+8 BALL+4 PHY-8 TKL-6
Travis Hunter|Colorado|2024|h|Buffaloes' Heisman-winning two-way sensation.|COV+10 BALL+10 SPD+4 IQ+6 CLU+8 TKL-4
"""

LB = """
Randy Gradishar|Ohio State|1973|a|Buckeyes' high-motor, all-around linebacker.|TKL+8 RS+6 IQ+6 STA+6 SPD-4
E.J. Junior|Alabama|1980|c|Tide's fast, strong linebacker.|SPD+4 STR+6 RS+4 BLZ+4
Andre Tippett|Iowa|1981|c|Hawkeyes' explosive rusher-linebacker.|BLZ+10 SPD+6 RS-2 COV-6
Ken Norton Jr.|UCLA|1987|c|Bruins' smart, versatile linebacker.|IQ+6 TKL+4 COV+4 STR-2
Levon Kirkland|Clemson|1991|c|Tigers' mountainous, mobile linebacker.|STR+8 RS+6 TKL+4 SPD-6 COV-6
Kevin Hardy|Illinois|1995|a|Illini's Butkus Award-winning force.|TKL+8 RS+6 STR+4 IQ+4
Takeo Spikes|Auburn|1997|c|Tigers' fast, hard-hitting linebacker.|SPD+6 TKL+6 BLZ+4 COV-2
Kendrell Bell|Georgia|2000|c|Bulldogs' explosive, attacking linebacker.|BLZ+8 SPD+6 TKL+4 COV-6
Keith Bulluck|Syracuse|1999|c|Orange's relentless, athletic linebacker.|COV+6 SPD+4 TKL+4 IQ+4
Demeco Ryans|Alabama|2005|a|Tide's smart, sturdy leader.|TKL+8 IQ+10 COV+2 STR-2 BLZ-2
Jon Beason|Miami (FL)|2006|c|Hurricanes' fast, thumping linebacker.|TKL+8 SPD+4 RS+4
Dont'a Hightower|Alabama|2011|a|Tide's national-title anchor.|STR+6 RS+6 TKL+6 IQ+6 SPD-2
Kevin Minter|LSU|2012|c|Tigers' steady middle linebacker.|TKL+6 RS+4 STR+2 SPD-4
Eric Kendricks|UCLA|2014|a|Bruins' Butkus Award winner.|TKL+8 COV+6 IQ+6 SPD+2 STR-6
Myles Jack|UCLA|2015|c|Bruins' two-way, all-world athlete.|SPD+8 COV+8 TKL+4 STR-2 IQ-2
Jaylon Smith|Notre Dame|2015|a|Irish's Butkus-winning athlete.|SPD+6 COV+6 TKL+6 BLZ+4
Blake Martinez|Stanford|2015|w|Cardinal's tackle-machine linebacker.|TKL+10 IQ+4 STA+6 SPD-4 STR-2
Zach Cunningham|Vanderbilt|2016|c|Commodores' sideline-to-sideline tackling star.|TKL+8 SPD+2 COV+2 STR-4
Jarrad Davis|Florida|2016|c|Gators' emotional, ultra-tough leader.|TKL+6 STR+4 RS+4 COV-4
Reuben Foster|Alabama|2016|a|Tide's violent, fast Butkus winner.|TKL+10 RS+6 SPD+4 IQ-2 STR+2
Rashaan Evans|Alabama|2017|c|Tide's athletic, versatile linebacker.|SPD+6 BLZ+4 COV+2 TKL+2
Shaquille Leonard|South Carolina State|2017|a|Bulldogs' tackle-machine HBCU star.|TKL+10 SPD+4 STA+6 STR-2
Kenneth Murray|Oklahoma|2019|c|Sooners' fast, strong middle linebacker.|SPD+6 TKL+6 RS+4 COV-4
Jamin Davis|Kentucky|2020|c|Wildcats' explosive, one-year linebacker.|SPD+8 TKL+4 COV+2 IQ-4
Christian Harris|Alabama|2021|c|Tide's rangy, athletic coverage linebacker.|SPD+6 COV+6 TKL+2 RS-4
Quay Walker|Georgia|2021|c|Bulldogs' huge, fast national champion.|SPD+4 STR+6 TKL+4 RS+2 COV-2
Chad Muma|Wyoming|2021|c|Cowboys' 100-tackle small-school standout.|TKL+10 IQ+6 STA+4 SPD-4
Malcolm Rodriguez|Oklahoma State|2021|w|Cowboys' underrated tackle machine.|TKL+8 IQ+6 STA+4 STR-6
Trenton Simpson|Clemson|2022|c|Tigers' athletic, disruptive linebacker.|SPD+8 BLZ+4 COV+4 STR-6
Drew Sanders|Arkansas|2022|c|Razorbacks' edge-linebacker hybrid.|BLZ+8 STR+4 SPD+2 COV-4
Jeremiah Trotter Jr.|Clemson|2023|c|Tigers' tackle-machine middle linebacker.|TKL+10 RS+6 IQ+6 COV-4
Payton Wilson|NC State|2023|a|Wolfpack's Butkus winner after years of injuries.|TKL+10 SPD+4 COV+2 IQ+6 STA+4
Junior Colson|Michigan|2023|c|Wolverines' national-title middle linebacker.|TKL+8 COV+2 RS+4
Barrett Carter|Clemson|2023|c|Tigers' rangy playmaker.|SPD+6 COV+6 TKL+2 STR-6
Harold Perkins Jr.|LSU|2022|c|Tigers' explosive edge-linebacker hybrid.|BLZ+10 SPD+8 STR-10 COV-2
Carson Schwesinger|UCLA|2024|a|Bruins' breakout, high-tackle linebacker.|TKL+10 IQ+8 SPD+2 COV+2
Wilber Marshall|Florida|1983|a|Gators' All-American terror.|TKL+6 BLZ+8 SPD+6 STR+2 COV+2
Jerry Robinson|UCLA|1978|c|Bruins' rangy All-American.|SPD+6 COV+6 TKL+4 BLZ+2
Matt Millen|Penn State|1978|c|Nittany Lions' snarling linebacker.|TKL+6 STR+6 RS+6 IQ+2 SPD-6
Shane Conlan|Penn State|1986|c|Nittany Lions' national title hero.|TKL+8 IQ+8 COV+2 SPD-4
Pat Swilling|Georgia Tech|1985|c|Yellow Jackets' explosive pass rusher.|BLZ+10 SPD+6 TKL+2 COV-6
Rickey Jackson|Pittsburgh|1980|c|Panthers' relentless linebacker.|BLZ+6 TKL+6 SPD+2 STR+2
Hardy Nickerson|California|1986|c|Golden Bears' nasty, intense tackler.|TKL+10 IQ+4 RS+4 STR-2 SPD-4
"""

BLOCKS = {'QB':QB,'RB':RB,'WR':WR,'OL':OL,'EDGE':EDGE,'DB':DB,'LB':LB}

def _stats(pos, name, tier, deltas):
    keys = ATTRS[pos]; d = {}
    for tok in deltas.split():
        i = max(tok.rfind('+'), tok.rfind('-')); k, v = tok[:i], int(tok[i:])
        assert k in keys, (pos, name, tok); d[k] = v
    out = []
    for k in keys:
        noise = (zlib.crc32((name+k).encode()) % 5) - 2          # stable -2..+2
        out.append(max(55, min(99, BASE[tier] + d.get(k, 0) + noise)))
    return out

ROWS_BY_POS = {}
for pos, text in BLOCKS.items():
    rows = []
    for line in text.strip().splitlines():
        name, school, year, tier, tag, deltas = line.split('|')
        rows.append((name, school, int(year), TN[tier], tag, _stats(pos, name, tier, deltas)))
    ROWS_BY_POS[pos] = rows

if __name__ == '__main__':
    print({k: len(v) for k, v in ROWS_BY_POS.items()}, sum(len(v) for v in ROWS_BY_POS.values()))
