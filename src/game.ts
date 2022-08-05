import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  Mesh,
  WebXRHitTest,
  MeshBuilder,
  Quaternion,
  SceneLoader,
  Space,
  DebugLayer,
  Tools,
  SphereBuilder,
  AbstractMesh,
  Observer,
  IWebXRHitResult,
  PointerInfo,
  PointerEventTypes,
  WebXRDefaultExperience,
} from '@babylonjs/core';
import * as GUI from "@babylonjs/gui";
import "@babylonjs/loaders/glTF";
import "@babylonjs/inspector";
import paul from "./assets/mesh/paul.glb";

export class Game {
  private _canvas: HTMLCanvasElement;
  private _engine: Engine;
  private _scene: Scene;
  private _camera: FreeCamera;
  private _light: HemisphericLight;
  private isDebug = false;
  private mesh: AbstractMesh;
  private reticle: AbstractMesh;
  private hitTest: WebXRHitTest; 
  private hitTestListener: Observer<IWebXRHitResult[]>;
  private XR: WebXRDefaultExperience;
  private advancedTexture: GUI.AdvancedDynamicTexture;
  private startButton: GUI.Button;
  private isVRStarted = false;

  constructor(canvasElement: string) {
    // Create canvas and engine
    this._canvas = <HTMLCanvasElement>document.getElementById(canvasElement);
    this._engine = new Engine(this._canvas, true);
    this.init();
  }

  private async init() {
    // create a basic BJS Scene object
    this._scene = new Scene(this._engine);

    if (this.isDebug) this._scene.debugLayer.show({
      embedMode: true,
    });

    // camera
    this._camera = new FreeCamera("camera", new Vector3(0, 5, -10), this._scene);
    this._camera.setTarget(Vector3.Zero());

    // light
    this._light = new HemisphericLight("light", new Vector3(0, 1, 0), this._scene);
    this._light.intensity = 0.7;

    
    await this.createMeshes();
    
    await this.createXR();
    this.createUI();
    
    this._scene.onBeforeRenderObservable.add(() => this.update());

    this._scene.onPointerObservable.add((ptInfo) => this.handleTouchInputs(ptInfo));

    this._engine.runRenderLoop(() => {
      this._scene.render();
    });

     // the canvas/window resize event handler
     window.addEventListener('resize', () => {
      this._engine.resize();
    });
  }

  private update() {
  }

  private createUI() {
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true);
    this.advancedTexture = advancedTexture;
    
    const start = GUI.Button.CreateSimpleButton('Start', 'START');

    start.hoverCursor = 'pointer';
    start.width = '250px';
    start.height = '80px';
    start.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    start.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    start.zIndex = 50;
    start.color = "white";
    start.fontSize = 46;
    start.cornerRadius = 20;
    start.background = "orange";

    this.advancedTexture.addControl(start);
    this.startButton = start;

    this.startButton.onPointerUpObservable.add(() => {
      const startVRButton = document.querySelector('.babylonVRicon') as HTMLButtonElement;

      this.isVRStarted = true;
      this.mesh.setEnabled(false);

      startVRButton.click();

      this.startButton.isVisible = false;
    });
  }

  private async createMeshes() {
    await SceneLoader.ImportMeshAsync('', '', paul, this._scene, undefined, ".glb").then((result) => {
      const paul = result.meshes[0];
      paul.rotationQuaternion = null;
      paul.rotation = Vector3.Zero();
      paul.scaling = new Vector3(-1, 1, 1);
      paul.position = new Vector3(0, 0, 3);

      this.mesh = paul;
    })

    await SceneLoader.ImportMeshAsync('', 'https://immersive-web.github.io/webxr-samples/media/gltf/reticle/', 'reticle.gltf', this._scene).then((result) => {
      const reticle = result.meshes[0];
      reticle.position = new Vector3(0, 0, 0);
      reticle.setEnabled(false);
      this.reticle = reticle;
    })
  }

  private async setMeshPos(results) {
    if (results.length) {
      this.reticle.setEnabled(true);
      results[0].transformationMatrix.decompose(this.reticle.scaling, this.reticle.rotation, this.reticle.position);
      // TODO calculate distantion to set mesh scale
    }
  }

  private async createXR() {
    this.XR = await this._scene.createDefaultXRExperienceAsync({
      // ask for an ar-session
      uiOptions: {
        sessionMode: "immersive-ar",
      },
    });
    
    const { featuresManager } = this.XR.baseExperience;

    this.hitTest = featuresManager.enableFeature(WebXRHitTest, "latest") as WebXRHitTest;

    this.hitTestListener = this.hitTest.onHitTestResultObservable.add((results) => this.setMeshPos(results));
  }

  private handleTouchInputs(ptInfo: PointerInfo) {
    switch (ptInfo.type) {
      case PointerEventTypes.POINTERDOWN:
        break;
      case PointerEventTypes.POINTERUP:
        this.handlePointerUp();
        break;
      default:
        break;
    }
  }

  private handlePointerUp() {
    if (this.isVRStarted) {
      const cameraRotY = this.XR.input.xrCamera.rotationQuaternion.y;
      const cameraRotW = this.XR.input.xrCamera.rotationQuaternion.w;

      const targetPos = this.reticle.position;

      const distance = Vector3.Distance(targetPos, this.XR.input.xrCamera.position);

      if (distance < 2) {
        this.mesh.scaling = new Vector3(-0.5, 0.5, 0.5);
      } else if (distance < 5) {
        this.mesh.scaling = new Vector3(-0.75, 0.75, 0.75);
      } else if (distance < 10) {
        this.mesh.scaling = new Vector3(-1, 1, 1);
      } else if (distance < 15) {
        this.mesh.scaling = new Vector3(-1.5, 1.5, 1.5);
      }

      this.mesh.position = new Vector3(targetPos.x, targetPos.y, targetPos.z);
      this.mesh.rotationQuaternion = new Quaternion(0, cameraRotY, 0, cameraRotW);
      this.mesh.setEnabled(true);
    }
  }
}
