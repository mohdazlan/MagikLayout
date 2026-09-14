"""Run with Blender: blender --background --python scripts/export_swing_models.py.

Original low-poly Swing teaching pieces. One unit wide and high; glTF uses +Y up
and +Z front. Runtime labels stay separate so Save/Cancel and event text are live.
This creates new model files only; it does not delete any project files.
"""
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'swing-ar' / 'models'
SOURCE = ROOT / 'brand' / 'swing-ar'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)

def material(name, rgb, roughness=0.6):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return mat

def box(name, w, h, d, x=0, y=0, z=0, mat=None, bevel=0.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (w, d, h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Soft manufactured edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        normals = obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=normals.name)
    return obj

for component in ['JButton', 'JTextField', 'JPanel', 'JFrame', 'JLabel']:
    # Clear Blender's in-memory scene, never the filesystem.
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    edge = material('Neutral gray edge', (.52, .53, .56))
    white = material('Porcelain face', (.92, .93, .95))
    gray = material('Swing surface', (.76, .78, .81))
    ink = material('Window controls', (.19, .20, .22))
    if component == 'JButton':
        box('Raised button body', 1, 1, .14, mat=edge, bevel=.04)
        box('Button face', .97, .94, .035, y=-.085, mat=gray, bevel=.025)
    elif component == 'JTextField':
        box('Input border', 1, 1, .07, mat=edge)
        box('Input inset', .96, .88, .02, y=-.04, mat=white, bevel=.008)
    elif component == 'JPanel':
        box('Container bottom', 1, 1, .04, mat=white)
        for x in [-.485, .485]:
            box('Container side', .03, 1, .11, x=x, y=-.03, mat=edge, bevel=.008)
        for z in [-.485, .485]:
            box('Container edge', .96, .03, .11, z=z, y=-.03, mat=edge, bevel=.008)
    elif component == 'JFrame':
        box('Window frame', 1, 1, .09, mat=edge, bevel=.02)
        box('Content pane', .966, .86, .025, y=-.058, z=-.046, mat=white, bevel=.005)
        box('Window title bar', .966, .09, .027, y=-.06, z=.436, mat=gray, bevel=.005)
        for x in [.35, .40, .45]:
            box('Title bar control', .024, .022, .008, x=x, y=-.08, z=.436, mat=ink, bevel=.003)
    else:
        box('Label plaque', 1, 1, .025, mat=white, bevel=.015)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / f'{component}.blend'))
    bpy.ops.export_scene.gltf(filepath=str(OUT / f'{component}.glb'), export_format='GLB', export_yup=True,
                              export_animations=False, export_cameras=False, export_lights=False)
    print(f'Exported {component}.glb')
