import { Component, ComponentDrawEvent, ComponentOptions } from './Component';
import { Geometry } from '../Geometry';
import { MaterialMap } from '../Material';
import { glCat } from '../../globals/canvas';

export enum MeshCull {
  None,
  Front,
  Back,
  Both
}

const meshCullMap = {
  [ MeshCull.Front ]: /* GL_FRONT */ 1028,
  [ MeshCull.Back ]: /* GL_BACK */ 1029,
  [ MeshCull.Both ]: /* GL_FRONT_AND_BACK */ 1032
};

export interface MeshOptions extends ComponentOptions {
  geometry: Geometry;
  materials: MaterialMap;
}

export class Mesh extends Component {
  public geometry: Geometry;
  public materials: MaterialMap;

  public cull: MeshCull = MeshCull.Back;
  public depthWrite = true;
  public depthTest = true;

  public constructor( options: MeshOptions ) {
    super( options );

    this.active = false;

    this.geometry = options.geometry;
    this.materials = options.materials;
  }

  protected __drawImpl( event: ComponentDrawEvent ): void {
    const gl = glCat.renderingContext;

    const material = this.materials[ event.materialTag ];
    if ( material == null ) {
      return;
    }

    const program = material.program;

    glCat.useProgram( program );
    material.setBlendMode();

    if ( this.cull === MeshCull.None ) {
      gl.disable( gl.CULL_FACE );
    } else {
      gl.enable( gl.CULL_FACE );
      gl.cullFace( meshCullMap[ this.cull ] );
    }

    if ( this.depthTest ) {
      gl.enable( gl.DEPTH_TEST );
    } else {
      gl.disable( gl.DEPTH_TEST );
    }

    gl.depthMask( this.depthWrite );

    material.setUniforms();

    program.uniform( 'time', '1f', event.time );
    program.uniform( 'frameCount', '1f', event.frameCount );
    program.uniform( 'resolution', '2f', event.renderTarget.width, event.renderTarget.height );
    program.uniform( 'cameraPos', '3f', ...event.cameraTransform.position.elements );
    program.uniform( 'cameraNearFar', '2f', event.camera.near, event.camera.far );

    program.uniformMatrixVector( 'normalMatrix', 'Matrix4fv', event.globalTransform.matrix.inverse!.elements, true );
    program.uniformMatrixVector( 'modelMatrix', 'Matrix4fv', event.globalTransform.matrix.elements );
    program.uniformMatrixVector( 'viewMatrix', 'Matrix4fv', event.viewMatrix.elements );
    program.uniformMatrixVector( 'projectionMatrix', 'Matrix4fv', event.projectionMatrix.elements );

    this.geometry.draw();
  }
}
