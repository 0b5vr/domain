import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Entity } from '../heck/Entity';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { canvas, gl } from '../globals/canvas';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gui } from '../globals/gui';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import inspectorFrag from '../shaders/inspector.frag';

export interface RTInspectorOptions {
  target: RenderTarget;
}

export class RTInspector extends Entity {
  public entitySingle: Entity;
  public entityMultiple: Entity;
  public materialSingle: Material;
  public quadSingle: Quad;
  public blitsMultiple: Blit[];

  public constructor( options: RTInspectorOptions ) {
    super();

    // -- single -----------------------------------------------------------------------------------
    this.entitySingle = new Entity( {
      name: 'entitySingle',
    } );
    this.children.push( this.entitySingle );

    this.materialSingle = new Material(
      quadVert,
      inspectorFrag,
      { initOptions: { target: dummyRenderTarget, geometry: quadGeometry } },
    );

    this.quadSingle = new Quad( {
      target: options.target,
      material: this.materialSingle,
      name: 'quadSingle',
      ignoreBreakpoints: true,
    } );
    this.entitySingle.components.push( this.quadSingle );

    // -- mouse listener ---------------------------------------------------------------------------
    canvas.addEventListener( 'mousemove', ( { offsetX, offsetY } ) => {
      const rect = canvas.getBoundingClientRect();
      const x = offsetX / rect.width;
      const y = 1.0 - offsetY / rect.height;

      this.materialSingle.addUniform( 'mouse', '2f', x, y );
    } );

    // -- multiple ---------------------------------------------------------------------------------
    this.entityMultiple = new Entity( {
      name: 'entityMultiple',
    } );
    this.children.push( this.entityMultiple );

    // count first?
    let count = 0;
    for ( const src of BufferRenderTarget.nameMap.values() ) {
      count += src.numBuffers;
    }

    // grid
    const grid = Math.ceil( Math.sqrt( count ) );
    const width = Math.floor( options.target.width / grid );
    const height = Math.floor( options.target.height / grid );

    // then add blits
    let iBlit = 0;
    this.blitsMultiple = [];
    for ( const src of BufferRenderTarget.nameMap.values() ) {
      for ( let iAttachment = 0; iAttachment < src.numBuffers; iAttachment ++ ) {
        const x = iBlit % grid;
        const y = grid - 1 - Math.floor( iBlit / grid );
        const dstRect: [ number, number, number, number ] = [
          width * x,
          height * y,
          width * ( x + 1.0 ),
          height * ( y + 1.0 ),
        ];

        const blit = new Blit( {
          src,
          dst: options.target,
          attachment: gl.COLOR_ATTACHMENT0 + iAttachment,
          dstRect,
          name: `${ src.name }/${ iAttachment }`,
          ignoreBreakpoints: true,
        } );

        this.blitsMultiple.push( blit );
        this.entityMultiple.components.push( blit );

        iBlit ++;
      }
    }

    // -- see the config ---------------------------------------------------------------------------
    this.components.push( new Lambda( {
      onUpdate: () => {
        this.__updateTarget();
      }
    } ) );
  }

  private __updateTarget(): void {
    const ha = gui; // FIXME: weird error that prevents me using optional chaining...

    const single = ha?.value( 'RTInspector/single', '' );
    const singleIndex = ha?.value( 'RTInspector/index', 0, { step: 1 } );

    if ( ha?.value( 'RTInspector/multiple', false ) ) {
      this.entityMultiple.active = true;
      this.entitySingle.active = false;
    } else if ( single !== '' ) {
      this.entityMultiple.active = false;

      const target = BufferRenderTarget.nameMap.get( single ?? '' ) ?? null;
      const attachment = gl.COLOR_ATTACHMENT0 + ( singleIndex ?? 0 );

      if ( !target ) {
        this.entitySingle.active = false;
        return;
      }

      const texture = target.getTexture( attachment )!;
      this.materialSingle.addUniformTextures( 'sampler0', texture );

      this.entitySingle.active = true;
    } else {
      // fallback to not render it
      this.entityMultiple.active = false;
      this.entitySingle.active = false;
    }
  }
}
