<template>
  <div class="strive-page" :class="[`season-${currentSeason}`]">
    <!-- Atmospheric layered background -->
    <div class="sky-layer"></div>
    <div class="sun-orb" aria-hidden="true"></div>
    <div class="aurora-ring"></div>
    <div class="aurora-ring ring-2"></div>
    <div class="ground-mist"></div>

    <!-- Seasonal particles: blossoms / leaves / snow -->
    <div class="particles" aria-hidden="true">
      <span
        v-for="i in 18"
        :key="`p-${currentSeason}-${i}`"
        class="particle"
        :style="{
          left: `${(i * 37) % 100}%`,
          animationDelay: `${(i * 0.43) % 9}s`,
          animationDuration: `${10 + (i % 7)}s`,
          transform: `scale(${0.5 + (i % 4) * 0.18})`,
        }"
      />
    </div>

    <!-- Page header -->
    <header class="page-head">
      <p class="eyebrow">Our Values</p>
      <h1 class="page-title">Rooted in <span class="strive-word">STRIVE</span></h1>
      <p class="page-sub">
        Like a tree through every season — we listen, we adapt, we grow with you.
      </p>
    </header>

    <!-- Tree stage -->
    <section class="stage">
      <!-- Tree SVG -->
      <svg
        class="tree"
        viewBox="0 0 1000 920"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
      >
        <defs>
          <!-- Trunk gradient: deep cylindrical lighting -->
          <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#120802" />
            <stop offset="18%" stop-color="#3a2210" />
            <stop offset="42%" stop-color="#7a4f2c" />
            <stop offset="58%" stop-color="#5e3820" />
            <stop offset="82%" stop-color="#2a1808" />
            <stop offset="100%" stop-color="#0a0502" />
          </linearGradient>

          <linearGradient id="rootGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3a2210" />
            <stop offset="100%" stop-color="#0a0502" />
          </linearGradient>

          <linearGradient id="branchGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#5a3820" />
            <stop offset="100%" stop-color="#1a0d04" />
          </linearGradient>

          <!-- Halo ring like the reference -->
          <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stop-color="transparent" />
            <stop offset="78%" :stop-color="haloColor" stop-opacity="0.25" />
            <stop offset="84%" :stop-color="haloColor" stop-opacity="0.55" />
            <stop offset="88%" :stop-color="haloColor" stop-opacity="0.25" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>

          <!-- Per-leaf gradient -->
          <radialGradient id="leafGradMid" cx="35%" cy="30%" r="80%">
            <stop offset="0%" :stop-color="leafHi" />
            <stop offset="55%" :stop-color="leafMid" />
            <stop offset="100%" :stop-color="leafDeep" />
          </radialGradient>

          <radialGradient id="blossomGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#fff0f4" />
            <stop offset="100%" stop-color="#ff9fb4" />
          </radialGradient>
        </defs>

        <!-- ===== Halo ring like the reference ===== -->
        <circle class="halo" cx="500" cy="450" r="430" fill="url(#haloGrad)" />
        <circle
          class="halo-line"
          cx="500"
          cy="450"
          r="408"
          fill="none"
          :stroke="haloColor"
          stroke-width="1.4"
          stroke-opacity="0.35"
        />

        <!-- ===== Distant hill ===== -->
        <path class="hill-back" d="M -50 880 Q 500 760 1050 880 L 1050 940 L -50 940 Z" />
        <path class="hill" d="M -50 895 Q 500 800 1050 895 L 1050 940 L -50 940 Z" />

        <!-- Tree base shadow / ground darken -->
        <ellipse cx="500" cy="892" rx="340" ry="22" class="tree-shadow" />
        <ellipse cx="500" cy="888" rx="240" ry="14" class="tree-shadow-inner" />

        <!-- ============================================ -->
        <!-- ===== TRUNK SYSTEM (gnarled banyan-like) ===== -->
        <!-- ============================================ -->
        <g class="trunk-system">
          <!-- Outer buttress flares (back layer, far reach) -->
          <path
            class="buttress back"
            d="M 380 882
               C 320 880 240 884 170 905
               C 200 896 260 892 320 890
               C 360 888 380 884 390 880 Z"
            fill="url(#rootGrad)"
          />
          <path
            class="buttress back"
            d="M 620 882
               C 680 880 760 884 830 905
               C 800 896 740 892 680 890
               C 640 888 620 884 610 880 Z"
            fill="url(#rootGrad)"
          />

          <!-- Mid buttress -->
          <path
            class="buttress mid"
            d="M 380 882
               C 340 878 290 884 240 902
               C 280 894 330 890 370 884
               L 388 882 Z"
            fill="url(#trunkGrad)"
          />
          <path
            class="buttress mid"
            d="M 620 882
               C 660 878 710 884 760 902
               C 720 894 670 890 630 884
               L 612 882 Z"
            fill="url(#trunkGrad)"
          />

          <!-- Front-facing root tendrils (closest to viewer) -->
          <path
            class="buttress front"
            d="M 410 880
               C 400 884 380 894 360 905
               C 380 898 400 893 420 890
               C 432 888 442 884 446 880 Z"
            fill="url(#trunkGrad)"
          />
          <path
            class="buttress front"
            d="M 590 880
               C 600 884 620 894 640 905
               C 620 898 600 893 580 890
               C 568 888 558 884 554 880 Z"
            fill="url(#trunkGrad)"
          />
          <path
            class="buttress front center"
            d="M 470 884
               C 460 892 446 902 432 912
               C 458 904 478 898 492 894
               L 488 880 Z"
            fill="url(#trunkGrad)"
          />
          <path
            class="buttress front center"
            d="M 530 884
               C 540 892 554 902 568 912
               C 542 904 522 898 508 894
               L 512 880 Z"
            fill="url(#trunkGrad)"
          />

          <!-- ===== Main trunk silhouette (organic, twisted) ===== -->
          <path
            class="trunk"
            d="M 360 882
               C 372 850 386 808 392 760
               C 396 720 388 700 396 660
               C 404 620 414 580 410 540
               C 408 510 422 484 438 466
               C 450 452 462 444 472 442
               C 482 440 490 442 496 444
               L 504 444
               C 510 442 518 440 528 442
               C 538 444 550 452 562 466
               C 578 484 592 510 590 540
               C 586 580 596 620 604 660
               C 612 700 604 720 608 760
               C 614 808 628 850 640 882
               Z"
            fill="url(#trunkGrad)"
          />

          <!-- Bark groove lines (vertical, organic, follow trunk shape) -->
          <g class="grooves" stroke-linecap="round" fill="none">
            <path
              d="M 380 870 C 386 800 396 720 402 640 C 408 580 420 520 436 480"
              stroke="#0a0502"
              stroke-width="1.5"
              opacity="0.55"
            />
            <path
              d="M 410 870 C 414 800 422 720 428 640 C 434 580 444 520 456 480"
              stroke="#0a0502"
              stroke-width="1.2"
              opacity="0.5"
            />
            <path
              d="M 442 870 C 446 800 452 720 456 640 C 460 580 466 520 472 480"
              stroke="#0a0502"
              stroke-width="1.0"
              opacity="0.4"
            />
            <path
              d="M 470 875 C 472 760 478 660 484 560 C 488 510 492 480 496 462"
              stroke="#0a0502"
              stroke-width="1.0"
              opacity="0.4"
            />
            <path
              d="M 488 880 C 490 760 494 660 498 560 C 500 510 502 480 502 460"
              stroke="#0a0502"
              stroke-width="1.2"
              opacity="0.45"
            />
            <path
              d="M 512 880 C 510 760 506 660 502 560 C 500 510 498 480 498 460"
              stroke="#0a0502"
              stroke-width="1.2"
              opacity="0.45"
            />
            <path
              d="M 530 875 C 528 760 522 660 516 560 C 512 510 508 480 504 462"
              stroke="#0a0502"
              stroke-width="1.0"
              opacity="0.4"
            />
            <path
              d="M 558 870 C 554 800 548 720 544 640 C 540 580 534 520 528 480"
              stroke="#0a0502"
              stroke-width="1.0"
              opacity="0.4"
            />
            <path
              d="M 590 870 C 586 800 578 720 572 640 C 566 580 556 520 544 480"
              stroke="#0a0502"
              stroke-width="1.2"
              opacity="0.5"
            />
            <path
              d="M 620 870 C 614 800 604 720 598 640 C 592 580 580 520 564 480"
              stroke="#0a0502"
              stroke-width="1.5"
              opacity="0.55"
            />

            <!-- Highlight ridges (lighter, simulate raised bark) -->
            <path
              d="M 396 870 C 402 800 412 720 418 640 C 424 580 434 520 446 482"
              stroke="#9a6840"
              stroke-width="0.9"
              opacity="0.5"
            />
            <path
              d="M 482 880 C 484 760 488 660 492 560 C 494 510 496 482 498 466"
              stroke="#9a6840"
              stroke-width="0.7"
              opacity="0.5"
            />
            <path
              d="M 518 880 C 516 760 512 660 508 560 C 506 510 504 482 502 466"
              stroke="#9a6840"
              stroke-width="0.7"
              opacity="0.5"
            />
            <path
              d="M 604 870 C 598 800 588 720 582 640 C 576 580 566 520 554 482"
              stroke="#9a6840"
              stroke-width="0.9"
              opacity="0.5"
            />

            <!-- Horizontal cracks -->
            <path
              d="M 425 854 C 440 856 460 855 478 853"
              stroke="#0a0502"
              stroke-width="0.8"
              opacity="0.5"
            />
            <path
              d="M 526 854 C 540 856 560 855 575 853"
              stroke="#0a0502"
              stroke-width="0.8"
              opacity="0.5"
            />
            <path
              d="M 408 780 C 425 778 446 779 462 777"
              stroke="#0a0502"
              stroke-width="0.7"
              opacity="0.45"
            />
            <path
              d="M 540 780 C 555 778 575 779 592 777"
              stroke="#0a0502"
              stroke-width="0.7"
              opacity="0.45"
            />
            <path
              d="M 416 700 C 432 698 452 699 468 697"
              stroke="#0a0502"
              stroke-width="0.7"
              opacity="0.4"
            />
            <path
              d="M 532 700 C 548 698 568 699 584 697"
              stroke="#0a0502"
              stroke-width="0.7"
              opacity="0.4"
            />
            <path
              d="M 460 540 C 472 538 490 539 502 538"
              stroke="#0a0502"
              stroke-width="0.5"
              opacity="0.4"
            />
            <path
              d="M 498 540 C 510 538 528 539 540 538"
              stroke="#0a0502"
              stroke-width="0.5"
              opacity="0.4"
            />
          </g>

          <!-- Tree knots (deep wood holes) -->
          <g class="knots">
            <ellipse cx="466" cy="610" rx="11" ry="17" fill="#0a0502" opacity="0.6" />
            <ellipse cx="466" cy="610" rx="6" ry="11" fill="#3a2210" opacity="0.7" />
            <ellipse cx="468" cy="608" rx="2" ry="4" fill="#9a6840" opacity="0.4" />

            <ellipse cx="534" cy="700" rx="8" ry="13" fill="#0a0502" opacity="0.55" />
            <ellipse cx="534" cy="700" rx="4" ry="8" fill="#3a2210" opacity="0.7" />

            <ellipse cx="502" cy="540" rx="4" ry="7" fill="#0a0502" opacity="0.5" />
            <ellipse cx="448" cy="780" rx="5" ry="8" fill="#0a0502" opacity="0.4" />
            <ellipse cx="552" cy="800" rx="4" ry="6" fill="#0a0502" opacity="0.4" />
          </g>

          <!-- Inner highlight on trunk (rim light effect) -->
          <path
            class="trunk-highlight"
            d="M 480 460
               C 478 540 472 620 470 700
               C 470 760 478 820 482 880"
            stroke="rgba(180, 130, 80, 0.35)"
            stroke-width="6"
            fill="none"
            stroke-linecap="round"
          />
        </g>

        <!-- ============================================ -->
        <!-- ===== CANOPY (sways with the wind) ===== -->
        <!-- ============================================ -->
        <g class="canopy">
          <!-- Branches: thick organic, some visible through leaves -->
          <g class="branches" stroke="url(#branchGrad)" stroke-linecap="round" fill="none">
            <path d="M 478 460 Q 420 420 340 388 Q 280 372 220 370" stroke-width="22" />
            <path d="M 522 460 Q 580 420 660 388 Q 720 372 780 370" stroke-width="22" />
            <path d="M 478 452 Q 444 396 408 332 Q 388 296 370 258" stroke-width="17" />
            <path d="M 522 452 Q 556 396 592 332 Q 612 296 630 258" stroke-width="17" />
            <path d="M 500 442 Q 500 380 500 280 Q 500 224 500 178" stroke-width="18" />
            <path d="M 470 470 Q 408 472 332 482 Q 270 488 220 504" stroke-width="14" />
            <path d="M 530 470 Q 592 472 668 482 Q 730 488 780 504" stroke-width="14" />
            <!-- Secondary -->
            <path d="M 340 388 Q 296 374 250 366" stroke-width="9" />
            <path d="M 660 388 Q 704 374 750 366" stroke-width="9" />
            <path d="M 408 332 Q 380 312 350 296" stroke-width="8" />
            <path d="M 592 332 Q 620 312 650 296" stroke-width="8" />
            <path d="M 500 280 Q 470 256 442 236" stroke-width="8" />
            <path d="M 500 280 Q 530 256 558 236" stroke-width="8" />
            <path d="M 332 482 Q 290 474 252 472" stroke-width="8" />
            <path d="M 668 482 Q 710 474 748 472" stroke-width="8" />
            <!-- Twigs -->
            <path d="M 250 366 Q 224 358 200 358" stroke-width="4" />
            <path d="M 750 366 Q 776 358 800 358" stroke-width="4" />
            <path d="M 370 258 Q 354 238 338 224" stroke-width="4" />
            <path d="M 630 258 Q 646 238 662 224" stroke-width="4" />
            <path d="M 442 236 Q 428 214 418 198" stroke-width="3.5" />
            <path d="M 558 236 Q 572 214 582 198" stroke-width="3.5" />
            <path d="M 252 472 Q 230 468 210 468" stroke-width="4" />
            <path d="M 748 472 Q 770 468 790 468" stroke-width="4" />
            <path d="M 350 296 Q 332 280 318 268" stroke-width="3.5" />
            <path d="M 650 296 Q 668 280 682 268" stroke-width="3.5" />
          </g>

          <!-- Hanging aerial roots / vines (banyan style) -->
          <g class="vines" stroke="#3a2412" stroke-linecap="round" fill="none" opacity="0.85">
            <path d="M 290 392 Q 295 460 285 530" stroke-width="1.6" />
            <path d="M 332 405 Q 336 470 326 540" stroke-width="1.4" />
            <path d="M 380 318 Q 388 410 372 480" stroke-width="1.6" />
            <path d="M 430 350 Q 434 430 426 500" stroke-width="1.2" />
            <path d="M 466 280 Q 462 360 470 430" stroke-width="1.4" />
            <path d="M 534 280 Q 538 360 530 430" stroke-width="1.4" />
            <path d="M 570 350 Q 566 430 574 500" stroke-width="1.2" />
            <path d="M 620 318 Q 612 410 628 480" stroke-width="1.6" />
            <path d="M 668 405 Q 664 470 674 540" stroke-width="1.4" />
            <path d="M 710 392 Q 705 460 715 530" stroke-width="1.6" />
            <path d="M 408 442 Q 412 500 404 552" stroke-width="1.2" />
            <path d="M 592 442 Q 588 500 596 552" stroke-width="1.2" />
          </g>

          <!-- ===== Foliage cloud BACK layer (deep shadow) ===== -->
          <g class="cloud-back">
            <ellipse cx="500" cy="220" rx="200" ry="135" :fill="leafDeep" />
            <ellipse cx="365" cy="290" rx="135" ry="115" :fill="leafDeep" />
            <ellipse cx="635" cy="290" rx="135" ry="115" :fill="leafDeep" />
            <ellipse cx="270" cy="395" rx="115" ry="95" :fill="leafDeep" />
            <ellipse cx="730" cy="395" rx="115" ry="95" :fill="leafDeep" />
            <ellipse cx="200" cy="455" rx="78" ry="68" :fill="leafDeep" />
            <ellipse cx="800" cy="455" rx="78" ry="68" :fill="leafDeep" />
            <ellipse cx="408" cy="448" rx="92" ry="68" :fill="leafDeep" />
            <ellipse cx="592" cy="448" rx="92" ry="68" :fill="leafDeep" />
            <ellipse cx="500" cy="455" rx="85" ry="55" :fill="leafDeep" />
          </g>

          <!-- ===== Foliage cloud MID layer ===== -->
          <g class="cloud-mid">
            <ellipse cx="500" cy="210" rx="180" ry="120" :fill="leafMid" />
            <ellipse cx="365" cy="282" rx="118" ry="100" :fill="leafMid" />
            <ellipse cx="635" cy="282" rx="118" ry="100" :fill="leafMid" />
            <ellipse cx="278" cy="388" rx="100" ry="82" :fill="leafMid" />
            <ellipse cx="722" cy="388" rx="100" ry="82" :fill="leafMid" />
            <ellipse cx="208" cy="450" rx="65" ry="58" :fill="leafMid" />
            <ellipse cx="792" cy="450" rx="65" ry="58" :fill="leafMid" />
            <ellipse cx="412" cy="442" rx="80" ry="58" :fill="leafMid" />
            <ellipse cx="588" cy="442" rx="80" ry="58" :fill="leafMid" />
            <ellipse cx="500" cy="448" rx="72" ry="46" :fill="leafMid" />
          </g>

          <!-- ===== Procedural individual leaves (back-to-front by layer) ===== -->
          <g class="proc-leaves">
            <ellipse
              v-for="leaf in proceduralLeaves"
              :key="leaf.id"
              :cx="leaf.x"
              :cy="leaf.y"
              :rx="leaf.rx"
              :ry="leaf.ry"
              :transform="`rotate(${leaf.rot} ${leaf.x} ${leaf.y})`"
              :class="`leaf-${leaf.layer}`"
              :style="{ opacity: leaf.opacity }"
            />
          </g>

          <!-- Top rim highlight (sun-lit edge) -->
          <g class="rim-light">
            <ellipse cx="500" cy="160" rx="120" ry="40" :fill="leafHi" opacity="0.7" />
            <ellipse cx="365" cy="225" rx="80" ry="30" :fill="leafHi" opacity="0.55" />
            <ellipse cx="635" cy="225" rx="80" ry="30" :fill="leafHi" opacity="0.55" />
            <ellipse cx="270" cy="345" rx="70" ry="25" :fill="leafHi" opacity="0.5" />
            <ellipse cx="730" cy="345" rx="70" ry="25" :fill="leafHi" opacity="0.5" />
            <ellipse cx="408" cy="408" rx="55" ry="20" :fill="leafHi" opacity="0.45" />
            <ellipse cx="592" cy="408" rx="55" ry="20" :fill="leafHi" opacity="0.45" />
          </g>

          <!-- Spring blossoms (only fully visible in spring) -->
          <g class="blossoms">
            <circle
              v-for="(b, i) in blossomPoints"
              :key="`bl-${i}`"
              :cx="b.x"
              :cy="b.y"
              :r="b.r"
              fill="url(#blossomGrad)"
            />
          </g>

          <!-- Autumn fruits -->
          <g class="fruits">
            <circle v-for="(f, i) in fruitPoints" :key="`fr-${i}`" :cx="f.x" :cy="f.y" :r="f.r" />
          </g>
        </g>
      </svg>

      <!-- STRIVE value orbs -->
      <button
        v-for="(v, i) in values"
        :key="v.letter"
        class="orb"
        :class="{ active: hovered === i, dim: hovered !== null && hovered !== i }"
        :style="{ top: v.pos.top, left: v.pos.left }"
        @mouseenter="hovered = i"
        @mouseleave="hovered = null"
        @focus="hovered = i"
        @blur="hovered = null"
        :aria-label="`${v.letter} — ${v.title}`"
      >
        <span class="orb-glow" aria-hidden="true"></span>
        <span class="orb-letter">{{ v.letter }}</span>
        <span class="orb-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              d="M5 12h14M13 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="orb-ping" aria-hidden="true"></span>
      </button>

      <!-- Detail panel -->
      <transition name="panel">
        <div v-if="hovered !== null" class="detail-panel" :key="hovered">
          <div class="detail-letter-wrap">
            <span class="detail-letter">{{ values[hovered].letter }}</span>
            <span class="detail-letter-shadow" aria-hidden="true">{{
              values[hovered].letter
            }}</span>
          </div>
          <div class="detail-body">
            <p class="detail-eyebrow">Value · 0{{ hovered + 1 }} of 6</p>
            <h3 class="detail-title">{{ values[hovered].title }}</h3>
            <p class="detail-text">{{ values[hovered].text }}</p>
          </div>
        </div>
      </transition>
    </section>

    <!-- Season selector -->
    <div class="season-bar">
      <button
        v-for="(s, i) in seasons"
        :key="s.key"
        class="season-pill"
        :class="{ active: currentSeasonIndex === i }"
        @click="setSeason(i)"
        :aria-label="`View as ${s.label}`"
      >
        <span class="dot"></span>
        <span>{{ s.label }}</span>
      </button>
    </div>

    <footer class="page-foot">
      <p>Hover each letter — let the values find you.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

