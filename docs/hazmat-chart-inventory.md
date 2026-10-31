# Hazmat chart inventory and repair list

These are the original ChatGPT-made chart posters (`images/*.png`, with `.webp` copies served on the pages). PR #4 replaced the posters that had errors with text summaries. This list records every replaced chart, where it appeared, the errors found, and its current status.

**Status key**
- **Corrected here:** the original artwork was kept and only the wrong text or graphics were replaced. The corrected file is `images/<name>_corrected.webp`, and the page shows it again with the text summary underneath.
- **Needs ChatGPT repair:** the errors run through most of the poster (invented guide numbers, distance tables, or a wrong classification system), so they cannot be fixed by patching text. The page keeps the text summary until a repaired image is supplied. Each entry lists the exact corrections to request.
- **Restored unchanged:** none. Every replaced chart had at least one verified error.

The originals in `images/` are untouched, so ChatGPT can work from them.

## How to use this with ChatGPT

Upload the original PNG and paste the chart's "Corrections" list. Ask ChatGPT to keep the same layout, colors, icons, photos, and style, and to change only the listed text and graphics. Ask it to add no new numbers, guide numbers, or distances beyond what the list provides. Save the result as `images/<name>_corrected.png`. Claude can then convert it, check it, and switch the page to it.

## Summary

| # | Chart file | Page and pop-up | Status |
|---|---|---|---|
| 1 | `container_nonbulk` | Containers, "Nonbulk Packaging" | Corrected here |
| 2 | `container_cargo_trucks` | Containers, "Cargo Tank Trucks" | Corrected here |
| 3 | `container_ton` | Containers, "Ton Containers" | Corrected here |
| 4 | `container_intermodal` | Containers, "Intermodal" | Corrected here |
| 5 | `container_rail_cars` | Containers, "Rail Cars" | Needs ChatGPT repair |
| 6 | `class1_explosives` | Hazard Classes, Class 1 | Needs ChatGPT repair |
| 7 | `class2_gases` | Hazard Classes, Class 2 | Needs ChatGPT repair |
| 8 | `class3_flammable_liquids` | Hazard Classes, Class 3 | Needs ChatGPT repair |
| 9 | `class4_flammable_solids` | Hazard Classes, Class 4 | Needs ChatGPT repair |
| 10 | `class5_oxidizers` | Hazard Classes, Class 5 | Needs ChatGPT repair |
| 11 | `class6_toxic` | Hazard Classes, Class 6 | Needs ChatGPT repair |
| 12 | `class7_radioactive` | Hazard Classes, Class 7 | Needs ChatGPT repair |
| 13 | `class8_corrosives` | Hazard Classes, Class 8 | Needs ChatGPT repair |
| 14 | `class9_miscellaneous` | Hazard Classes, Class 9 | Needs ChatGPT repair |
| 15 | `ppe_all` | PPE Classes, "All Classes" | Needs ChatGPT repair (and instructor decision on Class 5) |
| 16 | `ppe2_class2` | PPE Classes, Class 2 | Needs ChatGPT repair |
| 17 | `ppe3_class3` | PPE Classes, Class 3 | Needs ChatGPT repair |
| 18 | `ppe5_class5` | PPE Classes, Class 5 | Hold for instructor decision |
| 19 | `ppe_respiratory` | PPE Classes, "Respiratory Protection Types" | Needs ChatGPT repair |
| 20 | `ppe_selection` | PPE Classes, "PPE Selection Guide" | Needs ChatGPT repair (and instructor decision on Class 5) |

The charts that were never replaced (container shapes, fixed facility, pipelines, marine, ERG overview, ERG flowchart, all five NFPA 704 charts, PPE Class 1, PPE Class 4, skin protection, and CPC failure) are not part of this list.

