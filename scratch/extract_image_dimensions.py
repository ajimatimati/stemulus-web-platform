import os
import json
from PIL import Image

workspace = "c:/Users/USER/OneDrive/Desktop/HTMLCSSJS GEM STEMulus"
audit_file_path = os.path.join(workspace, "scratch", "physical_images_audit.json")

if not os.path.exists(audit_file_path):
    print("Audit JSON not found!")
    exit(1)

with open(audit_file_path, "r") as f:
    images_list = json.load(f)

detailed_list = []

for img in images_list:
    img_path = os.path.join(workspace, img["path"])
    dimensions = "Unknown"
    img_format = "Unknown"
    
    if os.path.exists(img_path):
        try:
            with Image.open(img_path) as im:
                dimensions = f"{im.width}x{im.height}"
                img_format = im.format
        except Exception as e:
            dimensions = f"Error reading: {str(e)}"
    else:
        dimensions = "File missing"
        
    img["dimensions"] = dimensions
    img["format"] = img_format
    detailed_list.append(img)

output_path = os.path.join(workspace, "scratch", "detailed_images_audit.json")
with open(output_path, "w") as f:
    json.dump(detailed_list, f, indent=2)

print(f"Audited dimensions for {len(detailed_list)} images.")
