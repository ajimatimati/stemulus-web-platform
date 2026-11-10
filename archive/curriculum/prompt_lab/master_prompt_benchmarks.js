// STEMulus Kids Tech Master Prompt Benchmarks (Standalone CORS-Free Bundle)
window.MASTER_PROMPT_BENCHMARKS = {
  "version": "2.0.0",
  "system": "STEMulus Kids Tech - Master Prompt Engineering Laboratory",
  "tested_models": [
    "Gemini 2.0 Pro",
    "Gemini 1.5 Flash",
    "ChatGPT-4o",
    "Claude 3.5 Sonnet"
  ],
  "benchmarks": [
    {
      "id": "PROMPT-AI-01",
      "track": "Generative AI & Machine Cognition",
      "title": "Autonomous Multi-Trait Character Architect",
      "pedagogical_objective": "Teach children how to define structured character personas with emotional arcs, strengths, and flaws instead of flat generic descriptions.",
      "technique": "Role Conditioning + JSON Schema Constraints + Anti-Stereotype Prompting",
      "system_prompt": "You are a senior lead character designer and narrative psychologist at a world-class animation studio. Your task is to design relatable, multi-dimensional, vibrant characters for children aged 7-12.",
      "user_input_prompt": "Create an original STEM character profile for an 11-year-old eco-inventor from Lagos who builds underwater drones out of recycled electronics. Structure the response strictly in JSON format with fields: name, moniker, age, background, primary_invention, character_flaw, secret_talent, catchphrase, and visual_prompt_descriptor.",
      "expected_verified_output": {
        "name": "Toluwanimi 'Tolu' Adeyemi",
        "moniker": "The Lagoon Hacker",
        "age": 11,
        "background": "Spends Saturdays along the Lagos shoreline collecting discarded smartphone batteries, solar lamp panels, and bamboo floats to clean plastic runoff.",
        "primary_invention": "Aquadrone-7 (nicknamed 'Omi-Bot'): A solar-powered, dual-thruster submersible made of salvaged PVC pipes with computer vision to tag microplastic clusters.",
        "character_flaw": "Impatient perfectionist who rushes launches before double-checking waterproof silicone seals, causing frequent splash emergencies.",
        "secret_talent": "Can identify the exact voltage and health of any lithium-ion battery just by testing its multimeter resistance with her eyes closed.",
        "catchphrase": "One city's trash is another kid's submarine!",
        "visual_prompt_descriptor": "Tactile 3D render of an energetic 11-year-old Nigerian girl with braided hair and yellow safety goggles on her forehead, holding a miniature cyan underwater drone with glowing LED eyes, bright morning sunlight over Lagos lagoon, Pixar animation style, warm studio lighting, 8k resolution."
      },
      "failure_modes_and_remediation": {
        "failure_mode": "Model outputs markdown explanation before the JSON or omits the flaw field.",
        "remediation_instruction": "Add: 'Respond with PURE raw JSON only. Do not enclose in backticks or markdown preamble. Ensure all 9 required keys exist.'"
      }
    },
    {
      "id": "PROMPT-AI-02",
      "track": "Generative AI & Storytelling",
      "title": "4-Panel Visual Comic Strip Director",
      "pedagogical_objective": "Demonstrate visual storytelling decomposition: breaking an idea into camera shots, action beats, speech bubbles, and sound effects.",
      "technique": "Sequential Shot Decomposition + Camera Framing Control",
      "system_prompt": "You are an award-winning graphic novel director. You break story scenes into cinematic, dynamic comic panels with clear camera directions, character poses, and speech bubbles.",
      "user_input_prompt": "Topic: A young coder runs their first Python game, encounters an infinite loop bug that fills the screen with dancing digital squirrels, and solves it by adding a break condition.\nOutput a 4-panel comic strip script. For each panel provide: Panel Number, Camera Framing (Close-up, Wide, Over-the-shoulder), Visual Action, Sound Effect (SFX in caps), and Dialogue.",
      "expected_verified_output": {
        "comic_title": "The Infinite Squirrel Stampede",
        "panels": [
          {
            "panel": 1,
            "framing": "Over-the-shoulder shot looking down at a glowing laptop screen",
            "visual_action": "The coder smiles with fingers hovering dramatically over the Enter key. On screen, a single pixel-art squirrel stands at the center of the terminal.",
            "sfx": "CLACK!",
            "dialogue": "Coder: 'One tiny loop... and my high-score game goes live!'"
          },
          {
            "panel": 2,
            "framing": "Extreme close-up of the laptop monitor reflecting in wide eyes",
            "visual_action": "The terminal explodes with hundreds of multiplying neon squirrels doing backflips and wearing top hats. Numbers scroll at light speed.",
            "sfx": "BZZZZZT! POP! POP!",
            "dialogue": "Coder: 'Wait... why aren't they stopping?! Why are there four thousand squirrels?!'"
          },
          {
            "panel": 3,
            "framing": "Wide dramatic side-profile shot of the desk",
            "visual_action": "The coder frantically grabs the computer keyboard while a thought bubble appears overhead showing a `while True:` loop running without an exit door.",
            "sfx": "GASP!",
            "dialogue": "Coder: 'Aha! I forgot the break statement! The loop has no condition to ever exit!'"
          },
          {
            "panel": 4,
            "framing": "Medium warm heroic shot with glowing monitor glow",
            "visual_action": "The coder hits Ctrl+C, types `if score == 10: break`, and presses Run. The terminal calmly displays: 'Stage 1 Complete: 10 Squirrels Collected! Victory!'",
            "sfx": "DING-DONG!",
            "dialogue": "Coder: 'Code tamed. Squirrels counted. Game on!'"
          }
        ]
      },
      "failure_modes_and_remediation": {
        "failure_mode": "Panels lack camera framing or have excessive wall-of-text dialogue.",
        "remediation_instruction": "Specify strict format constraints: 'Limit dialogue to under 15 words per bubble. Every panel must have an explicit camera angle from: Wide, Medium, Close-up, or POV.'"
      }
    },
    {
      "id": "PROMPT-AI-03",
      "track": "Generative AI & Computational Logic",
      "title": "Socratic Code Debugging Copilot",
      "pedagogical_objective": "Train students to use AI as a Socratic thought partner rather than an answer cheat-sheet, promoting cognitive retention.",
      "technique": "Socratic Scaffolding + Anti-Leak Directives",
      "system_prompt": "You are 'Byte', a friendly Socratic coding tutor for kids. NEVER give the direct answer or write the corrected code immediately. Instead, spot the underlying conceptual misunderstanding, ask ONE guiding question that directs the student's eyes to the exact bug, and celebrate their effort.",
      "user_input_prompt": "Student asks: 'Byte, my Scratch game keeps saying Game Over right when I press the green flag! Here is my script: When Green Flag Clicked -> Set Lives to 3 -> If Lives = 0 Then Broadcast Game Over. What is wrong?'",
      "expected_verified_output": {
        "tutor_greeting": "Great observation, coder! You have all the right puzzle pieces, but let us look at how the computer reads them in time.",
        "socratic_clue": "Imagine you are the computer reading that script top to bottom. You set Lives to 3. Then, within less than one millisecond, you check: 'Are Lives equal to 0?'",
        "guiding_question": "Does that check happen just once in the very first blink of an eye, or does the computer keep watching Lives throughout the entire game? What block can we wrap around our check so it never stops watching?",
        "hint_pill": "Think about the difference between a one-time check and a loop that runs 'Forever'!"
      },
      "failure_modes_and_remediation": {
        "failure_mode": "Model provides the fixed code block immediately.",
        "remediation_instruction": "Add negative constraint: 'CRITICAL RULE: Do NOT show the solution code. If you output fixed code, you fail the pedagogical mission. Only provide the question.'"
      }
    },
    {
      "id": "PROMPT-AI-04",
      "track": "Generative AI & Structured Engineering",
      "title": "Zero-Hallucination Flashcard Data Generator",
      "pedagogical_objective": "Teach deterministic structured prompting where output schemas match exact database models for app integration.",
      "technique": "Strict Typed Schema Enforcement + Few-Shot Exemplars",
      "system_prompt": "You are a deterministic data transformation compiler. You output strictly conforming JSON data according to the provided schema with 100% adherence and zero explanatory prose.",
      "user_input_prompt": "Generate 3 interactive learning flashcards for 10-year-olds on 'Computer Memory: RAM vs SSD vs CPU Cache'. Schema: Array of objects with keys: 'card_id' (string), 'concept_name' (string), 'real_world_analogy' (string), 'speed_level' (integer 1-10), 'volatile' (boolean), 'takeaway_tip' (string).",
      "expected_verified_output": [
        {
          "card_id": "MEM-01",
          "concept_name": "CPU Cache",
          "real_world_analogy": "The desk organizer right in front of your hands where you keep the pen and ruler you use every 5 seconds.",
          "speed_level": 10,
          "volatile": true,
          "takeaway_tip": "Super tiny in size (a few megabytes) but operates at the literal speed of the computer processor."
        },
        {
          "card_id": "MEM-02",
          "concept_name": "RAM (Random Access Memory)",
          "real_world_analogy": "The tabletop workspace where you spread out your open school notebooks while doing today's homework.",
          "speed_level": 8,
          "volatile": true,
          "takeaway_tip": "When you turn off the power switch, everything on the tabletop is completely cleared away!"
        },
        {
          "card_id": "MEM-03",
          "concept_name": "SSD (Solid State Storage)",
          "real_world_analogy": "The heavy bookshelf in your room where your textbooks stay safe even when you leave for summer vacation.",
          "speed_level": 5,
          "volatile": false,
          "takeaway_tip": "Permanent storage that remembers your photos, games, and code even when completely powered off."
        }
      ],
      "failure_modes_and_remediation": {
        "failure_mode": "Outputs speed as text ('Fast') instead of integer, or volatile as string ('Yes').",
        "remediation_instruction": "Specify: 'Values for speed_level MUST be integers between 1 and 10. Values for volatile MUST be boolean true/false (not strings).'"
      }
    },
    {
      "id": "PROMPT-AI-05",
      "track": "Multimodal Generative AI (Visual)",
      "title": "Diffusion Prompt Synthesis Engine",
      "pedagogical_objective": "Transform flat, naive student descriptions into rich, professional visual prompts with lighting, materials, framing, and artistic styling.",
      "technique": "Prompt Expansion Architecture (Subject + Medium + Environment + Lighting + Aesthetic Token)",
      "system_prompt": "You are a prompt engineer for modern diffusion models (ImageFX, Midjourney, DALL-E 3). You expand short kid concepts into rich, tactile, artistic visual prompts while keeping the content inspiring and child-safe.",
      "user_input_prompt": "Raw concept from student: 'A flying school bus in the clouds.'\nTransform this into: 1. Cartoon Animation Style, 2. Modern 3D Tactile Clay Style, and 3. Cyberpunk Sci-Fi Style. Provide exact negative prompt recommendations for each.",
      "expected_verified_output": {
        "raw_concept": "A flying school bus in the clouds",
        "styles": [
          {
            "style_name": "Modern 3D Tactile Clay (Apple/Pixar)",
            "expanded_prompt": "Macro isometric tactile 3D rendering of a cheerful retro yellow school bus equipped with miniature glowing sky-blue jet thrusters and foldable airplane wings, soaring through fluffy soft cotton-candy marshmallow clouds, radiant morning golden hour sunlight, soft rim highlights, smooth matte porcelain and clay textures, subtle diffuse shadow, 8k render, hyper-clean pastel light background.",
            "negative_prompt": "grungy, dark, realistic humans, rust, text, logos, blurry, low resolution, noisy, artifact"
          },
          {
            "style_name": "Hand-Drawn Vibrant 2D Anime (Studio Ghibli)",
            "expanded_prompt": "Vibrant hand-painted watercolor and gouache illustration of an antique yellow school bus gliding gently among towering Cumulus clouds with wind propellers spinning on its roof, flock of mechanical origami birds flying alongside, warm nostalgic summer afternoon sky, lush painted textures, Hayao Miyazaki aesthetic, intricate storybook composition.",
            "negative_prompt": "3D render, CGI, glossy, photorealistic, dark, ominous, distortion, watermark"
          },
          {
            "style_name": "Solar-Punk Sci-Fi Wonder",
            "expanded_prompt": "Futuristic solar-electric school cruiser with brass detailing and translucent solar-glass solar sails, hovering over high-altitude floating botanical gardens and clean cloud towers, clean bright aerodynamic design, azure blue skies, lens flare, utopian hopeful atmosphere, high architectural detail.",
            "negative_prompt": "dystopian, smog, smoke, dark, neon glitch, horror, weapons, apocalyptic"
          }
        ]
      },
      "failure_modes_and_remediation": {
        "failure_mode": "Model inserts generic buzzwords like 'hyperrealistic, 4k' without material or lighting specifics.",
        "remediation_instruction": "Instruct: 'Focus on material properties (matte, ceramic, brass, glass) and specific lighting direction (rim light, morning sun, volumetric glow) instead of generic buzzwords.'"
      }
    }
  ]
};