/* ---------- Seasons ---------- */
const seasons = [
  { key: 'spring', label: 'Spring' },
  { key: 'summer', label: 'Summer' },
  { key: 'autumn', label: 'Autumn' },
  { key: 'winter', label: 'Winter' },
]
const currentSeasonIndex = ref(0)
const currentSeason = computed(() => seasons[currentSeasonIndex.value].key)

const palette = computed(
  () =>
    ({
      spring: { hi: '#cae89a', mid: '#6da647', deep: '#2d5a25', halo: '#a8d680' },
      summer: { hi: '#7fc065', mid: '#3e7a42', deep: '#163d20', halo: '#5fa358' },
      autumn: { hi: '#f5c168', mid: '#c8541b', deep: '#5a1f08', halo: '#e08438' },
      winter: { hi: '#dde6ea', mid: '#9aafb6', deep: '#5a6b72', halo: '#bac8d0' },
    })[currentSeason.value],
)

const leafHi = computed(() => palette.value.hi)
const leafMid = computed(() => palette.value.mid)
const leafDeep = computed(() => palette.value.deep)
const haloColor = computed(() => palette.value.halo)

let seasonTimer = null
function startSeasonTimer() {
  if (seasonTimer) clearInterval(seasonTimer)
  seasonTimer = setInterval(() => {
    currentSeasonIndex.value = (currentSeasonIndex.value + 1) % 4
  }, 9000)
}
onMounted(startSeasonTimer)
onUnmounted(() => clearInterval(seasonTimer))

