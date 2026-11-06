from PIL import Image
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch import *
im=Image.open('images/container_nonbulk.png').convert('RGB')
RED=(196,32,38); DARK=(25,25,28)
# Column header + body (x 694..866, y 256..428): IBCs are bulk when over 119 gal.
text_block(im,(696,258,866,428),[
 ("IBCs (TOTES)",'bold',22,RED),
 ("ARE USUALLY BULK",'bold',17,RED),
 ("Liquid totes over",'reg',16,DARK),
 ("119 gal (450 L) are",'reg',16,DARK),
 ("BULK packaging,",'bold',16,DARK),
 ("not nonbulk.",'reg',16,DARK),
],spacing=0.32)
im.save('images/container_nonbulk_corrected.png')
