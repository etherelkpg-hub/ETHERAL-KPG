import type { FieldMap } from './store';

export const COMPARISON_RATINGS = ['Poor', 'Acceptable', 'Good', 'Very Good', 'Excellent'] as const;
export type ComparisonRating = (typeof COMPARISON_RATINGS)[number];

export interface SiteProperty {
  property: string;
  overview: string;
  comparison: string;
  rating: ComparisonRating | null;
  note?: string;
}

// Source: Scientific Properties tables in the NASA Beyond Earth Notion export.
// Ratings are qualitative editorial judgments based on the comparison text.
export const SITE_PROPERTIES: Record<FieldMap, readonly SiteProperty[]> = {
  "atacama": [
    {
      "property": "Diverse Rocks and Rugged Terrain",
      "overview": "Contains rocky mountains, volcanic formations, and sedimentary rock structures.",
      "comparison": "• Similarity: Both have diverse rocky landscapes and uneven terrain.\n• Differences:\n    ◦ Mars has much larger and more extensive geological formations than Atacama.\n    ◦ Mars contains giant volcanoes such as Olympus Mons, which is much larger than Earth's volcanoes.",
      "rating": "Good"
    },
    {
      "property": "Steep Slopes and Sharp Terrain",
      "overview": "Contains steep mountain slopes, valleys, and rugged landforms.",
      "comparison": "• Similarity: Both have steep slopes, valleys, and significant changes in elevation.\n• Differences:\n    ◦ The slopes and valleys in Atacama are relatively smaller than those on Mars.\n    ◦ Mars contains enormous canyons, such as Valles Marineris, which are much larger than the valleys found in Atacama.",
      "rating": "Good"
    },
    {
      "property": "Loose Sand and Soil",
      "overview": "Contains dry soil, loose sand, and unconsolidated sediment deposits.",
      "comparison": "• Similarity: Both contain loose surface materials that can be transported by wind.\n• Differences:\n    ◦ Atacama's soil is influenced by Earth's environmental conditions, including salts and occasional moisture.\n    ◦ Martian soil has a different chemical and mineral composition and is affected by Mars' atmosphere and environmental conditions.",
      "rating": "Very Good"
    },
    {
      "property": "Craters and Crater-like Features",
      "overview": "Some areas around the desert contain volcanic craters and crater-like geological formations.",
      "comparison": "• Similarity: Both have circular depressions and surface features that resemble craters.\n• Differences:\n    ◦ Many craters in the Atacama region are volcanic in origin.\n    ◦ Mars contains thousands of impact craters formed by meteorite and asteroid collisions.\n    ◦ Therefore, Atacama's volcanic craters are not identical to the impact craters found on Mars.",
      "rating": "Acceptable"
    },
    {
      "property": "Extreme Dryness and Water Scarcity",
      "overview": "One of the driest deserts on Earth, experiencing extremely low rainfall and severe water scarcity.",
      "comparison": "• Similarity: Both environments are extremely dry and have very limited liquid water on the surface.\n• Differences:\n    ◦ Atacama still experiences atmospheric humidity and occasional rainfall.\n    ◦ Mars has an extremely thin atmosphere, making stable liquid water on its surface difficult under current conditions.\n    ◦ Mars contains water ice, while the hyperarid core of Atacama does not have comparable ice reserves.",
      "rating": "Excellent"
    },
    {
      "property": "Large Temperature Variations",
      "overview": "Experiences temperature differences between daytime and nighttime.",
      "comparison": "• Similarity: Both environments experience daily temperature fluctuations.\n• Differences:\n    ◦ Temperatures in Atacama are generally higher.\n    ◦ Mars is much colder because it is farther from the Sun and has a very thin atmosphere.\n    ◦ Mars loses heat more quickly, resulting in extremely cold nighttime temperatures.",
      "rating": "Acceptable"
    },
    {
      "property": "Fine Dust and Soil",
      "overview": "Contains dry soil, fine sediments, dust, and salt deposits.",
      "comparison": "• Similarity: Both environments contain fine particles and surface materials that can be transported by wind.\n• Differences:\n    ◦ Dust activity is relatively limited in many parts of Atacama.\n    ◦ Mars experiences large dust storms that can cover extensive regions or even the entire planet.\n    ◦ Martian dust can significantly affect visibility, equipment, and solar energy systems.",
      "rating": "Good"
    },
    {
      "property": "Ice or Frozen Soil",
      "overview": "High-altitude areas of the surrounding Andes Mountains may contain snow and ice.",
      "comparison": "• Similarity: Both environments have water ice in cold regions.\n• Differences:\n    ◦ Ice in the Atacama region is mainly found in high-altitude mountain areas, not in the hyperarid desert core.\n    ◦ Mars contains large amounts of water ice in its polar regions and beneath its surface.\n    ◦ Martian ice exists in a much colder and harsher environment.",
      "rating": "Acceptable"
    },
    {
      "property": "Isolation from Populated Areas",
      "overview": "Includes remote areas located far from major population centers.",
      "comparison": "• Similarity: Both provide environments suitable for studying isolation and the challenges of accessing remote locations.\n• Differences:\n    ◦ Atacama can be reached using roads and conventional transportation.\n    ◦ Reaching Mars requires advanced space missions and spacecraft technology.\n    ◦ Astronauts on Mars would depend on life-support systems and limited supplies, unlike researchers working in Atacama.",
      "rating": "Acceptable"
    },
    {
      "property": "Low Illumination and Long Shadows",
      "overview": "Has clear skies and strong sunlight, with long shadows appearing when the Sun is low near sunrise and sunset.",
      "comparison": "• Similarity: Both locations can experience long shadows when the Sun is low in the sky.\n• Differences:\n    ◦ Atacama receives stronger sunlight because Earth is closer to the Sun than Mars.\n    ◦ Mars receives less solar energy due to its greater distance from the Sun.\n    ◦ Atacama is not continuously a low-illumination environment, unlike some lighting conditions on Mars.",
      "rating": "Acceptable"
    },
    {
      "property": "Spectrometers, Microscopy Instruments, and Sample Collection Tools",
      "overview": "Scientists use spectrometers, microscopy instruments, and sample collection tools to analyze soil, rocks, minerals, and microorganisms in the Atacama Desert.",
      "comparison": "- Similarity:\n• Both Atacama and Mars research use spectrometers to identify chemical and mineral compositions.\n• Microscopy helps scientists examine tiny particles and possible microbial structures.\n• Sample collection tools are used to collect and study soil and rock samples.\n- Differences:\n• In Atacama, scientists can directly access the environment and collect samples using field equipment.\n• On Mars, robotic rovers use specialized instruments to analyze samples because humans cannot currently conduct field research there.\n• Mars missions face limitations in power, equipment size, communication, and sample handling compared with research on Earth.",
      "rating": "Very Good"
    }
  ],
  "haughton": [
    {
      "property": "Diverse Rocks and Rugged Terrain",
      "overview": "Contains various rock types and rough rocky surfaces.",
      "comparison": "Similarities  :  \n1. Both have diverse rock formations and rocky surfaces.\n2. Both contain impact-related geological features.\n3. Both have uneven terrain with rocks and rugged landscapes.           Differences                                             \n1. Haughton Crater has Earth-based rocks, while Mars has its own distinct geological composition.\n2. Haughton Crater's rocks are affected by Earth's water, ice, and weathering processes, while Mars has different surface conditions.\n3. Mars has a wider variety of volcanic and sedimentary geological formations.",
      "rating": "Very Good"
    },
    {
      "property": "Steep Slopes and Sharp Landforms",
      "overview": "Features steep slopes, cliffs, and uneven terrain",
      "comparison": "Similarities   \n1. Both Haughton Crater and Mars have steep slopes and rugged landforms.\n2. Both contain cliffs, valleys, and uneven rocky surfaces.\n3. Both have impact-related landforms that create irregular terrain.                                                      Differences \n1. Haughton Crater's slopes are influenced by Arctic erosion, ice, and freeze-thaw processes, while Mars has different geological erosion processes.\n2. Mars has much larger and deeper canyon systems than Haughton Crater.\n3. Haughton Crater is affected by Earth's gravity and atmosphere, while Mars has lower gravity and a thin atmosphere.",
      "rating": "Very Good"
    },
    {
      "property": "Loose Sand and Soil",
      "overview": "Contains loose sediments and fragmented surface materials.",
      "comparison": "Similarities 1. Both Haughton Crater and Mars contain loose surface sediments with sand-sized particles 2. Both environments contain fine-grained materials and small rock fragments on their surfaces                              Differences 1. Haughton Crater contains sand-sized sediments around the crater and silt-sized particles inside it, while Mars has widespread sandy and dusty regolith across its surface 2. Martian sand is actively transported and reshaped by wind, forming dunes and ripples, while Haughton's sediments are strongly influenced by Arctic weathering and glacial processes.",
      "rating": "Good"
    },
    {
      "property": "Craters and Crater - like Features",
      "overview": "Features an ancient impact crater and impact-related formations.",
      "comparison": "Similarities  \n1. Both Haughton Crater and Mars contain impact craters formed by collisions with space objects.\n2. Both have circular crater structures with depressed central areas.\n3. Both show geological changes caused by impact events, including fractured rocks and displaced materials.                               Differences\n1. Haughton Crater is a single, well-studied impact structure, while Mars contains thousands of impact craters of different sizes.\n2. Haughton Crater has an apparent diameter of approximately 23 km, while Martian craters range from very small to hundreds of kilometers.\n3. Haughton's original crater structure has been modified by erosion and glacial processes, while Martian craters have been modified by processes such as wind erosion, volcanic activity, and impacts.",
      "rating": "Excellent"
    },
    {
      "property": "Extreme Dryness and Water Scarcity",
      "overview": "Has a cold, dry Arctic desert environment",
      "comparison": "1. Similarities \n1. Both environments are extremely dry, with very little available liquid water on the surface.\n2. Both experience conditions that make liquid water unstable and difficult to maintain.\n3. Water is mainly present as ice or frozen ground rather than flowing liquid water.\n4. Both environments are useful for studying how life might survive under extremely dry conditions.\n2. Differences \n1. Haughton Crater: Located in the Arctic, where water is available as snow, ground ice, and permafrost.\n2. Mars: Has an extremely thin atmosphere and very low atmospheric pressure, making stable liquid water on the surface difficult.\n3. Haughton Crater: Experiences seasonal snow and ice changes, providing some opportunities for water availability during warmer periods.\n4. Mars: Most of its accessible water is stored as subsurface ice or polar ice deposits, with very limited surface liquid water.",
      "rating": "Very Good"
    },
    {
      "property": "Large Temperature Variations",
      "overview": "Experiences extremely cold temperatures and seasonal changes.",
      "comparison": "Similarities \n1. Both Haughton Crater and Mars experience extremely cold temperatures.\n2. Both experience seasonal temperature changes between summer and winter.\n3. Both have significant temperature variations that affect surface conditions and exploration.\nDifferences \n1. Haughton Crater has an Arctic climate, while Mars has a much colder and thinner atmosphere.\n2. Mars experiences much larger day-to-night temperature changes than Haughton Crater.\n3. Haughton experiences seasonal temperature changes influenced by Earth's atmosphere, while Mars has more extreme temperature fluctuations due to its thin atmosphere.",
      "rating": "Good"
    },
    {
      "property": "Fine Dust and soil",
      "overview": "The area contains fine dust, loose soil, and weathered rock particles across its surface.",
      "comparison": "Similarities \n1. Both Haughton Crater and Mars contain fine-grained surface sediments, including silt and dust-sized particles.\n\n2. Both environments contain loose materials produced by geological weathering and rock breakdown.\n\n3. Fine particles are present in both environments and can accumulate on the surface.\nDifferences \n1. Haughton Crater contains sand-sized sediments around the crater and more silt-sized particles inside it, while Martian soil contains globally distributed fine dust mixed with local materials.\n\n2. Martian dust is rich in iron-bearing minerals, which contribute to its reddish color, while Haughton's sediments have a different mineral composition.\n\n3. Mars experiences regional and global dust storms that transport fine particles through its atmosphere.",
      "rating": "Good"
    },
    {
      "property": "Ice or Frozen Soil",
      "overview": "The area contains permanently frozen ground (permafrost) and ice deposits due to extremely low temperatures.",
      "comparison": "Similarities \n1. Both Haughton Crater and Mars contain permanently frozen ground (permafrost).\n2. Both environments have water ice beneath the surface.\n3. Both contain ice-rich soil and frozen materials that influence surface features.\nDifferences \n1. Haughton Crater has continuous permafrost, while the distribution of ice-rich ground on Mars varies depending on latitude and location.\n2. Haughton contains ground ice within impact-related deposits and ice wedges, while Mars has extensive subsurface ice deposits and polar ice caps.\n3. Haughton's ground ice is affected by seasonal thawing, while much of Mars' subsurface ice remains frozen because of its extremely cold conditions.",
      "rating": "Excellent"
    },
    {
      "property": "Isolation  from Populated Areas",
      "overview": "Haughton Crater is located on remote, uninhabited Devon Island in the Canadian Arctic, far from major populated areas.",
      "comparison": "1. Similarities – \n1. Both environments are isolated from major populated areas, making access to them difficult.\n2. Both require careful planning and preparation before conducting scientific research.\n3. Both present logistical challenges because transportation, equipment, and supplies are not easily accessible.\n4. Both are useful for studying how researchers or astronauts can work in remote environments with limited external support.\n2. Differences \n1. Haughton Crater: Located on Devon Island in the Canadian Arctic, which is completely uninhabited and has very limited infrastructure.\n2. Mars: Has no permanent human population, and astronauts would be separated from Earth by millions of kilometers.\n3. Haughton Crater: Researchers can eventually return to populated areas on Earth using aircraft and other transportation.\n4. Mars: Returning to Earth is much more difficult and requires a planned space mission, with communication delays of up to approximately 22 minutes one way.",
      "rating": "Good"
    },
    {
      "property": "Low IIumination and Long Shadows",
      "overview": "Haughton Crater experiences long periods of low-angle sunlight, creating long shadows across its rocky terrain.",
      "comparison": "Similarities \n1. Both Haughton Crater and Mars experience low-angle sunlight during certain periods, creating long shadows.\n2. Both have rocky surfaces where shadows help reveal the shape and details of the terrain.\n3. Both experience changes in illumination throughout the day, affecting visibility and robotic navigation.\nDifferences \n1. Haughton Crater experiences continuous summer daylight during the Arctic summer, while Mars has regular day and night cycles.\n2. Mars has a dusty atmosphere that scatters sunlight and creates extended twilight, while Haughton's atmosphere is Earth's atmosphere.\n3. Haughton's long shadows are strongly influenced by its high Arctic latitude, while Martian shadows depend on the Sun's position, season, and surface location.",
      "rating": "Good"
    },
    {
      "property": "Spectrometers, Microscopy Instruments, and Sample Collection Tools",
      "overview": "Haughton Crater provides a natural environment for testing spectrometers, microscopes, and sample collection tools to study rocks, minerals, and soil, helping scientists prepare for similar investigations on Mars.",
      "comparison": "Similarities \n1. Both Haughton Crater and Mars exploration use microscopes to examine rock textures, minerals, and soil particles.\n2. Both use spectrometers to analyze the chemical and mineral composition of rocks and soil.\n3. Both involve collecting rock and soil samples for scientific investigation.\nDifferences \n1. Haughton uses laboratory and portable field instruments, while Mars uses advanced scientific instruments mounted on robotic rovers.\n2. Haughton samples can be transported to Earth laboratories for detailed analysis, while Martian samples are analyzed by rover instruments or stored for possible future return to Earth.\n3. Mars rovers use robotic arms and automated drilling systems to collect samples, while Haughton researchers use handheld tools and field equipment.",
      "rating": "Very Good"
    }
  ],
  "death-valley": [
    {
      "property": "Diverse Rocks and Rugged Terrain",
      "overview": "Mars Hill contains exposed basaltic lava and rock-rich deposits forming a boulder-covered surface.",
      "comparison": "• GRSFE compares Mars Hill with the rocky surface observed by Viking Lander",
      "rating": "Very Good"
    },
    {
      "property": "Steep Slopes and Sharp Terrain",
      "overview": "Earthdata lists a Death Valley terrain product containing elevation, slope, and relief information.",
      "comparison": "• Closer to Mars for alluvial-fan landscapes.• Death Valley and Gale Crater contain fan-shaped sediment deposits associated with water flowing from higher terrain.• The similarity concerns sediment transport and landform development, not proven equality of slope angles.",
      "rating": "Very Good"
    },
    {
      "property": "Loose Sand and Soil",
      "overview": "GRSFE documents dunes near Stovepipe Wells and samples of loose sand collected from dune surfaces.",
      "comparison": "• Closer to Mars.• Both environments contain dunes and wind-shaped deposits.",
      "rating": "Excellent"
    },
    {
      "property": "Craters and Crater-like Features",
      "overview": "GRSFE documents Ubehebe Crater and basaltic material erupted during its formation.",
      "comparison": "• Mars: Potential geometric comparison with crater walls, rims, and depressions.",
      "rating": "Acceptable"
    },
    {
      "property": "Geological Diversity",
      "overview": "Documented rock types include limestone, quartzite, shale, and volcanic rocks.",
      "comparison": "• Mars: Surface composition can be investigated using CRISM data.",
      "rating": null
    },
    {
      "property": "Temperature Variations",
      "overview": "Death Valley surface-temperature data have not yet been analyzed in this project.",
      "comparison": "• Closer analog: Not yet determined.\n• Compare daytime, nighttime, and seasonal surface temperatures with selected Martian sites",
      "rating": null
    },
    {
      "property": "Low Illumination and Long Shadows",
      "overview": "Solar angles and shadow duration have not yet been measured at the selected Death Valley sites.",
      "comparison": "• Closer analog: Not yet determined.• Compare terrain shading and lighting conditions with selected Martian locations.",
      "rating": null
    },
    {
      "property": "Fine Dust and Soil",
      "overview": "Dust grain size, shape, and adhesion have not yet been analyzed at the selected Death Valley sites.",
      "comparison": "• Closer analog: Not yet determined.• Compare terrain shading and lighting conditions with selected Martian locations.",
      "rating": null,
      "note": "The comparison in the project notes refers to lighting. A dust comparison is still needed."
    },
    {
      "property": "Isolation from Populated Areas",
      "overview": "Subsurface layering, material strength, and drilling resistance have not yet been assessed.",
      "comparison": "• Closer analog: Not yet determined.• Compare terrain shading and lighting conditions with selected Martian locations.",
      "rating": null,
      "note": "The project notes list drilling in the overview and lighting in the comparison for this row. A comparison of isolation is still needed."
    },
    {
      "property": "Extreme Dryness and Water Scarcity",
      "overview": "Death Valley’s valley floor receives less than 50 mm (2 inches) of rainfall annually on average. Surrounding mountain ranges create a rain-shadow effect that limits incoming moisture. Despite this extreme dryness, groundwater supports springs, seeps, and streams in the park.",
      "comparison": "• Similarity: Both Death Valley and present-day Mars have dry landscapes with limited surface liquid water.",
      "rating": "Good"
    },
    {
      "property": "Presence of Ice or Frozen Soil",
      "overview": "Temporary surface ice is documented at Racetrack Playa. During cold winter nights, shallow pond water can freeze into thin ice sheets. Observations in December 2013 recorded ice less than 5 mm thick, which broke into floating panels and pushed rocks across the wet playa.",
      "comparison": "Similarity: Water ice occurs in both locations. Death Valley’s Racetrack Playa can develop temporary ice sheets, while Mars has documented subsurface water-ice deposits",
      "rating": "Acceptable"
    }
  ],
  "wadi": [
    {
      "property": "Ice or Frozen Soil",
      "overview": "Wadi Rum has a hot, dry desert climate with no established permanent surface ice or widespread permafrost. Its water resources mainly exist in liquid form underground",
      "comparison": "Differences: Mars has water ice in its polar regions and beneath its surface, whereas Wadi Rum has no documented comparable ice deposits.",
      "rating": "Poor"
    },
    {
      "property": "Fine Dust and Soil",
      "overview": "Wadi Rum has sandy and dusty surfaces influenced by wind erosion and sediment transport. Fine particles can accumulate across valleys and exposed desert areas",
      "comparison": "• Similarities: Both have fine dust, loose surface particles, and wind-driven dust movement.\n• Differences: Martian dust is extremely fine and can create planet-wide dust storms, while Wadi Rum experiences terrestrial wind and dust processes",
      "rating": "Good"
    },
    {
      "property": "Large Temperature Variations",
      "overview": "Wadi Rum experiences hot summers and cold winters, with significant temperature changes between seasons and day and night. Its desert environment produces strong thermal variations",
      "comparison": "• Similarities: Both experience significant temperature variations and cold conditions.\n• Differences: Mars has much more extreme temperature conditions because of its thin atmosphere, while Earth's atmosphere moderates temperatures in Wadi Rum.",
      "rating": "Acceptable"
    },
    {
      "property": "Extreme Dryness and Water Scarcity",
      "overview": "Wadi Rum has an extremely dry desert climate with very low annual rainfall. Its vegetation is sparse, and water resources are limited",
      "comparison": "• Similarities: Both experience extremely dry conditions and limited surface liquid water.\n• Differences: Wadi Rum still has groundwater, occasional rainfall, and living ecosystems, while Mars has an extremely thin atmosphere and mostly subsurface or frozen water.",
      "rating": "Very Good"
    },
    {
      "property": "Craters and Crater-like Features",
      "overview": "Wadi Rum contains natural valleys, narrow gorges, and irregular depressions formed mainly by tectonic activity, weathering, and erosion. These features create a rugged landscape with varied rock formations, but they are not documented as impact craters",
      "comparison": "Similarities:\n• Both have irregular surface features, including depressions and valleys.\n• Both contain exposed rocky formations and rugged terrain.\n• Geological processes have contributed to shaping the surface in both locations.\nDifferences:\n• Wadi Rum's documented depressions and valleys are mainly associated with erosion, weathering, and tectonic activity.\n• Many Martian craters were formed by impacts from asteroids and comets.\n• Therefore, the similarity is in surface shape and terrain features, not in the geological origin of impact craters.",
      "rating": "Acceptable"
    },
    {
      "property": "Loose Sand and Soil",
      "overview": "Wadi Rum contains extensive sandy valleys, loose sand deposits, and wind-shaped dunes. These materials cover large parts of its desert landscape",
      "comparison": "• Similarities: Both contain loose sand, fine particles, dunes, and wind-shaped sediment deposits.\n• Differences: Martian soil contains iron-rich materials and is exposed to a much thinner atmosphere, while Wadi Rum's sand is influenced by Earth's atmosphere and weather.",
      "rating": "Very Good"
    },
    {
      "property": "Steep Slopes and Sharp Terrain",
      "overview": "Wadi Rum features steep sandstone cliffs, narrow canyons, and dramatic elevation changes. These formations result from long-term geological erosion and weathering",
      "comparison": "• Similarities: Both have steep slopes, rocky cliffs, deep valleys, and irregular terrain.\n• Differences: Wadi Rum's slopes are mainly shaped by water and wind erosion, while Martian terrain also includes large impact-related and volcanic landforms",
      "rating": "Very Good"
    },
    {
      "property": "Diverse Rocks and Rugged Terrain",
      "overview": "Wadi Rum contains ancient granite and sandstone formations. Its landscape includes rugged mountains, rocky surfaces, and exposed geological layers shaped by erosion",
      "comparison": "• Similarities: Both have exposed rocks, varied geological formations, and rugged surfaces.\n• Differences: Wadi Rum mainly contains sandstone and granite, while Mars has a wider range of volcanic and sedimentary rocks.",
      "rating": "Good"
    },
    {
      "property": "Isolation from Populated Areas",
      "overview": "Wadi Rum is a remote desert region in southern Jordan, characterized by vast open landscapes and relatively isolated mountainous areas. However, it has human settlements and tourism activities",
      "comparison": "• Similarities: Both present challenges related to remote exploration and access to resources.\n• Differences: Wadi Rum remains accessible to humans and connected to nearby communities, while Mars is completely inaccessible without spacecraft and specialized technology",
      "rating": "Acceptable"
    },
    {
      "property": "Low Illumination and Long Shadows",
      "overview": "Wadi Rum's towering mountains and narrow valleys create natural shadows depending on the Sun's position. These shadows are temporary and change throughout the day",
      "comparison": "Similarities:\n• Both have rocky terrain and elevated formations that create shadows.\n• Low-angle sunlight on Mars produces long shadows that reveal surface features, similar to the shadows created by Wadi Rum's mountains.\nDifferences:\n• Wadi Rum experiences normal Earth daylight, while Mars receives less sunlight because of its greater distance from the Sun.\n• Shadow lengths and patterns on Mars vary with the planet's seasons and the Sun's position.",
      "rating": "Good"
    },
    {
      "property": "Spectrometers, microscopy, sample collection tools",
      "overview": "Scientific field instruments are used to examine rocks, minerals, and soil samples. These tools help researchers understand geological composition and environmental conditions",
      "comparison": "• Similarities: Both support geological investigations using spectroscopy, microscopy, and sample collection techniques.\n• Differences: Mars exploration relies on robotic instruments and remote analysis, while Wadi Rum allows researchers to operate instruments directly and collect samples in the field",
      "rating": "Very Good"
    }
  ],
  "mcmurdo": [
    {
      "property": "Diverse Rocks and Rugged Terrain",
      "overview": "The McMurdo Dry Valleys are characterized by diverse rocks and rugged landscapes, including mountains, valleys, and rocky slopes.",
      "comparison": "Similarities with Mars:\n• Both have rocky and rugged terrain.\n• Rocks in both locations have been affected by weathering and erosion processes.\n• Studying their rocks and landforms helps scientists understand the geological history of their surfaces.\nDifferences from Mars:\n• Rocks in McMurdo have been affected by Earth-based processes such as freezing, thawing, and erosion, while Martian rocks have been affected by different geological and climatic conditions.\n• Mars contains widespread evidence of volcanic activity and meteorite impacts, which are not as common in McMurdo.\n• The mineral composition of rocks differs between the two locations because of their different formation histories and geological processes.\nSource:",
      "rating": "Very Good"
    },
    {
      "property": "Steep Slopes and Sharp Terrain",
      "overview": "The McMurdo Dry Valleys contain steep slopes, mountains, and valleys with difficult and uneven terrain.",
      "comparison": "Similarities with Mars:\n• Both contain steep slopes and sharp rocky terrain.\n• Both have rocky edges and deep valleys.\n• Studying these landforms helps scientists understand how planetary surfaces change over time.\nDifferences from Mars:\n• Slopes in McMurdo have been strongly affected by ice and terrestrial erosion, while Martian slopes have been shaped by different processes, including sediment movement and landslides.\n• Gravity on Mars is weaker than Earth's gravity, which affects how rocks and soil move along slopes.\n• The rate and processes of slope erosion differ because of the different environmental and atmospheric conditions on both locations.",
      "rating": "Very Good"
    },
    {
      "property": "Loose Sand and Soil",
      "overview": "The region contains loose surface soil, rocky materials, and sand produced by the breakdown of rocks through natural processes.",
      "comparison": "Similarities with Mars:\n• Both contain loose soil and rocky materials on their surfaces.\n• Wind can transport sand and small particles in both locations.\n• Soil in both environments can be studied to understand planetary surface characteristics.\nDifferences from Mars:\n• McMurdo soil comes from local rocks and terrestrial geological processes, while Martian soil contains materials formed under Mars-specific environmental conditions.\n• The mineral and chemical compositions of the soil differ between the two locations.\n• McMurdo soil can be affected by moisture and seasonal ice melting, while the current Martian surface is much drier and does not experience the same melting conditions.",
      "rating": "Very Good"
    },
    {
      "property": "Craters and Crater-like Features",
      "overview": "The McMurdo Dry Valleys contain different surface depressions and landforms, but they are not as rich in meteorite impact craters as Mars",
      "comparison": "Similarities with Mars:\n• Both locations contain depressions and surface features formed by geological processes.\n• Some glaciers in McMurdo contain surface pits and depressions that can be studied and compared with certain Martian surface features.\n• Studying these features helps scientists understand how planetary surfaces form and change.\nDifferences from Mars:\n• Mars contains a large number of impact craters formed by meteorite collisions with its surface.\n• McMurdo does not have the same density or distribution of impact craters found on Mars.\n• Pits found on some McMurdo glaciers are formed by ice-related processes and sublimation, rather than necessarily being caused by meteorite impacts.",
      "rating": "Acceptable"
    },
    {
      "property": "Extreme Dryness and Water Scarcity",
      "overview": "The McMurdo Dry Valleys are considered one of the driest and coldest regions on Earth, receiving very little precipitation.",
      "comparison": "Similarities with Mars:\n• Both have extremely dry conditions and very limited liquid water.\n• Water in both locations is largely associated with ice and frozen moisture.\n• Studying this environment helps scientists understand the effects of extreme dryness on planetary surfaces.\nDifferences from Mars:\n• McMurdo receives small amounts of snowfall, while Mars has a different and much more limited water cycle under its current conditions.\n• Liquid water can form in McMurdo during summer due to ice melting, creating seasonal streams.\n• The current Martian surface does not have seasonal liquid-water streams similar to those found in McMurdo.",
      "rating": "Excellent"
    },
    {
      "property": "Large Temperature Variations",
      "overview": "The McMurdo Dry Valleys experience significant temperature changes between seasons, with extremely cold winters and short, relatively warmer summers.",
      "comparison": "Similarities with Mars:\n• Both experience extremely low temperatures.\n• Temperature changes occur between day and night and across different seasons.\n• Temperature affects ice, soil, and rocks in both locations.\nDifferences from Mars:\n• Temperatures in some parts of McMurdo can rise above freezing during summer, while Mars is generally colder.\n• The Martian atmosphere is extremely thin, so it retains heat differently from Earth's atmosphere.\n• The intensity of temperature changes differs because of the different atmospheric and climatic conditions.",
      "rating": "Good"
    },
    {
      "property": "Fine Dust and Soil",
      "overview": "McMurdo contains fine soil particles and dust produced by rock breakdown, which can be transported from one place to another by wind.",
      "comparison": "Similarities with Mars:\n• Both contain dust and fine soil particles.\n• Wind can transport dust and modify the surface in both locations.\n• Dust can accumulate on rocks and landforms in both environments.\nDifferences from Mars:\n• McMurdo dust comes from local rocks and terrestrial weathering processes, while Martian dust consists of surface materials with a different mineral composition.\n• Mars experiences dust storms that can spread across large areas of the planet, while McMurdo does not experience dust storms of the same scale and extent.\n• Dust movement and distribution differ because of differences in atmospheric density and weather conditions.",
      "rating": "Good"
    },
    {
      "property": "Ice or Frozen Soil",
      "overview": "The McMurdo Dry Valleys contain permanently frozen soil in many areas, as well as ice beneath the surface and within glaciers.",
      "comparison": "• Both contain ice and frozen ground.\n• Ice can exist beneath the surface instead of being directly visible.\n• Sublimation processes occur in both locations, where ice changes directly from a solid into a gas.\nDifferences from Mars:\n• Ice in McMurdo exists within Earth's environment, which has much higher atmospheric pressure than Mars.\n• Some ice in McMurdo can melt during summer, while the pressure and temperature conditions on Mars make liquid water on its surface much more difficult to maintain.\n• The depth, distribution, and properties of ice differ between the two locations.",
      "rating": "Excellent"
    },
    {
      "property": "Isolation from Populated Areas",
      "overview": "The McMurdo Dry Valleys are located in a remote region of Antarctica, far from cities and populated areas.",
      "comparison": "Similarities with Mars:\n• Both are characterized by isolation and difficult access.\n• Fieldwork in McMurdo requires special planning and equipment, similar to missions to Mars.\n• Researchers need to prepare and provide supplies and equipment in advance.\nDifferences from Mars:\n• Despite its remoteness, McMurdo has research stations and scientific field camps in Antarctica.\n• Researchers can reach McMurdo using air, sea, and land transportation.\n• Mars is much farther away and has no permanent human support stations, making the delivery of supplies and rescue operations far more difficult.",
      "rating": "Very Good"
    },
    {
      "property": "Low Illumination and Long Shadows",
      "overview": "Because of its location near the South Pole, McMurdo experiences long periods of darkness during winter. Long shadows also appear when the Sun is low in the sky.",
      "comparison": "Similarities with Mars:\n• Both experience seasonal changes in daylight and darkness.\n• Long shadows can appear when the Sun is close to the horizon.\n• The angle of sunlight affects surface illumination and temperature in both locations.\nDifferences from Mars:\n• Long periods of darkness in McMurdo are related to its location near Earth's South Pole, while the duration of darkness on Mars varies according to latitude and season.\n• A Martian day is slightly longer than an Earth day.\n• Mars is farther from the Sun, so the amount of sunlight reaching its surface is different from the amount reaching McMurdo.",
      "rating": "Good"
    },
    {
      "property": "Spectrometers, microscopy, sample collection tools",
      "overview": "Scientific research in McMurdo uses tools to collect soil and rock samples and examine them, including microscopes and instruments for analyzing chemical and mineral properties.",
      "comparison": "Similarities with Mars:\n• Scientific instruments are used in both locations to analyze soil and rocks.\n• Microscopes help examine the size and shape of soil particles.\n• Spectrometers help identify the chemical and mineral composition of samples.\n• Sample collection tools are used to study materials found on and beneath the surface.\nDifferences from Mars:\n• In McMurdo, researchers can collect samples and examine them using laboratories and equipment available on Earth.\n• On Mars, instruments must operate independently without scientists physically present.\n• Instruments sent to Mars must withstand extreme temperatures, dust, and harsh environmental conditions, while also being difficult to repair or replace.\n• McMurdo samples can be transported to specialized laboratories on Earth, while Martian samples are generally studied using instruments on rovers and spacecraft.",
      "rating": "Very Good"
    }
  ]
};