function setSeason(i) {
  currentSeasonIndex.value = i
  startSeasonTimer()
}

/* ---------- Procedural leaves ---------- */
function seededRand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const canopyBlobs = [
  // cx, cy, rx, ry, hiChance (chance leaf is highlighted), shadowSide (deep on far side)
  { cx: 500, cy: 220, rx: 195, ry: 130, hi: 0.35 },
  { cx: 365, cy: 295, rx: 135, ry: 110, hi: 0.3 },
  { cx: 635, cy: 295, rx: 135, ry: 110, hi: 0.3 },
  { cx: 275, cy: 395, rx: 115, ry: 90, hi: 0.25 },
  { cx: 725, cy: 395, rx: 115, ry: 90, hi: 0.25 },
  { cx: 205, cy: 455, rx: 75, ry: 65, hi: 0.22 },
  { cx: 795, cy: 455, rx: 75, ry: 65, hi: 0.22 },
  { cx: 410, cy: 445, rx: 90, ry: 65, hi: 0.28 },
  { cx: 590, cy: 445, rx: 90, ry: 65, hi: 0.28 },
  { cx: 500, cy: 450, rx: 80, ry: 50, hi: 0.25 },
]

let s = 1
const proceduralLeaves = []
canopyBlobs.forEach((blob, blobIdx) => {
  // density tuned for performance: ~450 leaves total (was 2600+ which killed FPS)
  const count = Math.floor((blob.rx * blob.ry) / 220)
  for (let i = 0; i < count; i++) {
    const angle = seededRand(s++) * Math.PI * 2
    // Bias toward edge for fuzzy outline
    const r = Math.pow(seededRand(s++), 0.55)
    const x = blob.cx + Math.cos(angle) * blob.rx * r
    const y = blob.cy + Math.sin(angle) * blob.ry * r

    const sizeBase = 2.2 + seededRand(s++) * 4.2
    const aspect = 1.35 + seededRand(s++) * 0.8 // leaves are oblong
    const rx = sizeBase
    const ry = sizeBase * aspect
    const rot = seededRand(s++) * 360

    // Layer assignment: top-of-blob more often "hi"; bottom-of-blob more often "deep"
    const yNorm = (y - (blob.cy - blob.ry)) / (2 * blob.ry) // 0=top, 1=bottom
    const hiRoll = seededRand(s++)
    const deepRoll = seededRand(s++)
    let layer
    if (hiRoll < blob.hi && yNorm < 0.45) layer = 'hi'
    else if (deepRoll < 0.32 && yNorm > 0.55) layer = 'deep'
    else layer = 'mid'

    const opacity = 0.78 + seededRand(s++) * 0.22

    proceduralLeaves.push({
      id: `${blobIdx}-${i}`,
      x,
      y,
      rx,
      ry,
      rot,
      layer,
      opacity,
      sortKey: layer === 'deep' ? 0 : layer === 'mid' ? 1 : 2,
    })
  }
})
proceduralLeaves.sort((a, b) => a.sortKey - b.sortKey)