### Sources used for the corrections
- ERG 2024 guide text: [PubChem/NIH ERG 2024 guides](https://pubchem.ncbi.nlm.nih.gov/erg/guide_2024.html), [ERG 2024 index](https://pubchem.ncbi.nlm.nih.gov/erg/), and [NOAA CAMEO UN1017 chlorine](https://cameochemicals.noaa.gov/unna/1017) (Table 1 and 3 values).
- [49 CFR 171.8](https://www.thecompliancecenter.com/help-center/articles/bulk-vs-large-means-of-containment/) (bulk packaging) and [49 CFR 172.504](https://www.law.cornell.edu/cfr/text/49/172.504) (placarding).
- [NOAA CAMEO UN1005](https://m.cameochemicals.noaa.gov/unna/1005): anhydrous ammonia is Division 2.2 domestically and 2.3 internationally.
- [TRANSCAER chlorine kit talking points](https://www.transcaer.com/sites/default/files/documents/Module%203%20-%20talking%20points%20only%20-%20Chlorine%20Leak%20Kits%20A%20%20B.pdf): a ton container has two valves (gas and liquid) aligned one over the other, and six fusible plugs.
- [International Tank Container Organisation T-code table](https://international-tank-container.org/en/technical/technical-guidance-for-shipping-bulk-liquids): T-codes are portable tank instructions (minimum test pressure, shell thickness, relief and outlet requirements).
- [AAR/TRANSCAER Field Guide for Tank Cars](https://www.transcaer.com/sites/default/files/documents/2017%20Field%20Guide%20for%20Tank%20Cars.pdf).
- [FireRescue1 summary of NFPA 1994 classes](https://www.firerescue1.com/archive/articles/new-options-for-cbrn-protection-part-1-pdVA9oc1H81xjF8h), [OSHA 3352 APFs](https://www.osha.gov/Publications/3352-APF-respirators.pdf), and [OSHA 1910.134](https://www.osha.gov/training/library/respiratory-protection/major-requirements).

---

## 1. `container_nonbulk`: corrected here
**Errors:** the "Types of Nonbulk Packaging" row listed **IBCs** as nonbulk, "up to 793 gallons." Under 49 CFR 171.8, a liquid packaging over 450 L (119 gal) with no intermediate containment is **bulk**. A typical 275- or 330-gallon tote is bulk.

**Change made:** the IBC column now reads "IBCs (TOTES) ARE USUALLY BULK. Liquid totes over 119 gal (450 L) are BULK packaging, not nonbulk." The IBC photo and the rest of the poster are unchanged.

## 2. `container_cargo_trucks`: corrected here
**Errors:**
1. The MC-338 row and the footer showed a blue **"CRYOGENIC LIQUID" placard. No such placard exists.** Placards show the hazard class. The truck pictured is marked LIQUID NITROGEN, which is Division 2.2.
2. The MC-331 row listed **propane** beside a NON-FLAMMABLE GAS placard. Propane is Division 2.1 (FLAMMABLE GAS). Anhydrous ammonia is Division 2.2 for domestic transport.

**Changes made:**
- The invented placard in the MC-338 row was replaced with the poster's own NON-FLAMMABLE GAS placard, and "(LNG, LOX)" now reads "(liquid nitrogen)".
- The MC-331 note now reads "(anhydrous ammonia; propane 2.1)".
- The invented placard was removed from the footer strip.

## 3. `container_ton`: corrected here
**Errors:**

| Location | Was | Now | Source |
|---|---|---|---|
| Visual identification | "Valve outlets at each end" | "Two valves (gas over liquid)" | TRANSCAER chlorine kit |
| Ton vs. Y cylinder table | "Valves at both ends" | "2 valves, one over the other" | TRANSCAER chlorine kit |
| Ton vs. Y cylinder table | "Typically 90-150 lbs" (unverified) | "Smaller than 1 ton" | |
| Tank drawings | ID number 1005 (anhydrous ammonia) on a chart about chlorine and Guide 124 | 1017 (chlorine) | ERG 2024 index |
| Emergency response | "Minimum Class 2" PPE (unsupported) | "Positive-pressure SCBA" | ERG 2024 Guide 124 protective clothing |
| Key facts | "Initial isolation: 200 meters in all directions for small spill" | "Small chlorine spill: isolate 60 m (200 ft) in all directions" | ERG 2024 Table 1 |
| Labels row | An "INHALATION HAZARD" diamond shown as a placard | Removed, and the four real placards re-centered | "Inhalation Hazard" is a package marking, not a placard |

**Left as-is:** "Y cylinders: high pressure" was not verified. It is not contradicted by a source, but you may want ChatGPT to remove it.

## 4. `container_intermodal`: corrected here
**Errors:**
1. Panel 2 said the "T-code identifies hazmat rating."
2. The T-code example box decoded "22 = tank capacity," "K2 = pressure/design type," "T11 = hazard class rating (most hazardous)," and "L4BN = additional provisions." T-codes are UN/DOT **portable tank instructions** that set how the tank must be built. They do not rate the hazard of the contents. The other decodings could not be verified.
3. Panel 4's legend said "T-code = Hazmat rating."

**Changes made:**
- The subtitle now reads "T-code = portable tank design instruction."
- The example box now explains T11: test pressure 6 bar minimum, 6 mm minimum shell, relief valve, and a bottom outlet with 3 shutoffs. It adds "Not a hazard rating. Read the UN number and placards instead."
- The legend now reads "T-code = Tank design code."

**Left as-is for instructor review:** "Required markings on two sides" matches the course key. 49 CFR also requires placards on each side and each end of a portable tank, so confirm what the course expects.

---

## 5. `container_rail_cars`: needs ChatGPT repair
Keep the layout, photos, and the first four rows. Corrections:
1. **Hazardous Waste row (bottom row):** this is not a tank car type, and a railcar number ending in "W" does not mean hazardous waste. Reporting marks and car numbers identify the **owner**, not the contents. Replace the row with:
   - Type: "REPORTING MARKS"
   - Key ID: "GATX 123456 (example)"
   - What it tells you: "Who owns the car." "Not what is inside." "Check placards, UN number, and shipping papers (train consist)."
   - Remove the "W" icon, the "UTLX 123456W" example, and the "HAZARDOUS WASTE" placard.
2. **Pressure tank car row:**
   - Replace the "LPG 2" diamond (not a real placard) with the red **FLAMMABLE GAS 2** placard.
   - Change the callout "Smaller diameter, NO DOME, rounded ends" to "Fittings inside a protective housing on top, rounded ends" (AAR field guide).
3. **Cryogenic row:** remove the "CRYO-PROTECTED TANK CAR" box. There is no such marking. You may keep "insulated tank within a tank."
4. **Footer placard strip:** remove the NFPA 704 diamond. Railcars are placarded under DOT, not marked with NFPA 704.

## 6. `class1_explosives`: needs ChatGPT repair
Keep the 8-column layout and the placard art. Corrections:
1. **ERG Guide row:** only two guides apply.
   - **Guide 112:** Divisions 1.1, 1.2, 1.3, and 1.5.
   - **Guide 114:** Divisions 1.4 and 1.6, including 1.4S.

   Replace "Guide 113," "115," "116," "117," and "151" accordingly. Guide 113 is for wetted or desensitized explosives, which are not Class 1.
2. **"ERG Tells You To" row:** use only Guide 112 or 114 text.
   - **Guide 112:** spill or leak, isolate at least 500 m (1/3 mile) in all directions; large spill, consider evacuating 800 m (1/2 mile) in all directions; rail car or trailer in a fire, isolate 1600 m (1 mile). If the fire reaches the cargo, do NOT fight the fire.
   - **Guide 114:** large spill, consider evacuating 250 m (800 ft) in all directions; rail car or trailer in a fire, isolate 800 m (1/2 mile).

   Remove the invented 100 m, 50 m, and 25 m distances and the "fight fires normally" lines on the 1.3 and 1.5 columns (both are Guide 112).
3. **1.4S column:** "No significant blast hazard (shipping in bulk)" and the examples "bulk ANFO, bulk emulsion, slurry" are wrong. Bulk blasting agents are Division 1.5. Describe 1.4S as Division 1.4, compatibility group S (effects confined to the package), using Guide 114.
4. **1.1D column:** 1.1D is Division 1.1 with compatibility group D. It is not a separate "desensitized explosive" class, and its placard is orange, not yellow. Either remove the column or relabel it "1.1D = Division 1.1, compatibility group D" with the orange placard.

## 7. `class2_gases`: needs ChatGPT repair
1. **ERG guides row:** Guide 117 is for toxic-flammable gases (extreme hazard), not "cryogenic." Guide 118 is for flammable-corrosive gases, not "non-flammable." The general "Gases - Toxic" guide is 123, not 119. Replace each with "Look up the UN number," plus verified examples:
   - LPG/propane UN1075, Guide 115
   - LNG UN1972, Guide 115
   - nitrogen, compressed, UN1066, Guide 120
   - nitrogen, refrigerated, UN1977, Guide 120
   - chlorine UN1017, Guide 124
   - anhydrous ammonia UN1005, Guide 125
2. **"ERG Tells You To" row:** remove the invented "100 yards (300 ft)" and "300 yards (900 ft)" distances. For Guide 115, use these values:
   - isolate at least 100 m (330 ft)
   - large spill, consider evacuating 800 m (1/2 mile) downwind
   - tank in fire, isolate 1600 m (1 mile)

   For 2.3 materials, use "Table 1 or Table 3 (green pages)."
3. **"2.3 Poison Inhalation Hazard" column:** this is not a separate division, and "INHALATION HAZARD" is a package marking. Retitle it "2.3 POISON GAS, inhalation hazard marking." Replace the "INHALATION HAZARD 2" diamond with the white POISON GAS 2.3 placard.
4. **2.3 example "Ammonia (anhydrous)":** anhydrous ammonia is Division 2.2 for domestic US transport (2.3 internationally). Either add "(2.3 international; 2.2 domestic)" or move it to 2.2.

## 8. `class3_flammable_liquids`: needs ChatGPT repair
1. **ERG Guide panel:** the labels are swapped.
   - Guide **127** is for polar or water-miscible liquids, such as ethanol (UN1170) and acetone (UN1090).
   - Guide **128** is for non-polar or water-immiscible liquids, such as gasoline (UN1203) and diesel (UN1202).
   - Guide **129** is "water-miscible/noxious," not "non-polar."

   Replace the panel with: "Guide 127: polar/water-miscible (ethanol, acetone). Guide 128: non-polar fuels (gasoline, diesel). Always look up the UN number."
2. **"ERG Tells You To" and Protective Action Distances table:** remove the whole day/night small/large table (50/100/150/300 m). Class 3 has no such table unless the material is highlighted green. Use Guide 128 values for gasoline:
   - isolate at least 50 m (150 ft)
   - large spill, consider evacuating 300 m (1,000 ft) downwind
   - tank in fire, isolate 800 m (1/2 mile) and consider evacuating 800 m
3. **Fire response:** "Water may be ineffective" is fine. Change "Use alcohol-resistant foam, dry chemical, or carbon dioxide" to follow Guide 128: dry chemical, CO2, water spray, or regular foam for small fires; alcohol-resistant foam if regular foam is ineffective.

## 9. `class4_flammable_solids`: needs ChatGPT repair
1. **Remove the entire "4.4 Flammable Solid, Self-Reactive" column. There is no Division 4.4.** Self-reactive materials are Division 4.1.
2. **4.2 header and placard:** the 4.2 placard is white on top and red on the bottom. Do not show red stripes behind "4.2."
3. **ERG Guide row:** remove "Guide 132/133/134/135" assigned per division. Guide 132 is for flammable corrosive liquids. Replace with "Look up the UN number for the exact guide."
4. **"ERG Tells You To" row:** remove the invented 100 m and 50 m distances. Add: "Some 4.3 materials are highlighted green; ERG Table 2 lists the gases they produce with water."

## 10. `class5_oxidizers`: needs ChatGPT repair
1. **ERG Guide panels:** remove "Guide 140 - Oxidizing Substances" and "Guide 141 - Organic Peroxides" as whole-division guides. Replace with "Look up the UN number for the exact guide."
2. **"ERG Tells You To":** remove "Isolate for 100 meters (330 feet)" in both columns. It is not verified as a division-wide value.
3. **5.2 placard:** keep the red top and yellow bottom. Add "5.2 Type B, temperature controlled, is a Table 1 material (placard any quantity)" (49 CFR 172.504).

## 11. `class6_toxic`: needs ChatGPT repair
1. **6.1 examples:** remove **carbon monoxide (poisonous gas)**. Toxic gases are Division 2.3, not Class 6.
2. **6.2 placard:** the large "INFECTIOUS SUBSTANCE ... 6" diamond is drawn like a placard. **Division 6.2 has no placard** (49 CFR 172.504 Table 2). Label it "PACKAGE LABEL (no placard for 6.2)."
3. **ERG Guide panels:** remove "Guide 153" and "Guide 154" as whole-division guides, along with the "ERG Guide Quick Reference" box. Replace with "Look up the UN number."
4. **"ERG Tells You To":** remove "Isolate for 100 meters (330 feet)" in both columns. Add: "Materials toxic by inhalation are highlighted green; use Table 1."

## 12. `class7_radioactive`: needs ChatGPT repair
1. **Category order is inverted.** White-I is the **lowest** surface radiation level and Yellow-III is the **highest**. Change:
   - "Category I White, Highest Radiation Hazard, very high radiation levels" to "White-I: lowest radiation level"
   - "Category III Yellow, Lowest" to "Yellow-III: highest radiation level"
2. **These are package labels, not placards.** Retitle "CLASS 7 PLACARDS" to "CLASS 7 PACKAGE LABELS." Add: "Vehicles carrying Yellow-III packages display the RADIOACTIVE placard (Table 1)."
3. **Transport Index:** keep "the radiation level at 1 meter from the package." Remove the invented "TI examples 0 White, 1 Yellow, 2 Yellow, 3 Highest" box.
4. **ERG:** remove "Guide 163 - Radioactive Materials" as a class-wide guide, and remove the "100 meters / 330 ft" isolation values in the "ERG Tells You To" box, the initial actions strip, and the key reminders strip. Replace with "Look up the UN number for the exact guide."

## 13. `class8_corrosives`: needs ChatGPT repair
1. **ERG Guide panel:** remove "Guide 156 - Corrosive Materials." Corrosives use several guides depending on the material. Replace with "Look up the UN number."
2. **Protective Action Distances table:** remove the whole day/night small/large table (50/100/300 m). Only green-highlighted corrosives have Table 1 distances.
3. **"ERG Tells You To":** remove "Isolate for 100 meters (330 feet)."
4. **Examples:** bleach (sodium hypochlorite) can stay. Keep "hydrochloric acid," and if a fire note is added, use: "hydrogen chloride is nonflammable, but acids can react with metals to release flammable hydrogen gas" (NIOSH, NOAA CAMEO).

## 14. `class9_miscellaneous`: needs ChatGPT repair
1. **ERG Guide panel:** remove "Guide 171 - Miscellaneous Dangerous Materials" as the class guide. Replace with: lithium ion batteries UN3480 and UN3481, Guide 147; dry ice UN1845, Guide 120; "look up every other UN number."
2. **Key facts:** remove "ERG Guide 171 is the starting point for all Class 9 incidents."
3. **"ERG Tells You To" and key reminders:** remove "Isolate for 100 meters (330 feet)" and "Maintain isolation distances (100 m / 330 ft) minimum."
4. **Placard panel:** add "CLASS 9 placard not required for domestic transportation; bulk packagings must still show the ID number" (49 CFR 172.504(f)(9)).

## 15. `ppe_all`: needs ChatGPT repair
This poster mixes two systems. NFPA CBRN ensemble classes (NFPA 1994, now consolidated into NFPA 1990) are **not** OSHA/EPA Levels A to D.
1. Remove "(OSHA/EPA LEVEL A/B/C)" under the class titles. If a comparison is wanted, use one footnote: "Roughly comparable to Levels A to C; not equivalent."
2. **Class 2:** it is not "splash only," and the SCBA is a CBRN SCBA. Change to: "CBRN SCBA; IDLH levels of chemical vapors, liquids, and particulates." Remove "Fully encapsulating OR nonencapsulating liquid splash suit."
3. **Class 3:** change to: "CBRN APR or PAPR; low levels of chemical vapors and liquids (plus particulates); not for IDLH or oxygen-deficient atmospheres."
4. **Class 4:** keep "biological and radiological particulates only; no chemical vapor or liquid protection," with a CBRN APR or PAPR.
5. **Class 5:** this column could not be verified against NFPA 1990. Hold until the instructor confirms it, or remove it.
6. **Quick selection guide:** remove the Class 5 step, and replace "IDLH atmosphere? YES, Class 2" with "IDLH chemical vapors or liquids? Class 1 or Class 2 with SCBA."

## 16. `ppe2_class2`: needs ChatGPT repair
1. Remove the "(OSHA/EPA LEVEL B)" title and "Limited skin protection."
2. **Protects against:** change "Vapor penetration ✗" to ✓. Class 2 ensembles protect against chemical vapors and liquids at IDLH levels.
3. **Respiratory:** change "SCBA worn outside the suit" to "CBRN SCBA."
4. **Suit description:** remove "Splash protective suit... not vapor-tight."
5. **When not to wear:** remove "Vapor-tight protection required."
6. **SFFMA test tip:** remove it, or have the instructor confirm it. The "KNOWN + IDLH + splash = Class 2 / Level B" mapping mixes the two systems.

## 17. `ppe3_class3`: needs ChatGPT repair
1. Remove the "(OSHA/EPA LEVEL C)" title.
2. **Respiratory:** change "APR or PAPR" to "CBRN APR or PAPR."
3. **Protects against:** change "Particulates (non-toxic)" to "Particulates." Keep "low-level vapors" and "liquid splashes."
4. **Use when:** keep "below IDLH," "monitored," and "known." Add "oxygen at least 19.5%" (OSHA 1910.134).

## 18. `ppe5_class5`: hold for instructor decision
Class 5 could not be verified against NFPA 1990. If the instructor confirms the course's Class 5 definition, this chart can be restored with any wording the instructor provides. Otherwise leave it retired.

## 19. `ppe_respiratory`: needs ChatGPT repair
1. **Row labels are shifted by one row.** The "TYPE" label sits beside the air-source text, "AIR SOURCE" beside the use-when text, "USE WHEN" beside the limitations, and "LIMITATIONS" beside the key facts. Realign the labels so each one sits on its own row.
2. **PAPR key fact:** "Does not require fit testing" is wrong as a blanket statement. Change to "Tight-fitting facepieces need fit testing; loose-fitting hoods do not" (OSHA 1910.134).
3. **APR key fact:** add "Tight-fitting: fit testing required."
4. **SAR:** keep "must carry emergency escape bottle," but qualify it: "in IDLH conditions."
5. **SFFMA test tip:** "beards, glasses, or facial deformities: SAH or PAPR" is acceptable only for **loose-fitting** PAPRs and hoods. Add "loose-fitting."
6. **"5 SAH" column:** keep it, but label it "Supplied-air or powered loose-fitting hood."

## 20. `ppe_selection`: needs ChatGPT repair
1. Remove the "(LEVEL A/B/C)" labels from the class boxes, or replace them with "roughly comparable, not equivalent."
2. **Class 2 box:** change "Splash-protective suit, SCBA outside suit" to "CBRN SCBA; IDLH chemical vapors and liquids."
3. **Class 4 box:** "APR or PAPR with HEPA filters" should read "CBRN APR or PAPR."
4. **Class 5 box and flowchart step:** hold for instructor decision (see #18).
5. **Quick reference table:** these three rows are invented and should be removed:
   - "Hazardous solids monitoring: structural PPE + SCBA"
   - "Hazardous liquid monitoring: Class 2"
   - "Hazardous gas monitoring: Class 1"
6. **Flowchart question 2:** "Is the material known, atmosphere IDLH, and liquid splash hazard present?" should become "Known material at IDLH levels (vapor or liquid)? Class 1 or Class 2 with SCBA."
