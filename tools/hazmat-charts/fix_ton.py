from PIL import Image
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch import *
src=Image.open('images/container_ton.png').convert('RGB')
im=src.copy()
D=(22,30,44); W=(245,245,245)
# 1. "Valve outlets at each end" -> two valves (gas over liquid). TRANSCAER/Chlorine Institute B kit.
inpaint(im,(52,308,200,350),120,grow=2)
draw_lines(im,(54,309,210,350),[("Two valves (gas",'bold',17,D),("over liquid)",'bold',17,D)],spacing=0.12)
# 2. Placard-panel number: 1005 is ammonia; this chart is about chlorine (UN1017, Guide 124).
inpaint(im,(408,326,456,352),95)
draw_lines(im,(412,328,470,352),[("1017",'bold',21,(30,30,32))],spacing=0)
inpaint(im,(773,692,794,708),120,grow=1,radius=3)
draw_lines(im,(776,694,800,707),[("1017",'bold',9,(40,40,40))],spacing=0)
# 3. Y cylinder weight was unverified -> neutral comparison.
inpaint(im,(882,781,1004,819),120,grow=1)
draw_lines(im,(880,781,1008,819),[("SMALLER",'bold',17,D),("THAN 1 TON",'bold',17,D)],align='center',spacing=0.12)
# 4. "VALVES AT BOTH ENDS" -> two valves, one over the other.
inpaint(im,(699,875,866,913),120,grow=2)
draw_lines(im,(697,874,866,910),[("2 VALVES, ONE",'bold',15,D),("OVER THE OTHER",'bold',15,D)],align='center',spacing=0.08)
# 5. PPE: "MINIMUM CLASS 2" is unsupported; ERG 2024 Guide 124 calls for positive-pressure SCBA.
inpaint(im,(93,1141,262,1160),150,dark_text=False,grow=2)
draw_lines(im,(95,1141,330,1160),[("POSITIVE-PRESSURE SCBA",'bold',17,W)],spacing=0)
# 6. Isolation: ERG 2024 Table 1, chlorine small spill = 60 m (200 ft).
inpaint(im,(632,1100,950,1146),150,dark_text=False,grow=2)
draw_lines(im,(636,1100,990,1146),[("SMALL CHLORINE SPILL: ISOLATE",'bold',19,W),("60 M (200 FT) IN ALL DIRECTIONS",'bold',19,W)],spacing=0.18)
# 7. Labels row: "INHALATION HAZARD" is a package marking, not a placard or label.
#    Drop that invented tile and re-center the four real ones.
row=src.crop((392,1398,732,1496))
fill(im,(298,1396,732,1498),(3,15,22))
im.paste(row,(345,1398))
im.save('images/container_ton_corrected.png')