/* ---------- Blossoms / fruits ---------- */
const blossomPoints = []
let bs = 1000
canopyBlobs.forEach((blob) => {
  const count = Math.floor((blob.rx * blob.ry) / 600)
  for (let i = 0; i < count; i++) {
    const angle = seededRand(bs++) * Math.PI * 2
    const r = Math.pow(seededRand(bs++), 0.4)
    const x = blob.cx + Math.cos(angle) * blob.rx * r
    const y = blob.cy + Math.sin(angle) * blob.ry * r
    const radius = 3 + seededRand(bs++) * 3
    blossomPoints.push({ x, y, r: radius })
  }
})

const fruitPoints = []
let fs = 2000
canopyBlobs.forEach((blob) => {
  const count = Math.floor((blob.rx * blob.ry) / 1500)
  for (let i = 0; i < count; i++) {
    const angle = seededRand(fs++) * Math.PI * 2
    const r = Math.pow(seededRand(fs++), 0.4)
    const x = blob.cx + Math.cos(angle) * blob.rx * r
    const y = blob.cy + Math.sin(angle) * blob.ry * r
    const radius = 2.5 + seededRand(fs++) * 2.5
    fruitPoints.push({ x, y, r: radius })
  }
})

/* ---------- STRIVE values ---------- */
const values = [
  {
    letter: 'S',
    title: 'Strive for Excellence',
    text: 'We are committed to the highest quality care. By continually refining our skills and grounding our work in evidence-based practice, we deliver the best possible outcomes for every patient.',
    pos: { top: '10%', left: '50%' },
  },
  {
    letter: 'T',
    title: 'Time for You',
    text: 'Great care cannot be rushed. We take the time to listen, understand your concerns, and tailor every treatment so you feel heard and supported at every step.',
    pos: { top: '22%', left: '76%' },
  },
  {
    letter: 'R',
    title: 'Respect Always',
    text: 'We treat every patient and every team member with respect — valuing each individual’s background, experience, and goals. Trust grows where respect is rooted.',
    pos: { top: '50%', left: '86%' },
  },
  {
    letter: 'I',
    title: 'Integrity in Care',
    text: 'Honest, transparent, patient-centred care. Our recommendations are guided by what is truly best for you, grounded in clinical expertise and ethical practice.',
    pos: { top: '50%', left: '14%' },
  },
  {
    letter: 'V',
    title: 'Value Every Person',
    text: 'We genuinely care about our patients and each other. Empathy and compassion shape a place where everyone feels safe, understood, and looked after.',
    pos: { top: '22%', left: '24%' },
  },
  {
    letter: 'E',
    title: 'Evolve Together',
    text: 'We grow as practitioners and as a community. Through collaboration, continuous learning, and supporting one another, we evolve — for our patients and for each other.',
    pos: { top: '36%', left: '50%' },
  },
]

