import { CameraStack } from './CameraStack';
import { ComponentOptions } from '../heck/components/Component';
import { Dog } from '../heck/Dog';
import { Floor } from './Floor';
import { GLCatTexture } from '@fms-cat/glcat-ts';
import { RawBufferRenderTarget } from '../heck/RawBufferRenderTarget';
import { SceneNode } from '../heck/components/SceneNode';
import { VRSesh } from '../globals/vr/VRSesh';
import { dog } from '../scene';

export interface VRCameraStackOptions extends ComponentOptions {
  scenes: SceneNode[];
  textureIBLLUT: GLCatTexture;
  floor: Floor;
  vrSesh: VRSesh;
  dog: Dog;
}

export class VRCameraStack extends SceneNode {
  public vrSesh: VRSesh;

  public constructor( options: VRCameraStackOptions ) {
    super();

    this.vrSesh = options.vrSesh;

    // workaround
    const width = options.vrSesh.glBaseLayer!.framebufferWidth / 2;
    const height = options.vrSesh.glBaseLayer!.framebufferHeight;

    const renderTargets = [
      new RawBufferRenderTarget( {
        framebuffer: options.vrSesh.glBaseLayer!.framebuffer,
        viewport: [ 0, 0, width, height ],
      } ),
      new RawBufferRenderTarget( {
        framebuffer: options.vrSesh.glBaseLayer!.framebuffer,
        viewport: [ width, 0, width, height ],
      } ),
    ];

    const cameraStacks = renderTargets.map( ( target ) => new CameraStack( {
      ...options,
      target,
      active: false,
    } ) );

    if ( process.env.DEV ) {
      cameraStacks[ 0 ].name = 'cameraStackL';
      cameraStacks[ 1 ].name = 'cameraStackR';
    }

    this.children = cameraStacks;

    this.vrSesh.onFrame = ( views ) => {
      views.map( ( view, i ) => {
        renderTargets[ i ].framebuffer = this.vrSesh.glBaseLayer!.framebuffer;
        renderTargets[ i ].viewport = view.viewport;
        cameraStacks[ i ].transform.position = [
          view.transform.position.x,
          view.transform.position.y,
          view.transform.position.z,
        ];
        cameraStacks[ i ].transform.rotation = [
          view.transform.orientation.x,
          view.transform.orientation.y,
          view.transform.orientation.z,
          view.transform.orientation.w,
        ];
        cameraStacks[ i ].deferredCamera.projectionMatrix = view.projectionMatrix;
        cameraStacks[ i ].forwardCamera.projectionMatrix = view.projectionMatrix;
        cameraStacks[ i ].active = true;
      } );

      dog.update();
    };
  }
}
