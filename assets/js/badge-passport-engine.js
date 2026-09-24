/**
 * STEMulus Technology Passport™
 * Chapter 1: The Light Evolution™
 * 48-Month Membership Progression Badge Engine
 */

const BadgePassportEngine = (function() {
    'use strict';

    const ERAS = [
    {
        "id": 1,
        "name": "Era I: The First Light",
        "months": "1-6",
        "startMonth": 1,
        "endMonth": 6,
        "theme": "Fire & Hearth",
        "color": "#f97316"
    },
    {
        "id": 2,
        "name": "Era II: Flamecraft",
        "months": "7-12",
        "startMonth": 7,
        "endMonth": 12,
        "theme": "Oil & Clay Lamps",
        "color": "#d97706"
    },
    {
        "id": 3,
        "name": "Era III: The Artisan Light Age",
        "months": "13-18",
        "startMonth": 13,
        "endMonth": 18,
        "theme": "Candles & Enclosures",
        "color": "#eab308"
    },
    {
        "id": 4,
        "name": "Era IV: Industrial Light",
        "months": "19-24",
        "startMonth": 19,
        "endMonth": 24,
        "theme": "Kerosene, Gas & Street Networks",
        "color": "#64748b"
    },
    {
        "id": 5,
        "name": "Era V: The Electric Revolution",
        "months": "25-30",
        "startMonth": 25,
        "endMonth": 30,
        "theme": "Arcs, Filaments & Bulbs",
        "color": "#3b82f6"
    },
    {
        "id": 6,
        "name": "Era VI: The Efficiency Revolution",
        "months": "31-36",
        "startMonth": 31,
        "endMonth": 36,
        "theme": "Tungsten, Discharge & LEDs",
        "color": "#06b6d4"
    },
    {
        "id": 7,
        "name": "Era VII: The Sensing Revolution",
        "months": "37-42",
        "startMonth": 37,
        "endMonth": 42,
        "theme": "Photocells, PIR & Sound Sensors",
        "color": "#8b5cf6"
    },
    {
        "id": 8,
        "name": "Era VIII: Intelligent Light",
        "months": "43-48",
        "startMonth": 43,
        "endMonth": 48,
        "theme": "Microcontrollers & Adaptive Systems",
        "color": "#ec4899"
    }
];

    const BADGES = [
    {
        "id": 1,
        "slug": "fire-finder",
        "name": "FIRE FINDER",
        "title": "Fire Finder",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 1,
        "eraName": "Era I: The First Light",
        "eraTheme": "Fire & Hearth",
        "eraColor": "#f97316",
        "month": 1,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-01-fire-finder.png",
        "problemSolved": "Humanity discovers the usefulness of controlled fire.",
        "scienceConcept": "Fire produces both heat and light through combustion.",
        "technologyConcept": "Engineering and materials innovation in fire & hearth.",
        "stemulusConnection": "Students implement fire finder principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cFire can give us light.\u201d",
        "explanations": {
            "ages5_7": "Fire gave early humans light and warmth so they could stay safe at night.",
            "ages8_11": "Controlling fire allowed humans to manipulate fuel, embers, and airflow to keep light burning.",
            "ages12_17": "Early thermodynamics and combustion engineering: containing chemical energy release into sustained radiant heat and visible light."
        },
        "nextTeaser": "Month 2: Discover how humans advanced to Fire Keeper."
    },
    {
        "id": 2,
        "slug": "fire-keeper",
        "name": "FIRE KEEPER",
        "title": "Fire Keeper",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 1,
        "eraName": "Era I: The First Light",
        "eraTheme": "Fire & Hearth",
        "eraColor": "#f97316",
        "month": 2,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-02-fire-keeper.png",
        "problemSolved": "Humans learn that creating fire is not enough; they must maintain it.",
        "scienceConcept": "Fuel, oxygen, combustion and maintenance.",
        "technologyConcept": "Engineering and materials innovation in fire & hearth.",
        "stemulusConnection": "Students implement fire keeper principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cTechnology has to be controlled.\u201d",
        "explanations": {
            "ages5_7": "Fire gave early humans light and warmth so they could stay safe at night.",
            "ages8_11": "Controlling fire allowed humans to manipulate fuel, embers, and airflow to keep light burning.",
            "ages12_17": "Early thermodynamics and combustion engineering: containing chemical energy release into sustained radiant heat and visible light."
        },
        "nextTeaser": "Month 3: Discover how humans advanced to Torch Maker."
    },
    {
        "id": 3,
        "slug": "torch-maker",
        "name": "TORCH MAKER",
        "title": "Torch Maker",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 1,
        "eraName": "Era I: The First Light",
        "eraTheme": "Fire & Hearth",
        "eraColor": "#f97316",
        "month": 3,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-03-torch-maker.png",
        "problemSolved": "Humans make fire portable.",
        "scienceConcept": "Portable energy and fuel.",
        "technologyConcept": "Engineering and materials innovation in fire & hearth.",
        "stemulusConnection": "Students implement torch maker principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cWe can take our technology with us.\u201d",
        "explanations": {
            "ages5_7": "Fire gave early humans light and warmth so they could stay safe at night.",
            "ages8_11": "Controlling fire allowed humans to manipulate fuel, embers, and airflow to keep light burning.",
            "ages12_17": "Early thermodynamics and combustion engineering: containing chemical energy release into sustained radiant heat and visible light."
        },
        "nextTeaser": "Month 4: Discover how humans advanced to Flame Controller."
    },
    {
        "id": 4,
        "slug": "flame-controller",
        "name": "FLAME CONTROLLER",
        "title": "Flame Controller",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 1,
        "eraName": "Era I: The First Light",
        "eraTheme": "Fire & Hearth",
        "eraColor": "#f97316",
        "month": 4,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-04-flame-controller.png",
        "problemSolved": "Humans learn to manipulate the amount of fuel and airflow reaching a flame.",
        "scienceConcept": "Airflow, combustion and control.",
        "technologyConcept": "Engineering and materials innovation in fire & hearth.",
        "stemulusConnection": "Students implement flame controller principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cTechnology works better when we learn to control it.\u201d",
        "explanations": {
            "ages5_7": "Fire gave early humans light and warmth so they could stay safe at night.",
            "ages8_11": "Controlling fire allowed humans to manipulate fuel, embers, and airflow to keep light burning.",
            "ages12_17": "Early thermodynamics and combustion engineering: containing chemical energy release into sustained radiant heat and visible light."
        },
        "nextTeaser": "Month 5: Discover how humans advanced to Hearth Engineer."
    },
    {
        "id": 5,
        "slug": "hearth-engineer",
        "name": "HEARTH ENGINEER",
        "title": "Hearth Engineer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 1,
        "eraName": "Era I: The First Light",
        "eraTheme": "Fire & Hearth",
        "eraColor": "#f97316",
        "month": 5,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-05-hearth-engineer.png",
        "problemSolved": "Humans stop merely using fire and start designing systems around it.",
        "scienceConcept": "Heat containment, airflow, safety and design.",
        "technologyConcept": "Engineering and materials innovation in fire & hearth.",
        "stemulusConnection": "Students implement hearth engineer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cEngineers design environments to make technology work better.\u201d",
        "explanations": {
            "ages5_7": "Fire gave early humans light and warmth so they could stay safe at night.",
            "ages8_11": "Controlling fire allowed humans to manipulate fuel, embers, and airflow to keep light burning.",
            "ages12_17": "Early thermodynamics and combustion engineering: containing chemical energy release into sustained radiant heat and visible light."
        },
        "nextTeaser": "Month 6: Discover how humans advanced to Master Of The Ember."
    },
    {
        "id": 6,
        "slug": "master-of-the-ember",
        "name": "MASTER OF THE EMBER",
        "title": "Master Of The Ember",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 1,
        "eraName": "Era I: The First Light",
        "eraTheme": "Fire & Hearth",
        "eraColor": "#f97316",
        "month": 6,
        "isMilestone": true,
        "image": "assets/images/badges/light-evolution/badge-06-master-of-the-ember.png",
        "problemSolved": "The child completes the First Light era.",
        "scienceConcept": "Energy transformation and physical principles.",
        "technologyConcept": "Engineering and materials innovation in fire & hearth.",
        "stemulusConnection": "Students implement master of the ember principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cI understand how humanity began controlling fire.\u201d",
        "explanations": {
            "ages5_7": "Fire gave early humans light and warmth so they could stay safe at night.",
            "ages8_11": "Controlling fire allowed humans to manipulate fuel, embers, and airflow to keep light burning.",
            "ages12_17": "Early thermodynamics and combustion engineering: containing chemical energy release into sustained radiant heat and visible light."
        },
        "nextTeaser": "Month 7: Discover how humans advanced to Oil Lamp Maker."
    },
    {
        "id": 7,
        "slug": "oil-lamp-maker",
        "name": "OIL-LAMP MAKER",
        "title": "Oil-Lamp Maker",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 2,
        "eraName": "Era II: Flamecraft",
        "eraTheme": "Oil & Clay Lamps",
        "eraColor": "#d97706",
        "month": 7,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-07-oil-lamp-maker.png",
        "problemSolved": "Humans create a container that continuously feeds a flame.",
        "scienceConcept": "Fuel storage, wick and combustion.",
        "technologyConcept": "Engineering and materials innovation in oil & clay lamps.",
        "stemulusConnection": "Students implement oil-lamp maker principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cWe can turn fire into a designed device.\u201d",
        "explanations": {
            "ages5_7": "A little clay cup with oil and a wick makes a quiet, steady flame that stays right where we need it.",
            "ages8_11": "Capillary action pulls oil up through woven wicks to fuel a controlled flame inside crafted clay lamps.",
            "ages12_17": "Fluid dynamics and capillary pressure: liquid fuel transport through fibrous porous media sustaining steady combustion."
        },
        "nextTeaser": "Month 8: Discover how humans advanced to Wick Discoverer."
    },
    {
        "id": 8,
        "slug": "wick-discoverer",
        "name": "WICK DISCOVERER",
        "title": "Wick Discoverer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 2,
        "eraName": "Era II: Flamecraft",
        "eraTheme": "Oil & Clay Lamps",
        "eraColor": "#d97706",
        "month": 8,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-08-wick-discoverer.png",
        "problemSolved": "The wick transports fuel toward the flame.",
        "scienceConcept": "Capillary action.",
        "technologyConcept": "Engineering and materials innovation in oil & clay lamps.",
        "stemulusConnection": "Students implement wick discoverer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cMaterials can move things in surprising ways.\u201d",
        "explanations": {
            "ages5_7": "A little clay cup with oil and a wick makes a quiet, steady flame that stays right where we need it.",
            "ages8_11": "Capillary action pulls oil up through woven wicks to fuel a controlled flame inside crafted clay lamps.",
            "ages12_17": "Fluid dynamics and capillary pressure: liquid fuel transport through fibrous porous media sustaining steady combustion."
        },
        "nextTeaser": "Month 9: Discover how humans advanced to Clay Lamp Artisan."
    },
    {
        "id": 9,
        "slug": "clay-lamp-artisan",
        "name": "CLAY LAMP ARTISAN",
        "title": "Clay Lamp Artisan",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 2,
        "eraName": "Era II: Flamecraft",
        "eraTheme": "Oil & Clay Lamps",
        "eraColor": "#d97706",
        "month": 9,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-09-clay-lamp-artisan.png",
        "problemSolved": "Humans begin deliberately shaping materials to improve technology.",
        "scienceConcept": "Materials science, manufacturing and design.",
        "technologyConcept": "Engineering and materials innovation in oil & clay lamps.",
        "stemulusConnection": "Students implement clay lamp artisan principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cShape and material affect how something works.\u201d",
        "explanations": {
            "ages5_7": "A little clay cup with oil and a wick makes a quiet, steady flame that stays right where we need it.",
            "ages8_11": "Capillary action pulls oil up through woven wicks to fuel a controlled flame inside crafted clay lamps.",
            "ages12_17": "Fluid dynamics and capillary pressure: liquid fuel transport through fibrous porous media sustaining steady combustion."
        },
        "nextTeaser": "Month 10: Discover how humans advanced to Lamp Engineer."
    },
    {
        "id": 10,
        "slug": "lamp-engineer",
        "name": "LAMP ENGINEER",
        "title": "Lamp Engineer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 2,
        "eraName": "Era II: Flamecraft",
        "eraTheme": "Oil & Clay Lamps",
        "eraColor": "#d97706",
        "month": 10,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-10-lamp-engineer.png",
        "problemSolved": "Different lamp designs can be tested and improved.",
        "scienceConcept": "Prototype \u2192 test \u2192 improve.",
        "technologyConcept": "Engineering and materials innovation in oil & clay lamps.",
        "stemulusConnection": "Students implement lamp engineer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cEngineers experiment and iterate.\u201d",
        "explanations": {
            "ages5_7": "A little clay cup with oil and a wick makes a quiet, steady flame that stays right where we need it.",
            "ages8_11": "Capillary action pulls oil up through woven wicks to fuel a controlled flame inside crafted clay lamps.",
            "ages12_17": "Fluid dynamics and capillary pressure: liquid fuel transport through fibrous porous media sustaining steady combustion."
        },
        "nextTeaser": "Month 11: Discover how humans advanced to Flame Protector."
    },
    {
        "id": 11,
        "slug": "flame-protector",
        "name": "FLAME PROTECTOR",
        "title": "Flame Protector",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 2,
        "eraName": "Era II: Flamecraft",
        "eraTheme": "Oil & Clay Lamps",
        "eraColor": "#d97706",
        "month": 11,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-11-flame-protector.png",
        "problemSolved": "Humans enclose and protect the flame.",
        "scienceConcept": "Protection, airflow and portability.",
        "technologyConcept": "Engineering and materials innovation in oil & clay lamps.",
        "stemulusConnection": "Students implement flame protector principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cGood engineering also makes technology safer.\u201d",
        "explanations": {
            "ages5_7": "A little clay cup with oil and a wick makes a quiet, steady flame that stays right where we need it.",
            "ages8_11": "Capillary action pulls oil up through woven wicks to fuel a controlled flame inside crafted clay lamps.",
            "ages12_17": "Fluid dynamics and capillary pressure: liquid fuel transport through fibrous porous media sustaining steady combustion."
        },
        "nextTeaser": "Month 12: Discover how humans advanced to Master Of Flamecraft."
    },
    {
        "id": 12,
        "slug": "master-of-flamecraft",
        "name": "MASTER OF FLAMECRAFT",
        "title": "Master Of Flamecraft",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 2,
        "eraName": "Era II: Flamecraft",
        "eraTheme": "Oil & Clay Lamps",
        "eraColor": "#d97706",
        "month": 12,
        "isMilestone": true,
        "image": "assets/images/badges/light-evolution/badge-12-master-of-flamecraft.png",
        "problemSolved": "Completion of the ancient lamp era.",
        "scienceConcept": "Energy transformation and physical principles.",
        "technologyConcept": "Engineering and materials innovation in oil & clay lamps.",
        "stemulusConnection": "Students implement master of flamecraft principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "\u201cHumans learned to contain and engineer fire.\u201d",
        "explanations": {
            "ages5_7": "A little clay cup with oil and a wick makes a quiet, steady flame that stays right where we need it.",
            "ages8_11": "Capillary action pulls oil up through woven wicks to fuel a controlled flame inside crafted clay lamps.",
            "ages12_17": "Fluid dynamics and capillary pressure: liquid fuel transport through fibrous porous media sustaining steady combustion."
        },
        "nextTeaser": "Month 13: Discover how humans advanced to Candle Maker."
    },
    {
        "id": 13,
        "slug": "candle-maker",
        "name": "CANDLE MAKER",
        "title": "Candle Maker",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 3,
        "eraName": "Era III: The Artisan Light Age",
        "eraTheme": "Candles & Enclosures",
        "eraColor": "#eab308",
        "month": 13,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-13-candle-maker.png",
        "problemSolved": "Humans turn fuel and wick into a compact standardized light source.",
        "scienceConcept": "Wax + wick + combustion.",
        "technologyConcept": "Engineering and materials innovation in candles & enclosures.",
        "stemulusConnection": "Students implement candle maker principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of candle maker in technological innovation.",
        "explanations": {
            "ages5_7": "Solid wax candles and glass lanterns let people carry gentle light safely from room to room.",
            "ages8_11": "Candles turn solid fuel into vapor at the wick tip, while lantern enclosures protect flames from wind.",
            "ages12_17": "Phase-change fuel dynamics: solid hydrocarbon melting, vaporizing, and burning in aerodynamically shielded chambers."
        },
        "nextTeaser": "Month 14: Discover how humans advanced to Wax Artisan."
    },
    {
        "id": 14,
        "slug": "wax-artisan",
        "name": "WAX ARTISAN",
        "title": "Wax Artisan",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 3,
        "eraName": "Era III: The Artisan Light Age",
        "eraTheme": "Candles & Enclosures",
        "eraColor": "#eab308",
        "month": 14,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-14-wax-artisan.png",
        "problemSolved": "Humans discover that the properties of the material matter to performance.",
        "scienceConcept": "Materials science.",
        "technologyConcept": "Engineering and materials innovation in candles & enclosures.",
        "stemulusConnection": "Students implement wax artisan principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of wax artisan in technological innovation.",
        "explanations": {
            "ages5_7": "Solid wax candles and glass lanterns let people carry gentle light safely from room to room.",
            "ages8_11": "Candles turn solid fuel into vapor at the wick tip, while lantern enclosures protect flames from wind.",
            "ages12_17": "Phase-change fuel dynamics: solid hydrocarbon melting, vaporizing, and burning in aerodynamically shielded chambers."
        },
        "nextTeaser": "Month 15: Discover how humans advanced to Candle Keeper."
    },
    {
        "id": 15,
        "slug": "candle-keeper",
        "name": "CANDLE KEEPER",
        "title": "Candle Keeper",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 3,
        "eraName": "Era III: The Artisan Light Age",
        "eraTheme": "Candles & Enclosures",
        "eraColor": "#eab308",
        "month": 15,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-15-candle-keeper.png",
        "problemSolved": "Humans engineer holders and supports for safer use.",
        "scienceConcept": "Stability and safety.",
        "technologyConcept": "Engineering and materials innovation in candles & enclosures.",
        "stemulusConnection": "Students implement candle keeper principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of candle keeper in technological innovation.",
        "explanations": {
            "ages5_7": "Solid wax candles and glass lanterns let people carry gentle light safely from room to room.",
            "ages8_11": "Candles turn solid fuel into vapor at the wick tip, while lantern enclosures protect flames from wind.",
            "ages12_17": "Phase-change fuel dynamics: solid hydrocarbon melting, vaporizing, and burning in aerodynamically shielded chambers."
        },
        "nextTeaser": "Month 16: Discover how humans advanced to Lantern Smith."
    },
    {
        "id": 16,
        "slug": "lantern-smith",
        "name": "LANTERN SMITH",
        "title": "Lantern Smith",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 3,
        "eraName": "Era III: The Artisan Light Age",
        "eraTheme": "Candles & Enclosures",
        "eraColor": "#eab308",
        "month": 16,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-16-lantern-smith.png",
        "problemSolved": "Humans protect the flame while still allowing it to breathe.",
        "scienceConcept": "Enclosure + airflow.",
        "technologyConcept": "Engineering and materials innovation in candles & enclosures.",
        "stemulusConnection": "Students implement lantern smith principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of lantern smith in technological innovation.",
        "explanations": {
            "ages5_7": "Solid wax candles and glass lanterns let people carry gentle light safely from room to room.",
            "ages8_11": "Candles turn solid fuel into vapor at the wick tip, while lantern enclosures protect flames from wind.",
            "ages12_17": "Phase-change fuel dynamics: solid hydrocarbon melting, vaporizing, and burning in aerodynamically shielded chambers."
        },
        "nextTeaser": "Month 17: Discover how humans advanced to Renaissance Illuminator."
    },
    {
        "id": 17,
        "slug": "renaissance-illuminator",
        "name": "RENAISSANCE ILLUMINATOR",
        "title": "Renaissance Illuminator",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 3,
        "eraName": "Era III: The Artisan Light Age",
        "eraTheme": "Candles & Enclosures",
        "eraColor": "#eab308",
        "month": 17,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-17-renaissance-illuminator.png",
        "problemSolved": "Artificial lighting extends the hours in which humans can read, write, study and create.",
        "scienceConcept": "Technology expands human capability.",
        "technologyConcept": "Engineering and materials innovation in candles & enclosures.",
        "stemulusConnection": "Students implement renaissance illuminator principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of renaissance illuminator in technological innovation.",
        "explanations": {
            "ages5_7": "Solid wax candles and glass lanterns let people carry gentle light safely from room to room.",
            "ages8_11": "Candles turn solid fuel into vapor at the wick tip, while lantern enclosures protect flames from wind.",
            "ages12_17": "Phase-change fuel dynamics: solid hydrocarbon melting, vaporizing, and burning in aerodynamically shielded chambers."
        },
        "nextTeaser": "Month 18: Discover how humans advanced to Light Designer."
    },
    {
        "id": 18,
        "slug": "light-designer",
        "name": "LIGHT DESIGNER",
        "title": "Light Designer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 3,
        "eraName": "Era III: The Artisan Light Age",
        "eraTheme": "Candles & Enclosures",
        "eraColor": "#eab308",
        "month": 18,
        "isMilestone": true,
        "image": "assets/images/badges/light-evolution/badge-18-light-designer.png",
        "problemSolved": "Humans learn that lighting is not merely about producing light; it is about placing, directing and shaping it.",
        "scienceConcept": "Light design, architecture and intentional illumination.",
        "technologyConcept": "Engineering and materials innovation in candles & enclosures.",
        "stemulusConnection": "Students implement light designer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of light designer in technological innovation.",
        "explanations": {
            "ages5_7": "Solid wax candles and glass lanterns let people carry gentle light safely from room to room.",
            "ages8_11": "Candles turn solid fuel into vapor at the wick tip, while lantern enclosures protect flames from wind.",
            "ages12_17": "Phase-change fuel dynamics: solid hydrocarbon melting, vaporizing, and burning in aerodynamically shielded chambers."
        },
        "nextTeaser": "Month 19: Discover how humans advanced to Argand Engineer."
    },
    {
        "id": 19,
        "slug": "argand-engineer",
        "name": "ARGAND ENGINEER",
        "title": "Argand Engineer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 4,
        "eraName": "Era IV: Industrial Light",
        "eraTheme": "Kerosene, Gas & Street Networks",
        "eraColor": "#64748b",
        "month": 19,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-19-argand-engineer.png",
        "problemSolved": "Improved oil-lamp airflow produces brighter, more efficient illumination.",
        "scienceConcept": "Combustion engineering.",
        "technologyConcept": "Engineering and materials innovation in kerosene, gas & street networks.",
        "stemulusConnection": "Students implement argand engineer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of argand engineer in technological innovation.",
        "explanations": {
            "ages5_7": "Big lanterns and street lamps brightened whole town streets so people could walk safely after sunset.",
            "ages8_11": "Piping gas and kerosene through city networks turned light from single flames into urban infrastructure.",
            "ages12_17": "Municipal utility engineering: centralized fuel distillation, pressurized pipeline distribution, and street-scale illumination."
        },
        "nextTeaser": "Month 20: Discover how humans advanced to Kerosene Pioneer."
    },
    {
        "id": 20,
        "slug": "kerosene-pioneer",
        "name": "KEROSENE PIONEER",
        "title": "Kerosene Pioneer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 4,
        "eraName": "Era IV: Industrial Light",
        "eraTheme": "Kerosene, Gas & Street Networks",
        "eraColor": "#64748b",
        "month": 20,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-20-kerosene-pioneer.png",
        "problemSolved": "A new fuel expands the possibilities of portable lighting.",
        "scienceConcept": "Fuel technology.",
        "technologyConcept": "Engineering and materials innovation in kerosene, gas & street networks.",
        "stemulusConnection": "Students implement kerosene pioneer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of kerosene pioneer in technological innovation.",
        "explanations": {
            "ages5_7": "Big lanterns and street lamps brightened whole town streets so people could walk safely after sunset.",
            "ages8_11": "Piping gas and kerosene through city networks turned light from single flames into urban infrastructure.",
            "ages12_17": "Municipal utility engineering: centralized fuel distillation, pressurized pipeline distribution, and street-scale illumination."
        },
        "nextTeaser": "Month 21: Discover how humans advanced to Gas Light Pioneer."
    },
    {
        "id": 21,
        "slug": "gas-light-pioneer",
        "name": "GAS-LIGHT PIONEER",
        "title": "Gas-Light Pioneer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 4,
        "eraName": "Era IV: Industrial Light",
        "eraTheme": "Kerosene, Gas & Street Networks",
        "eraColor": "#64748b",
        "month": 21,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-21-gas-light-pioneer.png",
        "problemSolved": "Fuel can be supplied to a lamp through infrastructure.",
        "scienceConcept": "Distribution systems.",
        "technologyConcept": "Engineering and materials innovation in kerosene, gas & street networks.",
        "stemulusConnection": "Students implement gas-light pioneer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of gas-light pioneer in technological innovation.",
        "explanations": {
            "ages5_7": "Big lanterns and street lamps brightened whole town streets so people could walk safely after sunset.",
            "ages8_11": "Piping gas and kerosene through city networks turned light from single flames into urban infrastructure.",
            "ages12_17": "Municipal utility engineering: centralized fuel distillation, pressurized pipeline distribution, and street-scale illumination."
        },
        "nextTeaser": "Month 22: Discover how humans advanced to Streetlight Engineer."
    },
    {
        "id": 22,
        "slug": "streetlight-engineer",
        "name": "STREETLIGHT ENGINEER",
        "title": "Streetlight Engineer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 4,
        "eraName": "Era IV: Industrial Light",
        "eraTheme": "Kerosene, Gas & Street Networks",
        "eraColor": "#64748b",
        "month": 22,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-22-streetlight-engineer.png",
        "problemSolved": "Artificial light moves beyond individual homes into public spaces.",
        "scienceConcept": "Urban infrastructure.",
        "technologyConcept": "Engineering and materials innovation in kerosene, gas & street networks.",
        "stemulusConnection": "Students implement streetlight engineer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of streetlight engineer in technological innovation.",
        "explanations": {
            "ages5_7": "Big lanterns and street lamps brightened whole town streets so people could walk safely after sunset.",
            "ages8_11": "Piping gas and kerosene through city networks turned light from single flames into urban infrastructure.",
            "ages12_17": "Municipal utility engineering: centralized fuel distillation, pressurized pipeline distribution, and street-scale illumination."
        },
        "nextTeaser": "Month 23: Discover how humans advanced to Light Network Engineer."
    },
    {
        "id": 23,
        "slug": "light-network-engineer",
        "name": "LIGHT NETWORK ENGINEER",
        "title": "Light Network Engineer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 4,
        "eraName": "Era IV: Industrial Light",
        "eraTheme": "Kerosene, Gas & Street Networks",
        "eraColor": "#64748b",
        "month": 23,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-23-light-network-engineer.png",
        "problemSolved": "Multiple lamps become part of one connected lighting system.",
        "scienceConcept": "Networks and systems engineering.",
        "technologyConcept": "Engineering and materials innovation in kerosene, gas & street networks.",
        "stemulusConnection": "Students implement light network engineer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of light network engineer in technological innovation.",
        "explanations": {
            "ages5_7": "Big lanterns and street lamps brightened whole town streets so people could walk safely after sunset.",
            "ages8_11": "Piping gas and kerosene through city networks turned light from single flames into urban infrastructure.",
            "ages12_17": "Municipal utility engineering: centralized fuel distillation, pressurized pipeline distribution, and street-scale illumination."
        },
        "nextTeaser": "Month 24: Discover how humans advanced to Master Of Industrial Light."
    },
    {
        "id": 24,
        "slug": "master-of-industrial-light",
        "name": "MASTER OF INDUSTRIAL LIGHT",
        "title": "Master Of Industrial Light",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 4,
        "eraName": "Era IV: Industrial Light",
        "eraTheme": "Kerosene, Gas & Street Networks",
        "eraColor": "#64748b",
        "month": 24,
        "isMilestone": true,
        "image": "assets/images/badges/light-evolution/badge-24-master-of-industrial-light.png",
        "problemSolved": "Completion of the industrial lighting era.",
        "scienceConcept": "Energy transformation and physical principles.",
        "technologyConcept": "Engineering and materials innovation in kerosene, gas & street networks.",
        "stemulusConnection": "Students implement master of industrial light principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of master of industrial light in technological innovation.",
        "explanations": {
            "ages5_7": "Big lanterns and street lamps brightened whole town streets so people could walk safely after sunset.",
            "ages8_11": "Piping gas and kerosene through city networks turned light from single flames into urban infrastructure.",
            "ages12_17": "Municipal utility engineering: centralized fuel distillation, pressurized pipeline distribution, and street-scale illumination."
        },
        "nextTeaser": "Month 25: Discover how humans advanced to Electricity Explorer."
    },
    {
        "id": 25,
        "slug": "electricity-explorer",
        "name": "ELECTRICITY EXPLORER",
        "title": "Electricity Explorer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 5,
        "eraName": "Era V: The Electric Revolution",
        "eraTheme": "Arcs, Filaments & Bulbs",
        "eraColor": "#3b82f6",
        "month": 25,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-25-electricity-explorer.png",
        "problemSolved": "The child discovers the connection between electrical energy and light.",
        "scienceConcept": "Electricity and energy conversion.",
        "technologyConcept": "Engineering and materials innovation in arcs, filaments & bulbs.",
        "stemulusConnection": "Students implement electricity explorer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of electricity explorer in technological innovation.",
        "explanations": {
            "ages5_7": "Electricity travels through tiny wires to make clean, bright light inside a glass bulb without any smoke.",
            "ages8_11": "Electric current heats a filament inside a sealed vacuum bulb until it glows with incandescent light.",
            "ages12_17": "Electrical resistance heating and blackbody radiation: filament electron collisions emitting luminous flux within evacuated chambers."
        },
        "nextTeaser": "Month 26: Discover how humans advanced to Arc Light Pioneer."
    },
    {
        "id": 26,
        "slug": "arc-light-pioneer",
        "name": "ARC-LIGHT PIONEER",
        "title": "Arc-Light Pioneer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 5,
        "eraName": "Era V: The Electric Revolution",
        "eraTheme": "Arcs, Filaments & Bulbs",
        "eraColor": "#3b82f6",
        "month": 26,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-26-arc-light-pioneer.png",
        "problemSolved": "Electricity creates a powerful light through an electrical arc.",
        "scienceConcept": "Electrical discharge.",
        "technologyConcept": "Engineering and materials innovation in arcs, filaments & bulbs.",
        "stemulusConnection": "Students implement arc-light pioneer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of arc-light pioneer in technological innovation.",
        "explanations": {
            "ages5_7": "Electricity travels through tiny wires to make clean, bright light inside a glass bulb without any smoke.",
            "ages8_11": "Electric current heats a filament inside a sealed vacuum bulb until it glows with incandescent light.",
            "ages12_17": "Electrical resistance heating and blackbody radiation: filament electron collisions emitting luminous flux within evacuated chambers."
        },
        "nextTeaser": "Month 27: Discover how humans advanced to Filament Experimenter."
    },
    {
        "id": 27,
        "slug": "filament-experimenter",
        "name": "FILAMENT EXPERIMENTER",
        "title": "Filament Experimenter",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 5,
        "eraName": "Era V: The Electric Revolution",
        "eraTheme": "Arcs, Filaments & Bulbs",
        "eraColor": "#3b82f6",
        "month": 27,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-27-filament-experimenter.png",
        "problemSolved": "Inventors experiment with materials to find better ways to generate light electrically.",
        "scienceConcept": "Scientific experimentation and iteration.",
        "technologyConcept": "Engineering and materials innovation in arcs, filaments & bulbs.",
        "stemulusConnection": "Students implement filament experimenter principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of filament experimenter in technological innovation.",
        "explanations": {
            "ages5_7": "Electricity travels through tiny wires to make clean, bright light inside a glass bulb without any smoke.",
            "ages8_11": "Electric current heats a filament inside a sealed vacuum bulb until it glows with incandescent light.",
            "ages12_17": "Electrical resistance heating and blackbody radiation: filament electron collisions emitting luminous flux within evacuated chambers."
        },
        "nextTeaser": "Month 28: Discover how humans advanced to Vacuum Engineer."
    },
    {
        "id": 28,
        "slug": "vacuum-engineer",
        "name": "VACUUM ENGINEER",
        "title": "Vacuum Engineer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 5,
        "eraName": "Era V: The Electric Revolution",
        "eraTheme": "Arcs, Filaments & Bulbs",
        "eraColor": "#3b82f6",
        "month": 28,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-28-vacuum-engineer.png",
        "problemSolved": "The environment around the light-producing element becomes part of the engineering problem.",
        "scienceConcept": "Vacuum and controlled environments.",
        "technologyConcept": "Engineering and materials innovation in arcs, filaments & bulbs.",
        "stemulusConnection": "Students implement vacuum engineer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of vacuum engineer in technological innovation.",
        "explanations": {
            "ages5_7": "Electricity travels through tiny wires to make clean, bright light inside a glass bulb without any smoke.",
            "ages8_11": "Electric current heats a filament inside a sealed vacuum bulb until it glows with incandescent light.",
            "ages12_17": "Electrical resistance heating and blackbody radiation: filament electron collisions emitting luminous flux within evacuated chambers."
        },
        "nextTeaser": "Month 29: Discover how humans advanced to Incandescent Inventor."
    },
    {
        "id": 29,
        "slug": "incandescent-inventor",
        "name": "INCANDESCENT INVENTOR",
        "title": "Incandescent Inventor",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 5,
        "eraName": "Era V: The Electric Revolution",
        "eraTheme": "Arcs, Filaments & Bulbs",
        "eraColor": "#3b82f6",
        "month": 29,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-29-incandescent-inventor.png",
        "problemSolved": "Electrical current creates light through a heated filament.",
        "scienceConcept": "Resistance \u2192 heat \u2192 visible light.",
        "technologyConcept": "Engineering and materials innovation in arcs, filaments & bulbs.",
        "stemulusConnection": "Students implement incandescent inventor principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of incandescent inventor in technological innovation.",
        "explanations": {
            "ages5_7": "Electricity travels through tiny wires to make clean, bright light inside a glass bulb without any smoke.",
            "ages8_11": "Electric current heats a filament inside a sealed vacuum bulb until it glows with incandescent light.",
            "ages12_17": "Electrical resistance heating and blackbody radiation: filament electron collisions emitting luminous flux within evacuated chambers."
        },
        "nextTeaser": "Month 30: Discover how humans advanced to Master Of Electric Light."
    },
    {
        "id": 30,
        "slug": "master-of-electric-light",
        "name": "MASTER OF ELECTRIC LIGHT",
        "title": "Master Of Electric Light",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 5,
        "eraName": "Era V: The Electric Revolution",
        "eraTheme": "Arcs, Filaments & Bulbs",
        "eraColor": "#3b82f6",
        "month": 30,
        "isMilestone": true,
        "image": "assets/images/badges/light-evolution/badge-30-master-of-electric-light.png",
        "problemSolved": "The child completes the transformation from flame-based lighting to practical electrical lighting.",
        "scienceConcept": "Energy transformation and physical principles.",
        "technologyConcept": "Engineering and materials innovation in arcs, filaments & bulbs.",
        "stemulusConnection": "Students implement master of electric light principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of master of electric light in technological innovation.",
        "explanations": {
            "ages5_7": "Electricity travels through tiny wires to make clean, bright light inside a glass bulb without any smoke.",
            "ages8_11": "Electric current heats a filament inside a sealed vacuum bulb until it glows with incandescent light.",
            "ages12_17": "Electrical resistance heating and blackbody radiation: filament electron collisions emitting luminous flux within evacuated chambers."
        },
        "nextTeaser": "Month 31: Discover how humans advanced to Tungsten Engineer."
    },
    {
        "id": 31,
        "slug": "tungsten-engineer",
        "name": "TUNGSTEN ENGINEER",
        "title": "Tungsten Engineer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 6,
        "eraName": "Era VI: The Efficiency Revolution",
        "eraTheme": "Tungsten, Discharge & LEDs",
        "eraColor": "#06b6d4",
        "month": 31,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-31-tungsten-engineer.png",
        "problemSolved": "Engineers improve incandescent lamps through material science.",
        "scienceConcept": "High-temperature materials.",
        "technologyConcept": "Engineering and materials innovation in tungsten, discharge & leds.",
        "stemulusConnection": "Students implement tungsten engineer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of tungsten engineer in technological innovation.",
        "explanations": {
            "ages5_7": "Modern tiny LEDs glow brightly while staying cool to the touch and using very little battery power.",
            "ages8_11": "Semiconductor LEDs convert electric current directly into photons without wasting energy as heat.",
            "ages12_17": "Solid-state electroluminescence: semiconductor p-n junction electron-hole recombination emitting narrow-spectrum photons with high luminous efficacy."
        },
        "nextTeaser": "Month 32: Discover how humans advanced to Discharge Explorer."
    },
    {
        "id": 32,
        "slug": "discharge-explorer",
        "name": "DISCHARGE EXPLORER",
        "title": "Discharge Explorer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 6,
        "eraName": "Era VI: The Efficiency Revolution",
        "eraTheme": "Tungsten, Discharge & LEDs",
        "eraColor": "#06b6d4",
        "month": 32,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-32-discharge-explorer.png",
        "problemSolved": "Electricity excites gases to produce light.",
        "scienceConcept": "Electrical discharge.",
        "technologyConcept": "Engineering and materials innovation in tungsten, discharge & leds.",
        "stemulusConnection": "Students implement discharge explorer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of discharge explorer in technological innovation.",
        "explanations": {
            "ages5_7": "Modern tiny LEDs glow brightly while staying cool to the touch and using very little battery power.",
            "ages8_11": "Semiconductor LEDs convert electric current directly into photons without wasting energy as heat.",
            "ages12_17": "Solid-state electroluminescence: semiconductor p-n junction electron-hole recombination emitting narrow-spectrum photons with high luminous efficacy."
        },
        "nextTeaser": "Month 33: Discover how humans advanced to Fluorescent Engineer."
    },
    {
        "id": 33,
        "slug": "fluorescent-engineer",
        "name": "FLUORESCENT ENGINEER",
        "title": "Fluorescent Engineer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 6,
        "eraName": "Era VI: The Efficiency Revolution",
        "eraTheme": "Tungsten, Discharge & LEDs",
        "eraColor": "#06b6d4",
        "month": 33,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-33-fluorescent-engineer.png",
        "problemSolved": "Light is produced through a more complex electrical and material process.",
        "scienceConcept": "Energy conversion.",
        "technologyConcept": "Engineering and materials innovation in tungsten, discharge & leds.",
        "stemulusConnection": "Students implement fluorescent engineer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of fluorescent engineer in technological innovation.",
        "explanations": {
            "ages5_7": "Modern tiny LEDs glow brightly while staying cool to the touch and using very little battery power.",
            "ages8_11": "Semiconductor LEDs convert electric current directly into photons without wasting energy as heat.",
            "ages12_17": "Solid-state electroluminescence: semiconductor p-n junction electron-hole recombination emitting narrow-spectrum photons with high luminous efficacy."
        },
        "nextTeaser": "Month 34: Discover how humans advanced to Halogen Engineer."
    },
    {
        "id": 34,
        "slug": "halogen-engineer",
        "name": "HALOGEN ENGINEER",
        "title": "Halogen Engineer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 6,
        "eraName": "Era VI: The Efficiency Revolution",
        "eraTheme": "Tungsten, Discharge & LEDs",
        "eraColor": "#06b6d4",
        "month": 34,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-34-halogen-engineer.png",
        "problemSolved": "Engineers improve the traditional incandescent concept.",
        "scienceConcept": "Engineering refinement.",
        "technologyConcept": "Engineering and materials innovation in tungsten, discharge & leds.",
        "stemulusConnection": "Students implement halogen engineer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of halogen engineer in technological innovation.",
        "explanations": {
            "ages5_7": "Modern tiny LEDs glow brightly while staying cool to the touch and using very little battery power.",
            "ages8_11": "Semiconductor LEDs convert electric current directly into photons without wasting energy as heat.",
            "ages12_17": "Solid-state electroluminescence: semiconductor p-n junction electron-hole recombination emitting narrow-spectrum photons with high luminous efficacy."
        },
        "nextTeaser": "Month 35: Discover how humans advanced to Led Pioneer."
    },
    {
        "id": 35,
        "slug": "led-pioneer",
        "name": "LED PIONEER",
        "title": "Led Pioneer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 6,
        "eraName": "Era VI: The Efficiency Revolution",
        "eraTheme": "Tungsten, Discharge & LEDs",
        "eraColor": "#06b6d4",
        "month": 35,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-35-led-pioneer.png",
        "problemSolved": "Semiconductor technology creates a radically different kind of light source.",
        "scienceConcept": "LEDs and semiconductor physics.",
        "technologyConcept": "Engineering and materials innovation in tungsten, discharge & leds.",
        "stemulusConnection": "Students implement led pioneer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of led pioneer in technological innovation.",
        "explanations": {
            "ages5_7": "Modern tiny LEDs glow brightly while staying cool to the touch and using very little battery power.",
            "ages8_11": "Semiconductor LEDs convert electric current directly into photons without wasting energy as heat.",
            "ages12_17": "Solid-state electroluminescence: semiconductor p-n junction electron-hole recombination emitting narrow-spectrum photons with high luminous efficacy."
        },
        "nextTeaser": "Month 36: Discover how humans advanced to Master Of Modern Light."
    },
    {
        "id": 36,
        "slug": "master-of-modern-light",
        "name": "MASTER OF MODERN LIGHT",
        "title": "Master Of Modern Light",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 6,
        "eraName": "Era VI: The Efficiency Revolution",
        "eraTheme": "Tungsten, Discharge & LEDs",
        "eraColor": "#06b6d4",
        "month": 36,
        "isMilestone": true,
        "image": "assets/images/badges/light-evolution/badge-36-master-of-modern-light.png",
        "problemSolved": "Completion of the major evolution of artificial light sources.",
        "scienceConcept": "Energy transformation and physical principles.",
        "technologyConcept": "Engineering and materials innovation in tungsten, discharge & leds.",
        "stemulusConnection": "Students implement master of modern light principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of master of modern light in technological innovation.",
        "explanations": {
            "ages5_7": "Modern tiny LEDs glow brightly while staying cool to the touch and using very little battery power.",
            "ages8_11": "Semiconductor LEDs convert electric current directly into photons without wasting energy as heat.",
            "ages12_17": "Solid-state electroluminescence: semiconductor p-n junction electron-hole recombination emitting narrow-spectrum photons with high luminous efficacy."
        },
        "nextTeaser": "Month 37: Discover how humans advanced to Light Sensor."
    },
    {
        "id": 37,
        "slug": "light-sensor",
        "name": "LIGHT SENSOR",
        "title": "Light Sensor",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 7,
        "eraName": "Era VII: The Sensing Revolution",
        "eraTheme": "Photocells, PIR & Sound Sensors",
        "eraColor": "#8b5cf6",
        "month": 37,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-37-light-sensor.png",
        "problemSolved": "A light sensor allows a machine to detect brightness.",
        "scienceConcept": "Turning physical conditions into information.",
        "technologyConcept": "Engineering and materials innovation in photocells, pir & sound sensors.",
        "stemulusConnection": "Students implement light sensor principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of light sensor in technological innovation.",
        "explanations": {
            "ages5_7": "A light sensor has an electric eye that spots when the room gets dark.",
            "ages8_11": "Photoresistors change electrical resistance based on ambient light levels.",
            "ages12_17": "Photoconductive and photovoltaic transducers modulating circuit resistance in response to ambient photon flux."
        },
        "nextTeaser": "Month 38: Discover how humans advanced to Daylight Detective."
    },
    {
        "id": 38,
        "slug": "daylight-detective",
        "name": "DAYLIGHT DETECTIVE",
        "title": "Daylight Detective",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 7,
        "eraName": "Era VII: The Sensing Revolution",
        "eraTheme": "Photocells, PIR & Sound Sensors",
        "eraColor": "#8b5cf6",
        "month": 38,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-38-daylight-detective.png",
        "problemSolved": "A lighting system can respond to the amount of natural light available.",
        "scienceConcept": "Environmental sensing and automatic control.",
        "technologyConcept": "Engineering and materials innovation in photocells, pir & sound sensors.",
        "stemulusConnection": "Students implement daylight detective principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of daylight detective in technological innovation.",
        "explanations": {
            "ages5_7": "Fire gave early humans light and warmth so they could stay safe at night.",
            "ages8_11": "Controlling fire allowed humans to manipulate fuel, embers, and airflow to keep light burning.",
            "ages12_17": "Early thermodynamics and combustion engineering: containing chemical energy release into sustained radiant heat and visible light."
        },
        "nextTeaser": "Month 39: Discover how humans advanced to Motion And Pir Engineer."
    },
    {
        "id": 39,
        "slug": "motion-and-pir-engineer",
        "name": "MOTION & PIR ENGINEER",
        "title": "Motion & PIR Engineer",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 7,
        "eraName": "Era VII: The Sensing Revolution",
        "eraTheme": "Photocells, PIR & Sound Sensors",
        "eraColor": "#8b5cf6",
        "month": 39,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-39-motion-and-pir-engineer.png",
        "problemSolved": "A system can detect human movement and respond.",
        "scienceConcept": "Motion sensing and infrared technology.",
        "technologyConcept": "Engineering and materials innovation in photocells, pir & sound sensors.",
        "stemulusConnection": "Students implement motion & pir engineer principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of motion & pir engineer in technological innovation.",
        "explanations": {
            "ages5_7": "Motion sensors notice when someone walks in and turn the lights on like magic.",
            "ages8_11": "Passive infrared sensors detect changes in human body heat moving through the room.",
            "ages12_17": "Pyroelectric infrared detectors coupled with Fresnel optics sensing differential thermal radiation from human locomotion."
        },
        "nextTeaser": "Month 40: Discover how humans advanced to Sound Scientist."
    },
    {
        "id": 40,
        "slug": "sound-scientist",
        "name": "SOUND SCIENTIST",
        "title": "Sound Scientist",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 7,
        "eraName": "Era VII: The Sensing Revolution",
        "eraTheme": "Photocells, PIR & Sound Sensors",
        "eraColor": "#8b5cf6",
        "month": 40,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-40-sound-scientist.png",
        "problemSolved": "Sound is converted into an electronic signal that a machine can interpret.",
        "scienceConcept": "Sound \u2192 Sensor \u2192 Signal",
        "technologyConcept": "Engineering and materials innovation in photocells, pir & sound sensors.",
        "stemulusConnection": "Students implement sound scientist principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of sound scientist in technological innovation.",
        "explanations": {
            "ages5_7": "A sound sensor listens for claps and helps a machine know you made a sound.",
            "ages8_11": "A microphone converts sound vibrations into an electrical signal that a circuit can measure.",
            "ages12_17": "Acoustic transducers converting pressure wave oscillations into analog voltage signals for threshold comparison."
        },
        "nextTeaser": "Month 41: Discover how humans advanced to Clap Light Inventor."
    },
    {
        "id": 41,
        "slug": "clap-light-inventor",
        "name": "CLAP-LIGHT INVENTOR",
        "title": "Clap-Light Inventor",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 7,
        "eraName": "Era VII: The Sensing Revolution",
        "eraTheme": "Photocells, PIR & Sound Sensors",
        "eraColor": "#8b5cf6",
        "month": 41,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-41-clap-light-inventor.png",
        "problemSolved": "The system recognizes a sound trigger and activates a light.",
        "scienceConcept": "Sound \u2192 Microphone \u2192 Processing \u2192 Light",
        "technologyConcept": "Engineering and materials innovation in photocells, pir & sound sensors.",
        "stemulusConnection": "Students implement clap-light inventor principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of clap-light inventor in technological innovation.",
        "explanations": {
            "ages5_7": "A sound sensor listens for claps and helps a machine know you made a sound.",
            "ages8_11": "A microphone converts sound vibrations into an electrical signal that a circuit can measure.",
            "ages12_17": "Acoustic transducers converting pressure wave oscillations into analog voltage signals for threshold comparison."
        },
        "nextTeaser": "Month 42: Discover how humans advanced to Rgb Artist."
    },
    {
        "id": 42,
        "slug": "rgb-artist",
        "name": "RGB ARTIST",
        "title": "RGB Artist",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 7,
        "eraName": "Era VII: The Sensing Revolution",
        "eraTheme": "Photocells, PIR & Sound Sensors",
        "eraColor": "#8b5cf6",
        "month": 42,
        "isMilestone": true,
        "image": "assets/images/badges/light-evolution/badge-42-rgb-artist.png",
        "problemSolved": "Digital control allows light itself to become programmable color.",
        "scienceConcept": "RGB additive color and digital control.",
        "technologyConcept": "Engineering and materials innovation in photocells, pir & sound sensors.",
        "stemulusConnection": "Students implement rgb artist principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of rgb artist in technological innovation.",
        "explanations": {
            "ages5_7": "Red, green, and blue lights mix together inside one tiny lamp to create any color of the rainbow.",
            "ages8_11": "By adjusting the brightness of red, green, and blue LEDs with code, we can synthesize over 16 million colors.",
            "ages12_17": "Additive trichromatic color synthesis: Pulse-Width Modulation (PWM) duty cycles controlling multi-channel LED irradiance."
        },
        "nextTeaser": "Month 43: Discover how humans advanced to Automation Thinker."
    },
    {
        "id": 43,
        "slug": "automation-thinker",
        "name": "AUTOMATION THINKER",
        "title": "Automation Thinker",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 8,
        "eraName": "Era VIII: Intelligent Light",
        "eraTheme": "Microcontrollers & Adaptive Systems",
        "eraColor": "#ec4899",
        "month": 43,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-43-automation-thinker.png",
        "problemSolved": "A machine receives information, applies rules and creates an output.",
        "scienceConcept": "INPUT \u2192 LOGIC \u2192 OUTPUT",
        "technologyConcept": "Engineering and materials innovation in microcontrollers & adaptive systems.",
        "stemulusConnection": "Students implement automation thinker principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of automation thinker in technological innovation.",
        "explanations": {
            "ages5_7": "Smart lights can turn on and off all by themselves using rules you tell them.",
            "ages8_11": "Automation uses conditional logic (if-then statements) to control lights based on sensor inputs.",
            "ages12_17": "State machine design: deterministic rule engines mapping multi-sensor telemetry to programmatic output states."
        },
        "nextTeaser": "Month 44: Discover how humans advanced to Microcontroller Master."
    },
    {
        "id": 44,
        "slug": "microcontroller-master",
        "name": "MICROCONTROLLER MASTER",
        "title": "Microcontroller Master",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 8,
        "eraName": "Era VIII: Intelligent Light",
        "eraTheme": "Microcontrollers & Adaptive Systems",
        "eraColor": "#ec4899",
        "month": 44,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-44-microcontroller-master.png",
        "problemSolved": "A small computer can receive sensor information and control hardware.",
        "scienceConcept": "Sensors + Code + Hardware",
        "technologyConcept": "Engineering and materials innovation in microcontrollers & adaptive systems.",
        "stemulusConnection": "Students implement microcontroller master principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of microcontroller master in technological innovation.",
        "explanations": {
            "ages5_7": "A tiny computer chip acts like a little brain that listens to sensors and commands the light.",
            "ages8_11": "Microcontrollers run code loops that continuously read sensor pins and write output signals to lights.",
            "ages12_17": "Embedded computing: microcontroller architectures executing low-latency firmware I/O cycles to govern power electronics."
        },
        "nextTeaser": "Month 45: Discover how humans advanced to Smart Light Builder."
    },
    {
        "id": 45,
        "slug": "smart-light-builder",
        "name": "SMART-LIGHT BUILDER",
        "title": "Smart-Light Builder",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 8,
        "eraName": "Era VIII: Intelligent Light",
        "eraTheme": "Microcontrollers & Adaptive Systems",
        "eraColor": "#ec4899",
        "month": 45,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-45-smart-light-builder.png",
        "problemSolved": "A child can create a programmable light system that responds automatically.",
        "scienceConcept": "Embedded systems.",
        "technologyConcept": "Engineering and materials innovation in microcontrollers & adaptive systems.",
        "stemulusConnection": "Students implement smart-light builder principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of smart-light builder in technological innovation.",
        "explanations": {
            "ages5_7": "We assemble circuits, wires, and chips to build our very own programmable light gadgets.",
            "ages8_11": "Combining microcontrollers, sensors, and RGB LEDs on breadboards to fabricate working smart lighting prototypes.",
            "ages12_17": "Hardware-software integration: schematic design, peripheral bus communication, and embedded firmware deployment."
        },
        "nextTeaser": "Month 46: Discover how humans advanced to Iot Illuminator."
    },
    {
        "id": 46,
        "slug": "iot-illuminator",
        "name": "IOT ILLUMINATOR",
        "title": "IoT Illuminator",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 8,
        "eraName": "Era VIII: Intelligent Light",
        "eraTheme": "Microcontrollers & Adaptive Systems",
        "eraColor": "#ec4899",
        "month": 46,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-46-iot-illuminator.png",
        "problemSolved": "A light can become part of a connected digital ecosystem.",
        "scienceConcept": "Internet of Things.",
        "technologyConcept": "Engineering and materials innovation in microcontrollers & adaptive systems.",
        "stemulusConnection": "Students implement iot illuminator principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of iot illuminator in technological innovation.",
        "explanations": {
            "ages5_7": "Connected lights talk to our tablets over the air so we can control them from across the room.",
            "ages8_11": "IoT devices use Wi-Fi or Bluetooth protocols to send data packets and receive commands remotely.",
            "ages12_17": "Internet of Things networking: TCP/IP and MQTT pub-sub telemetry enabling distributed device fleet control."
        },
        "nextTeaser": "Month 47: Discover how humans advanced to Adaptive Light Architect."
    },
    {
        "id": 47,
        "slug": "adaptive-light-architect",
        "name": "ADAPTIVE LIGHT ARCHITECT",
        "title": "Adaptive Light Architect",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 8,
        "eraName": "Era VIII: Intelligent Light",
        "eraTheme": "Microcontrollers & Adaptive Systems",
        "eraColor": "#ec4899",
        "month": 47,
        "isMilestone": false,
        "image": "assets/images/badges/light-evolution/badge-47-adaptive-light-architect.png",
        "problemSolved": "Multiple sensors and programmed rules work together to determine the appropriate lighting behavior.",
        "scienceConcept": "Environment \u2192 Sensors \u2192 Computation \u2192 Decision \u2192 Lighting",
        "technologyConcept": "Engineering and materials innovation in microcontrollers & adaptive systems.",
        "stemulusConnection": "Students implement adaptive light architect principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of adaptive light architect in technological innovation.",
        "explanations": {
            "ages5_7": "The lights in a smart building know when morning arrives or people walk in, adjusting to keep everyone happy.",
            "ages8_11": "Adaptive lighting systems combine multiple sensor readings and algorithms to optimize brightness and circadian rhythm.",
            "ages12_17": "Closed-loop feedback control: multi-variable environmental telemetry driving dynamic circadian spectral tuning and energy optimization."
        },
        "nextTeaser": "Month 48: Discover how humans advanced to The Stemulus Luminary."
    },
    {
        "id": 48,
        "slug": "the-stemulus-luminary",
        "name": "THE STEMULUS LUMINARY",
        "title": "The STEMulus Luminary",
        "chapter": "Chapter 1: The Light Evolution\u2122",
        "eraId": 8,
        "eraName": "Era VIII: Intelligent Light",
        "eraTheme": "Microcontrollers & Adaptive Systems",
        "eraColor": "#ec4899",
        "month": 48,
        "isMilestone": true,
        "image": "assets/images/badges/light-evolution/badge-48-the-stemulus-luminary.png",
        "problemSolved": "The child has travelled through the entire history of artificial illumination.",
        "scienceConcept": "Energy transformation and physical principles.",
        "technologyConcept": "Engineering and materials innovation in microcontrollers & adaptive systems.",
        "stemulusConnection": "Students implement the stemulus luminary principles in hands-on coding, circuitry, and algorithmic design.",
        "takeaway": "Understanding the role of the stemulus luminary in technological innovation.",
        "explanations": {
            "ages5_7": "From the first campfire to smart glowing cities, you understand the entire journey of human light.",
            "ages8_11": "You have mastered how humanity evolved from finding fire to programming intelligent, adaptive machines.",
            "ages12_17": "The complete synthesis of human technological evolution: discover, control, contain, electrify, sense, program, connect, and adapt."
        },
        "nextTeaser": "Capstone Milestone: You have reached the pinnacle of Chapter 1: The Light Evolution."
    }
];

    function getAllBadges() {
        return BADGES;
    }

    function getEras() {
        return ERAS;
    }

    function getBadge(idOrMonth) {
        const num = parseInt(idOrMonth, 10);
        return BADGES.find(b => b.id === num || b.month === num) || null;
    }

    /**
     * Calculates the student's passport progression:
     * - Returns unlocked badges based on enrollment months / attended sessions.
     * - Every enrolled student has at least Month 1 unlocked.
     */
    function getStudentPassport(studentId) {
        let student = null;
        if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getStudents) {
            const all = DashboardEngine.getStudents();
            student = all.find(s => s.id === studentId) || null;
        }

        // Calculate progression months
        let unlockedCount = 1;
        if (student) {
            let attendedCount = 0;
            if (typeof DashboardEngine !== 'undefined' && DashboardEngine.getAttendanceRecords) {
                const logs = DashboardEngine.getAttendanceRecords() || [];
                const sName = ((student.firstName || '') + ' ' + (student.lastName || '')).trim().toLowerCase();
                attendedCount = logs.filter(r => 
                    (r.studentId === student.id || (r.studentName && r.studentName.toLowerCase() === sName)) &&
                    (r.status === 'approved' || r.status === 'present' || r.attendanceStatus === 'present')
                ).length;
            }
            
            // Enrollment duration in months
            let monthsSinceEnrolled = 1;
            if (student.enrolledDate || student.createdAt) {
                const enrolled = new Date(student.enrolledDate || student.createdAt);
                const now = new Date();
                const diffTime = Math.max(0, now - enrolled);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                monthsSinceEnrolled = Math.max(1, Math.floor(diffDays / 30) + 1);
            } else if (student.metrics && student.metrics.attended) {
                monthsSinceEnrolled = Math.max(1, Math.ceil(student.metrics.attended / 4));
            } else if (attendedCount > 0) {
                monthsSinceEnrolled = Math.max(1, Math.ceil(attendedCount / 4));
            }
            
            // Demo student defaults
            if (student.id === 'std-1001' || (student.firstName === 'Daniel' && student.lastName === 'M.')) {
                monthsSinceEnrolled = Math.max(monthsSinceEnrolled, 4);
            }
            if (student.id === 'std-1002' || (student.firstName === 'Sarah' && student.lastName === 'M.')) {
                monthsSinceEnrolled = Math.max(monthsSinceEnrolled, 2);
            }

            unlockedCount = Math.min(48, Math.max(1, monthsSinceEnrolled));
        }

        const currentBadge = getBadge(unlockedCount);
        const nextBadge = unlockedCount < 48 ? getBadge(unlockedCount + 1) : null;
        const currentEra = ERAS.find(e => unlockedCount >= e.startMonth && unlockedCount <= e.endMonth) || ERAS[0];

        const badgeList = BADGES.map(b => Object.assign({}, b, {
            isUnlocked: b.month <= unlockedCount,
            isCurrent: b.month === unlockedCount,
            isNext: b.month === unlockedCount + 1
        }));

        return {
            studentId: student ? student.id : null,
            studentName: student ? (student.firstName + ' ' + student.lastName) : 'Coder',
            studentAge: student ? (student.age || 10) : 10,
            unlockedCount: unlockedCount,
            totalBadges: 48,
            completionPercent: Math.round((unlockedCount / 48) * 100),
            currentEra: currentEra,
            currentBadge: currentBadge,
            nextBadge: nextBadge,
            badges: badgeList
        };
    }

    /**
     * Opens the interactive Technology Passport badge modal
     */
    function openBadgeModal(badgeId, studentAge) {
        const b = getBadge(badgeId);
        if (!b) return;

        let modal = document.getElementById('passport-badge-modal');
        if (!modal) {
            createModalElement();
            modal = document.getElementById('passport-badge-modal');
        }

        const ageNum = parseInt(studentAge, 10) || 10;

        // Populate content
        const imgEl = document.getElementById('pbm-image');
        if (imgEl) imgEl.src = b.image;
        const titleEl = document.getElementById('pbm-title');
        if (titleEl) titleEl.textContent = b.title;
        const eraBadgeEl = document.getElementById('pbm-era-badge');
        if (eraBadgeEl) {
            eraBadgeEl.textContent = b.eraName;
            eraBadgeEl.style.backgroundColor = b.eraColor + '15';
            eraBadgeEl.style.color = b.eraColor;
            eraBadgeEl.style.borderColor = b.eraColor + '40';
        }
        const monthBadgeEl = document.getElementById('pbm-month-badge');
        if (monthBadgeEl) monthBadgeEl.textContent = 'Month ' + b.month + ' of 48';

        const probEl = document.getElementById('pbm-problem');
        if (probEl) probEl.textContent = b.problemSolved;
        const sciEl = document.getElementById('pbm-science');
        if (sciEl) sciEl.textContent = b.scienceConcept;
        const techEl = document.getElementById('pbm-tech');
        if (techEl) techEl.textContent = b.technologyConcept;
        const stemEl = document.getElementById('pbm-stemulus');
        if (stemEl) stemEl.textContent = b.stemulusConnection;
        const nextEl = document.getElementById('pbm-next');
        if (nextEl) nextEl.textContent = b.nextTeaser;

        // Age adaptive text resolution
        let activeTab = '8_11';
        if (ageNum <= 7) activeTab = '5_7';
        else if (ageNum >= 12) activeTab = '12_17';

        function setAgeExplanation(tab) {
            const ageText = tab === '5_7' 
                ? b.explanations.ages5_7 
                : tab === '12_17' 
                    ? b.explanations.ages12_17 
                    : b.explanations.ages8_11;
            const expEl = document.getElementById('pbm-age-explanation');
            if (expEl) expEl.textContent = ageText;

            ['5_7', '8_11', '12_17'].forEach(t => {
                const btn = document.getElementById('pbm-tab-' + t);
                if (btn) {
                    if (t === tab) {
                        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all';
                    } else {
                        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all';
                    }
                }
            });
        }

        setAgeExplanation(activeTab);

        const tab57 = document.getElementById('pbm-tab-5_7');
        if (tab57) tab57.onclick = function() { setAgeExplanation('5_7'); };
        const tab811 = document.getElementById('pbm-tab-8_11');
        if (tab811) tab811.onclick = function() { setAgeExplanation('8_11'); };
        const tab1217 = document.getElementById('pbm-tab-12_17');
        if (tab1217) tab1217.onclick = function() { setAgeExplanation('12_17'); };

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        if (window.lucide) lucide.createIcons();
    }

    function closeBadgeModal() {
        const modal = document.getElementById('passport-badge-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    function createModalElement() {
        const div = document.createElement('div');
        div.id = 'passport-badge-modal';
        div.className = 'fixed inset-0 z-[9999] hidden flex items-center justify-center p-4 overflow-y-auto animate-fadeIn';
        div.innerHTML = `
            <div class="fixed inset-0 bg-slate-950/75 backdrop-blur-md" onclick="BadgePassportEngine.closeBadgeModal()"></div>
            <div class="relative bg-white border border-slate-200/90 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 z-10 my-6">
                <!-- Header -->
                <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                    <div>
                        <div class="flex items-center gap-2 flex-wrap mb-1.5">
                            <span class="text-[11px] font-extrabold px-3 py-0.5 rounded-full border" id="pbm-era-badge">Era</span>
                            <span class="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full" id="pbm-month-badge">Month</span>
                            <span class="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">Chapter 1: The Light Evolution</span>
                        </div>
                        <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight" id="pbm-title">Badge Title</h2>
                    </div>
                    <button type="button" onclick="BadgePassportEngine.closeBadgeModal()" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0" aria-label="Close modal">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- 3D Badge Visual Hero -->
                <div class="relative flex items-center justify-center py-6 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 rounded-2xl overflow-hidden mb-6 shadow-inner border border-slate-800">
                    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25)_0%,transparent_70%)] pointer-events-none"></div>
                    <img id="pbm-image" src="" alt="Badge" class="relative z-10 w-48 h-48 sm:w-56 sm:h-56 object-contain drop-shadow-[0_20px_35px_rgba(255,255,255,0.18)] transition-transform duration-500 hover:scale-105">
                </div>

                <!-- Age-Adaptive Explanation Selector -->
                <div class="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 mb-6">
                    <div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <span class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900">Explanation for Age Group</span>
                        <div class="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-indigo-200/60 shadow-sm">
                            <button type="button" id="pbm-tab-5_7" class="px-3 py-1 rounded-lg text-xs font-bold">Ages 5–7</button>
                            <button type="button" id="pbm-tab-8_11" class="px-3 py-1 rounded-lg text-xs font-bold">Ages 8–11</button>
                            <button type="button" id="pbm-tab-12_17" class="px-3 py-1 rounded-lg text-xs font-bold">Ages 12–17</button>
                        </div>
                    </div>
                    <p class="text-sm text-slate-800 font-medium leading-relaxed italic" id="pbm-age-explanation"></p>
                </div>

                <!-- Core Innovation Pillars -->
                <div class="space-y-4 mb-6">
                    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                        <div class="flex items-center gap-2 mb-1 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                            <i data-lucide="compass" class="w-4 h-4 text-indigo-600"></i>
                            <span>What Did Humans Solve?</span>
                        </div>
                        <p class="text-xs text-slate-600 leading-relaxed font-medium" id="pbm-problem"></p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                            <div class="flex items-center gap-1.5 mb-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                                <i data-lucide="atom" class="w-3.5 h-3.5 text-blue-600"></i>
                                <span>The Science</span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed font-medium" id="pbm-science"></p>
                        </div>
                        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                            <div class="flex items-center gap-1.5 mb-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                                <i data-lucide="cpu" class="w-3.5 h-3.5 text-purple-600"></i>
                                <span>The Technology</span>
                            </div>
                            <p class="text-xs text-slate-600 leading-relaxed font-medium" id="pbm-tech"></p>
                        </div>
                    </div>

                    <div class="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                        <div class="flex items-center gap-2 mb-1 text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                            <i data-lucide="code" class="w-4 h-4 text-emerald-600"></i>
                            <span>STEMulus Connection</span>
                        </div>
                        <p class="text-xs text-emerald-800 leading-relaxed font-medium" id="pbm-stemulus"></p>
                    </div>
                </div>

                <!-- Next Discovery Teaser -->
                <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between gap-3">
                    <div>
                        <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block mb-0.5">Next Milestone</span>
                        <p class="text-xs text-amber-900 font-semibold" id="pbm-next"></p>
                    </div>
                    <button type="button" onclick="BadgePassportEngine.closeBadgeModal()" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shrink-0">
                        Got It
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    }

    return {
        getAllBadges: getAllBadges,
        getEras: getEras,
        getBadge: getBadge,
        getStudentPassport: getStudentPassport,
        openBadgeModal: openBadgeModal,
        closeBadgeModal: closeBadgeModal
    };
})();

if (typeof window !== 'undefined') {
    window.BadgePassportEngine = BadgePassportEngine;
}