const hovered = ref(null)
</script>

<style scoped>
/* ===== Page shell ===== */
.strive-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  font-family:
    'Inter',
    'PingFang SC',
    'Segoe UI',
    system-ui,
    -apple-system,
    sans-serif;
  color: #1f3026;
  background: #f5f1e8;
  transition: background 2.6s ease;

  --sky-1: #f7f1e3;
  --sky-2: #ead9c4;
  --accent: #1a3a2e;
  --gold: #b88a4a;
  --paper: #fff8e8;
}

/* Season palettes (background mood) */
.season-spring {
  --sky-1: #fdeef0;
  --sky-2: #d8ecd9;
  --accent: #1f5a3a;
  --gold: #d99cac;
  background: #faf3e8;
}
.season-summer {
  --sky-1: #fff7d8;
  --sky-2: #b8d8be;
  --accent: #143a25;
  --gold: #b88a4a;
  background: #f6f1e0;
}
.season-autumn {
  --sky-1: #ffe5c2;
  --sky-2: #f0b886;
  --accent: #6f3a18;
  --gold: #c8541b;
  background: #fbece0;
}
.season-winter {
  --sky-1: #eef3f6;
  --sky-2: #c9d4dc;
  --accent: #2c4452;
  --gold: #6c8693;
  background: #f1f5f7;
}

