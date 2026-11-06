#!/bin/sh
cd /private/tmp/claude-501/-Users-egor-Documents-dacha/7cc6f629-cce7-4ebb-b8a7-983dac409cc7/scratchpad
F=pillar,slab:anchor,slab:weight,gas:anchor:1,gas:anchor:2
(cd opt; FNDS=$F MATS=hybrid,timber node assembly.js > ../asm_all.txt 2>&1) &
(cd opt; FNDS=$F node consistency.js > ../cons_all.txt 2>&1) &
FNDS=$F node t4.js > t4_all.txt 2>&1 &
wait
(cd opt; node sweep.js > ../sweep_all.txt 2>&1)
node cov.js > cov.out 2>&1; node dress_sweep.js > dsw.out 2>&1; node float.js > float.out 2>&1
(cd r3; node dom6.mjs 2>&1 | grep -E "проверок пройдено|✗" | cut -c1-240 > ../dom6.txt; node dom5.mjs 2>&1 | grep -E "проверок пройдено|✗" | cut -c1-200 > ../dom5.txt; node dom4.mjs 2>&1 | tail -3 | cut -c1-200 > ../dom4.txt; node viewtest2.mjs 2>&1 | tail -2 | cut -c1-200 > ../vt2.txt)
echo finished
