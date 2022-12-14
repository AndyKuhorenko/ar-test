import * as BABYLON from 'babylonjs';
import * as MATERIAL from 'babylonjs-materials';
import * as GUI from 'babylonjs-gui';
import {
    Scene,
    MeshBuilder,
    Vector3,
    Quaternion,
    SceneLoader,
    AbstractMesh,
    ParticleSystem,
    Skeleton,
    Mesh
} from '@babylonjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class GameUtils {

    /**
     * Creates a basic ground
     * @param scene
     */
    public static createGround(scene: BABYLON.Scene): BABYLON.Mesh {
        // Ground
        let groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("./assets/texture/ground.jpg", scene);
        //groundMaterial.diffuseTexture.uScale = groundMaterial.diffuseTexture.vScale = 4;
        let ground = BABYLON.Mesh.CreateGround("ground", 512, 512, 32, scene, false);
        ground.position.y = -1;
        ground.material = groundMaterial;

        return ground;
    }

    /**
     * Creates a second ground and adds a watermaterial to it
     * @param scene
     */
    public static createWater(scene: BABYLON.Scene): MATERIAL.WaterMaterial {
        // Water
        let waterMesh = BABYLON.Mesh.CreateGround("waterMesh", 512, 512, 32, scene, false);
        let waterMaterial = GameUtils.createWaterMaterial("water", "./assets/texture/waterbump.png", scene);
        waterMesh.material = waterMaterial;
        waterMesh.position.y = 4;

        return waterMaterial;
    }

    /**
     * Creates a Gui Texture
     */
    public static createGUI() {
        return GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    }

    /**
     * Creates a Button that tells the Shark to swim or not
     * @param guiTexture 
     * @param btnText 
     * @param btnClicked 
     */
    public static createButtonSwim(guiTexture: GUI.AdvancedDynamicTexture, btnText: string, btnClicked: (button: GUI.Button) => void) {

        let btnTest = GUI.Button.CreateSimpleButton("but1", btnText);
        btnTest.width = "150px";
        btnTest.height = "40px";
        btnTest.color = "white";
        btnTest.background = "grey";
        btnTest.onPointerUpObservable.add(() => {
            if (btnClicked) {
                btnClicked(btnTest);
            }
        });
        btnTest.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        btnTest.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        btnTest.left = 12;
        btnTest.top = 12;

        guiTexture.addControl(btnTest);
    }

    public static createVerticalLine(scene: BABYLON.Scene, position: BABYLON.Vector2) {
        //Array of points to construct lines
        var myPoints = [
            new BABYLON.Vector3(position.x, 0, position.y),
            new BABYLON.Vector3(position.x, 100, position.y),
        ];
        //Create lines 
        var lines = BABYLON.MeshBuilder.CreateLines("lines", {points: myPoints}, scene); 
    }
 
    /**
     * 
     * @param guiTexture 
     */
    public static createCoordinatesText(guiTexture: GUI.AdvancedDynamicTexture): { txtX: GUI.TextBlock, txtY: GUI.TextBlock, txtZ: GUI.TextBlock } {
        let txtX = new GUI.TextBlock();
        txtX.height = "20px";
        txtX.width = "500px";
        txtX.fontSize = 20;
        txtX.text = "X: ";
        txtX.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        txtX.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        txtX.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        txtX.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        txtX.left = 20;
        txtX.top = 60;

        let txtY = new GUI.TextBlock();
        txtY.height = "20px";
        txtY.width = "500px";
        txtY.fontSize = 20;
        txtY.text = "Y: ";
        txtY.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        txtY.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        txtY.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        txtY.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        txtY.left = 20;
        txtY.top = 90;
        
        let txtZ = new GUI.TextBlock();
        txtZ.height = "20px";
        txtZ.width = "500px";
        txtZ.fontSize = 20;
        txtZ.text = "Z: ";
        txtZ.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        txtZ.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        txtZ.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        txtZ.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        txtZ.left = 20;
        txtZ.top = 120;
        
        guiTexture.addControl(txtX);
        guiTexture.addControl(txtY);
        guiTexture.addControl(txtZ);

        return {
            txtX: txtX,
            txtY: txtY,
            txtZ: txtZ
        }
    }

    /**
     * Returns Observable of mesh array, which are loaded from a file.
     * After mesh importing all meshes become given scaling, position and rotation.
     * @param fileName
     * @param scene
     * @param scaling
     * @param position
     * @param rotationQuaternion
     */
    public static async createMeshFromObjFile(folderName: string, fileName: string, scene: Scene,
                                        scaling?: Vector3, position?: Vector3, rotationQuaternion?: Quaternion) {

        if (!fileName) {
            return console.warn("GameUtils.createMeshFromObjFile: parameter fileName is empty");
        }
        if (!scene) {
            return console.warn("GameUtils.createMeshFromObjFile: parameter scene is empty");
        }

        if (!folderName) folderName = "";
        if (!scaling) scaling = Vector3.One();
        if (!position) position = Vector3.Zero();
        if (!rotationQuaternion) rotationQuaternion = Quaternion.RotationYawPitchRoll(0, 0, 0);

        let assetsFolder = './assets/' + folderName;

        
        await SceneLoader.ImportMeshAsync(null, assetsFolder, fileName, scene).then((result) => {
            const meshes = result.meshes;
            meshes.forEach((mesh) => {
                mesh.position = position;
                mesh.rotationQuaternion = rotationQuaternion;
                mesh.scaling = scaling;
            });
            console.log("Imported Mesh: " + fileName);
        })
    }

    /**
     * Creates a new skybox with the picttures under fileName.
     * @param name
     * @param fileName
     * @param scene
     */
    public static createSkybox(name: string, fileName: string, scene: BABYLON.Scene): BABYLON.Mesh {
        if (!name) {
            console.error("GameUtils.createSkyBox: name is not defined");
            return;
        }
        if (!fileName) {
            console.error("GameUtils.createSkyBox: fileName is not defined");
            return;
        }
        if (!scene) {
            console.error("GameUtils.createSkyBox: scene is not defined");
            return;
        }

        // Skybox
        let skybox = BABYLON.Mesh.CreateBox(name, 1000.0, scene);
        let skyboxMaterial = new BABYLON.StandardMaterial(name, scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./assets/texture/skybox/TropicalSunnyDay", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;
    }

    /**
     * Creates a new WaterMaterial Object with a given name. The noiseFile descrips the noise in the water,
     * @param name
     * @param noiseFile
     * @param scene
     */
    public static createWaterMaterial(name: string, noiseFile: string, scene: BABYLON.Scene): MATERIAL.WaterMaterial {
        if (!name) {
            console.error("GameUtils.createWaterMaterial: name is not defined");
            return;
        }
        if (!noiseFile) {
            console.error("GameUtils.createWaterMaterial: noiseFile is not defined");
            return;
        }
        if (!scene) {
            console.error("GameUtils.createWaterMaterial: scene is not defined");
            return;
        }
        // Water material
        let water = new MATERIAL.WaterMaterial(name, scene);
        water.bumpTexture = new BABYLON.Texture(noiseFile, scene);
        // Water properties
        water.windForce = -15;
        water.waveHeight = 0;
        water.windDirection = new BABYLON.Vector2(1, 1);
        water.waterColor = new BABYLON.Color3(0.25, 0.88, 0.82);
        water.colorBlendFactor = 0.3;
        water.bumpHeight = 0.1;
        water.waveLength = 0.1;

        return water
    }

    /**
     * Loads a shark model from .obj file and adds it scene.
     * @param scene
     */
    public static createShark(scene: Scene) {
        // create a mesh object with loaded from file
        let rootMesh = MeshBuilder.CreateBox("rootMesh", {size: 1}, scene);
        rootMesh.isVisible = true;
        rootMesh.position = new Vector3(0, 1, 5);
        rootMesh.rotation.y = -3 * Math.PI / 4;

        //GameUtils.createMeshFromObjFile("mesh/", "mesh.obj", scene, new Vector3(10, 10, 10));
    }

}