/* Background atmosphere */
.sky-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 100%);
  transition: background 2.6s ease;
  z-index: 0;
}
.sun-orb {
  position: absolute;
  top: 10%;
  left: 70%;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, rgba(255, 244, 214, 0.55), transparent 65%);
  filter: blur(24px);
  z-index: 1;
  pointer-events: none;
  transition: all 2.6s ease;
}
.season-spring .sun-orb {
  background: radial-gradient(circle, rgba(255, 220, 230, 0.55), transparent 65%);
}
.season-autumn .sun-orb {
  background: radial-gradient(circle, rgba(255, 200, 140, 0.65), transparent 65%);
}
.season-winter .sun-orb {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.55), transparent 65%);
}

.aurora-ring {
  position: absolute;
  width: 760px;
  height: 760px;
  top: 56%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(26, 58, 46, 0.12);
  z-index: 1;
  pointer-events: none;
  animation: ringPulse 9s ease-in-out infinite;
}
.aurora-ring.ring-2 {
  width: 880px;
  height: 880px;
  border-style: dashed;
  opacity: 0.4;
  animation-duration: 14s;
  animation-direction: reverse;
}
@keyframes ringPulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.04);
    opacity: 0.95;
  }
}

.ground-mist {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.6));
  z-index: 2;
  pointer-events: none;
}
.season-winter .ground-mist {
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.85));
}

