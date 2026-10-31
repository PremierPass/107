import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from patch import *
src=Image.open('images/container_cargo_trucks.png').convert('RGB')
im=src.copy()
W=(236,236,236)
# 1. Replace the invented "CRYOGENIC LIQUID" placard (MC-338 row) with the real
#    NON-FLAMMABLE GAS placard from the tube-trailer row (liquid nitrogen is 2.2).
inpaint_rect(im,(1218,646,1306,738))
tile=src.crop((1222,768,1304,845))
# paste only the diamond (not the tile's background) so no square edge shows
import numpy as np, cv2
m=(np.array(tile.convert('L'))>45).astype(np.uint8)*255
m=cv2.dilate(m,np.ones((3,3),np.uint8))
im.paste(tile,(1223,664),Image.fromarray(m))
# 2. MC-338 contents: "(LNG, LOX)" -> the product that placard fits.
inpaint(im,(1146,672,1222,716),90,dark_text=False,grow=2)
draw_lines(im,(1148,672,1224,716),[("(liquid",'bold',19,W),("nitrogen)",'bold',19,W)],spacing=0.12)
# 3. MC-331: propane is Division 2.1; the NON-FLAMMABLE GAS placard fits
#    anhydrous ammonia (domestic Division 2.2).
inpaint(im,(1146,556,1224,612),90,dark_text=False,grow=2)
draw_lines(im,(1148,555,1226,613),[("(anhydrous",'bold',17,W),("ammonia;",'bold',17,W),("propane 2.1)",'bold',17,W)],spacing=0.1)
# 4. Footer: drop the invented cryogenic placard and close the gap.
nine=src.crop((1262,957,1334,1022))
inpaint_rect(im,(1180,957,1336,1022))
im.paste(nine,(1190,957))
im.save('images/container_cargo_trucks_corrected.png')
