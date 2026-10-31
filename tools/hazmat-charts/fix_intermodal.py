from PIL import Image
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch import *
src=Image.open('images/container_intermodal.png').convert('RGB')
im=src.copy()
W=(238,238,238); G=(160,160,160)
# A. Panel 2 subtitle: T-codes are portable tank instructions, not a hazard rating.
inpaint(im,(815,198,1080,224),120,dark_text=False,grow=2)
draw_lines(im,(817,198,1240,224),[("T-code = portable tank design instruction.",'reg',20,W)],spacing=0)
# B. T-code example box: replace the invented decoding.
fill(im,(1270,226,1468,466),(10,14,14))
draw_lines(im,(1282,232,1468,462),[
 ("T11 = portable tank",'bold',19,W),
 ("instruction (how the",'reg',17,W),
 ("tank must be built):",'reg',17,W),
 ("- test pressure 6 bar min.",'reg',16,W),
 ("- shell 6 mm min.",'reg',16,W),
 ("- relief valve",'reg',16,W),
 ("- bottom outlet: 3 shutoffs",'reg',16,W),
 ("Not a hazard rating.",'bold',17,(250,205,70)),
 ("Read the UN number",'reg',16,W),
 ("and placards instead.",'reg',16,W),
],spacing=0.22,valign='top')
# C. Panel 4 legend: "T-code = Hazmat rating" -> tank design code.
inpaint(im,(880,710,1040,738),120,dark_text=False,grow=2)
draw_lines(im,(884,703,1080,733),[("= Tank design code",'reg',20,W)],spacing=0)
im.save('images/container_intermodal_corrected.png')