/* Particles */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}
.particle {
  position: absolute;
  top: -30px;
  width: 10px;
  height: 10px;
  border-radius: 50% 30% 60% 40%;
  opacity: 0.85;
  animation: drift linear infinite;
  will-change: transform;
}
.season-spring .particle {
  background: #ffc7d3;
  box-shadow: 0 0 8px rgba(255, 199, 211, 0.7);
}
.season-summer .particle {
  background: #6fa365;
  opacity: 0.4;
  width: 6px;
  height: 6px;
}
.season-autumn .particle {
  background: linear-gradient(135deg, #d97228, #f3a04a);
  border-radius: 60% 30% 60% 30%;
  box-shadow: 0 0 6px rgba(217, 114, 40, 0.4);
}
.season-winter .particle {
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 10px #fff;
  width: 6px;
  height: 6px;
}
@keyframes drift {
  0% {
    transform: translate(0, -10vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: translate(40px, 50vh) rotate(180deg);
  }
  100% {
    transform: translate(-30px, 115vh) rotate(360deg);
    opacity: 0.4;
  }
}

/* Header */
.page-head {
  position: relative;
  z-index: 4;
  text-align: center;
  padding: 64px 24px 8px;
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: var(--accent);
  opacity: 0.7;
  margin: 0 0 14px;
  font-weight: 500;
}
.page-title {
  font-size: clamp(36px, 5.4vw, 64px);
  margin: 0 0 14px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: var(--accent);
  transition: color 2.6s ease;
  font-family: 'Playfair Display', 'Georgia', serif;
}
.strive-word {
  font-weight: 700;
  background: linear-gradient(135deg, #2c6b3c, #b88a4a);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 8px;
  margin-left: 6px;
}
.season-winter .strive-word {
  background: linear-gradient(135deg, #4a7282, #2c4452);
  -webkit-background-clip: text;
  background-clip: text;
}
.season-autumn .strive-word {
  background: linear-gradient(135deg, #c8541b, #f3a04a);
  -webkit-background-clip: text;
  background-clip: text;
}
.page-sub {
  font-size: 16px;
  opacity: 0.72;
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Stage */
.stage {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  aspect-ratio: 1000 / 920;
  z-index: 4;
}
.tree {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Halo ring (around tree, like Buddha reference) */
.halo {
  transition: fill 2.6s ease;
  animation: haloBreathe 8s ease-in-out infinite;
  transform-origin: center;
}
.halo-line {
  transition: stroke 2.6s ease;
}
@keyframes haloBreathe {
  0%,
  100% {
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
}

/* Hill */
.hill-back {
  fill: rgba(26, 58, 46, 0.12);
  transition: fill 2.6s ease;
}
.hill {
  fill: rgba(26, 58, 46, 0.22);
  transition: fill 2.6s ease;
}
.season-winter .hill-back {
  fill: rgba(255, 255, 255, 0.55);
}
.season-winter .hill {
  fill: rgba(255, 255, 255, 0.85);
}
.season-autumn .hill-back {
  fill: rgba(111, 58, 24, 0.18);
}
.season-autumn .hill {
  fill: rgba(111, 58, 24, 0.32);
}
.season-spring .hill-back {
  fill: rgba(31, 90, 58, 0.14);
}
.season-spring .hill {
  fill: rgba(31, 90, 58, 0.26);
}

.tree-shadow {
  fill: rgba(0, 0, 0, 0.22);
}
.tree-shadow-inner {
  fill: rgba(0, 0, 0, 0.3);
}

/* Trunk system (shadow done via tree-shadow ellipse below trunk instead of filter) */
.trunk-system {
}

/* Canopy sway */
.canopy {
  transform-origin: 500px 820px;
  animation: sway 8s ease-in-out infinite;
  will-change: transform;
}
@keyframes sway {
  0%,
  100% {
    transform: rotate(-1.2deg);
  }
  50% {
    transform: rotate(1.5deg);
  }
}

/* Foliage clouds (turbulence-distorted base) */
.cloud-back ellipse,
.cloud-mid ellipse {
  transition:
    fill 2.6s ease,
    opacity 2.6s ease;
}
.cloud-back {
  opacity: 0.92;
}
.cloud-mid {
  opacity: 0.85;
}
.season-winter .cloud-back,
.season-winter .cloud-mid {
  opacity: 0;
}

/* Procedural leaves (no per-leaf filter — major perf win) */
.leaf-deep,
.leaf-mid,
.leaf-hi {
  transition:
    opacity 2.6s ease,
    fill 2.6s ease;
}
.leaf-deep {
  fill: var(--leaf-deep, #163d20);
}
.leaf-mid {
  fill: var(--leaf-mid, #2e6b35);
}
.leaf-hi {
  fill: var(--leaf-hi, #6cb060);
}

.season-spring {
  --leaf-deep: #2d5a25;
  --leaf-mid: #6da647;
  --leaf-hi: #cae89a;
}
.season-summer {
  --leaf-deep: #163d20;
  --leaf-mid: #3e7a42;
  --leaf-hi: #7fc065;
}
.season-autumn {
  --leaf-deep: #5a1f08;
  --leaf-mid: #c8541b;
  --leaf-hi: #f5c168;
}
.season-winter {
  --leaf-deep: transparent;
  --leaf-mid: transparent;
  --leaf-hi: transparent;
}
.season-winter .leaf-deep,
.season-winter .leaf-mid,
.season-winter .leaf-hi {
  opacity: 0;
}

.rim-light ellipse {
  transition:
    fill 2.6s ease,
    opacity 2.6s ease;
}
.season-winter .rim-light ellipse {
  opacity: 0;
}

/* Vines */
.vines {
  transition: opacity 2.6s ease;
}
.season-winter .vines {
  opacity: 0.7;
}

/* Blossoms - spring only */
.blossoms circle {
  opacity: 0;
  transition:
    opacity 2.6s ease,
    transform 2.6s ease;
  transform-origin: center;
  transform: scale(0);
}
.season-spring .blossoms circle {
  opacity: 1;
  transform: scale(1);
  animation: blossomBob 4s ease-in-out infinite;
}
@keyframes blossomBob {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.18);
  }
}

/* Fruits - autumn only */
.fruits circle {
  fill: #b8341a;
  opacity: 0;
  transition:
    opacity 2.6s ease,
    transform 2.6s ease;
  transform-origin: center;
  transform: scale(0);
}
.season-autumn .fruits circle {
  opacity: 0.95;
  transform: scale(1);
}

/* ===== STRIVE Orbs ===== */
.orb {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 248, 232, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8px 28px rgba(26, 58, 46, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset,
    0 0 0 6px rgba(184, 138, 74, 0.08);
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 6;
  font-family: inherit;
  color: var(--accent);
  overflow: visible;
}
.orb::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px dashed rgba(26, 58, 46, 0.18);
  animation: spin 24s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.orb:hover,
.orb.active {
  width: 96px;
  height: 96px;
  background: var(--accent);
  color: var(--paper);
  box-shadow:
    0 18px 44px rgba(26, 58, 46, 0.4),
    0 0 0 10px rgba(184, 138, 74, 0.2),
    0 0 36px rgba(184, 138, 74, 0.5);
}
.orb.dim {
  opacity: 0.32;
  filter: grayscale(0.4);
  transform: translate(-50%, -50%) scale(0.92);
}
.orb-letter {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 2;
  font-family: 'Playfair Display', 'Georgia', serif;
}
.orb.active .orb-letter {
  transform: translateX(-12px);
}
.orb-arrow {
  position: absolute;
  right: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateX(-12px) scale(0.6);
  transition:
    opacity 0.32s ease 0.05s,
    transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) 0.05s;
  z-index: 2;
}
.orb.active .orb-arrow {
  opacity: 1;
  transform: translateX(0) scale(1);
}
.orb-glow {
  position: absolute;
  inset: -28px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(184, 138, 74, 0.5), transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
  z-index: 1;
  pointer-events: none;
}
.orb.active .orb-glow {
  opacity: 1;
  animation: pulse 2.2s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.18);
    opacity: 1;
  }
}
.orb-ping {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--accent);
  opacity: 0;
  pointer-events: none;
}
.orb.active .orb-ping {
  animation: ping 1.6s ease-out infinite;
}
@keyframes ping {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  80% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

/* Detail Panel */
.detail-panel {
  position: absolute;
  bottom: 4%;
  left: 50%;
  transform: translateX(-50%);
  width: min(640px, 90%);
  background: rgba(255, 253, 247, 0.94);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-radius: 26px;
  padding: 28px 36px;
  box-shadow:
    0 24px 60px rgba(26, 58, 46, 0.22),
    0 0 0 1px rgba(184, 138, 74, 0.2) inset;
  z-index: 7;
  display: flex;
  align-items: center;
  gap: 28px;
}
.detail-letter-wrap {
  position: relative;
  width: 84px;
  height: 84px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-letter,
.detail-letter-shadow {
  font-family: 'Playfair Display', 'Georgia', serif;
  font-size: 72px;
  font-weight: 700;
  line-height: 1;
}
.detail-letter {
  background: linear-gradient(135deg, #2c6b3c, #b88a4a);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  z-index: 2;
}
.detail-letter-shadow {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(184, 138, 74, 0.18);
  filter: blur(10px);
  z-index: 1;
}
.detail-body {
  flex: 1;
  min-width: 0;
}
.detail-eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: var(--gold);
  font-weight: 600;
}
.detail-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--accent);
  font-family: 'Playfair Display', 'Georgia', serif;
}
.detail-text {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.65;
  color: rgba(31, 48, 38, 0.78);
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(24px);
}
.panel-enter-active,
.panel-leave-active {
  transition:
    opacity 0.42s ease,
    transform 0.42s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Season selector */
.season-bar {
  position: relative;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  z-index: 4;
  padding: 10px 24px 8px;
}
.season-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(26, 58, 46, 0.14);
  color: var(--accent);
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.32s ease;
  font-family: inherit;
  text-transform: uppercase;
}
.season-pill:hover {
  background: rgba(255, 255, 255, 0.92);
  transform: translateY(-1px);
}
.season-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.4;
  transition: all 0.3s ease;
}
.season-pill.active {
  background: var(--accent);
  color: var(--paper);
  box-shadow: 0 8px 20px rgba(26, 58, 46, 0.3);
}
.season-pill.active .dot {
  opacity: 1;
  background: var(--paper);
  box-shadow: 0 0 12px var(--paper);
}

/* Footer */
.page-foot {
  position: relative;
  z-index: 4;
  text-align: center;
  padding: 28px 24px 56px;
  font-size: 13px;
  color: var(--accent);
  opacity: 0.6;
  letter-spacing: 0.6px;
  font-style: italic;
}

/* Mobile */
@media (max-width: 768px) {
  .page-head {
    padding: 40px 20px 4px;
  }
  .stage {
    aspect-ratio: 4 / 5;
  }
  .orb {
    width: 50px;
    height: 50px;
  }
  .orb:hover,
  .orb.active {
    width: 72px;
    height: 72px;
  }
  .orb-letter {
    font-size: 18px;
  }
  .detail-panel {
    padding: 20px 22px;
    gap: 18px;
    border-radius: 20px;
  }
  .detail-letter,
  .detail-letter-shadow {
    font-size: 54px;
  }
  .detail-letter-wrap {
    width: 60px;
    height: 60px;
  }
  .detail-title {
    font-size: 17px;
  }
  .detail-text {
    font-size: 13.5px;
  }
  .aurora-ring {
    width: 480px;
    height: 480px;
  }
  .aurora-ring.ring-2 {
    width: 560px;
    height: 560px;
  }
}
</style>
