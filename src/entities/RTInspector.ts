import { Blit } from '../heck/components/Blit';
import { BufferRenderTarget } from '../heck/BufferRenderTarget';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Quad } from '../heck/components/Quad';
import { RenderTarget } from '../heck/RenderTarget';
import { SceneNode } from '../heck/components/SceneNode';
import { canvas, gl, glCat } from '../globals/canvas';
import { dryFrag } from '../shaders/dryFrag';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gui } from '../globals/gui';
import { quadGeometry } from '../globals/quadGeometry';
import { quadVert } from '../shaders/quadVert';
import inspectorFrag from '../shaders/inspector.frag';

export interface RTInspectorOptions {
  target: RenderTarget;
}

export class RTInspector extends SceneNode {
  public nodeSingle: SceneNode;
  public nodeMultiple: SceneNode;
  public materialSingle: Material;
  public quadSingle: Quad;
  public blitsMultiple: Blit[];

  public constructor( { target }: RTInspectorOptions ) {
    super();

    this.visible = false;

    // -- single -----------------------------------------------------------------------------------
    this.nodeSingle = new SceneNode( {
      name: 'nodeSingle',
    } );
    this.children.push( this.nodeSingle );

    this.materialSingle = new Material(
      quadVert,
      inspectorFrag,
      { initOptions: { target: dummyRenderTarget, geometry: quadGeometry } },
    );

    this.quadSingle = new Quad( {
      target: target,
      material: this.materialSingle,
      name: 'quadSingle',
      ignoreBreakpoints: true,
    } );
    this.nodeSingle.children.push( this.quadSingle );

    // -- mouse listener ---------------------------------------------------------------------------
    canvas.addEventListener( 'mousemove', ( { offsetX, offsetY } ) => {
      const rect = canvas.getBoundingClientRect();
      const x = offsetX / rect.width;
      const y = 1.0 - offsetY / rect.height;

      this.materialSingle.addUniform( 'mouse', '2f', x, y );
    } );

    // -- multiple ---------------------------------------------------------------------------------
    this.nodeMultiple = new SceneNode( {
      name: 'nodeMultiple',
    } );
    this.children.push( this.nodeMultiple );

    // count first?
    let count = 0;
    for ( const src of BufferRenderTarget.nameMap.values() ) {
      count += src.numBuffers;
    }

    // grid
    const grid = Math.ceil( Math.sqrt( count ) );
    const width = Math.floor( target.width / grid );
    const height = Math.floor( target.height / grid );

    // determine grid positions
    const entries: {
      src: BufferRenderTarget;
      attachment: GLenum;
      dstRect: [ number, number, number, number ];
      name: string;
    }[] = [];

    let iBlit = 0;
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

        let name = `${ src.name }`;
        if ( src.numBuffers > 1 ) {
          name += `[${ iAttachment }]`;
        }

        entries.push( {
          src,
          attachment: gl.COLOR_ATTACHMENT0 + iAttachment,
          dstRect,
          name,
        } );

        iBlit ++;
      }
    }

    // then add blits + render names to canvas
    this.blitsMultiple = [];
    for ( const { src, attachment, dstRect, name } of entries ) {
      const blit = new Blit( {
        src,
        dst: target,
        attachment,
        dstRect,
        name,
        ignoreBreakpoints: true,
      } );

      this.blitsMultiple.push( blit );
      this.nodeMultiple.children.push( blit );
    }

    // text canvas
    const textureText = glCat.createTexture();

    const textCanvas = document.createElement( 'canvas' );
    textCanvas.width = target.width;
    textCanvas.height = target.height;

    const textContext = textCanvas.getContext( '2d' )!;

    this.nodeMultiple.children.push( new Lambda( {
      onUpdate: () => {
        textContext.clearRect( 0, 0, width, height );

        textContext.font = '500 10px Wt-Position';
        textContext.fillStyle = '#fff';
        textContext.strokeStyle = '#000';

        for ( const { dstRect, name } of entries ) {
          textContext.strokeText( name, dstRect[ 0 ], target.height - dstRect[ 1 ] );
          textContext.fillText( name, dstRect[ 0 ], target.height - dstRect[ 1 ] );
        }

        textureText.setTexture( textCanvas );
      },
      name: 'lambdaUpdateTextCanvas',
      ignoreBreakpoints: true,
    } ) );

    const materialMultipleText = new Material(
      quadVert,
      dryFrag,
      {
        initOptions: { target: dummyRenderTarget, geometry: quadGeometry },
        blend: [ gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA ],
      },
    );
    materialMultipleText.addUniformTextures( 'sampler0', textureText );

    const quadMultipleText = new Quad( {
      target: target,
      material: materialMultipleText,
      name: 'quadMultipleText',
      ignoreBreakpoints: true,
      range: [ -1.0, 1.0, 1.0, -1.0 ],
    } );
    this.nodeMultiple.children.push( quadMultipleText );

    // -- see the config ---------------------------------------------------------------------------
    this.children.push( new Lambda( {
      onUpdate: () => {
        this.__updateTarget();
      },
      name: 'lambdaUpdateTarget',
      ignoreBreakpoints: true,
    } ) );
  }

  private __updateTarget(): void {
    const ha = gui; // FIXME: weird error that prevents me using optional chaining...

    const single: string = ha?.value( 'RTInspector/single', '' ) ?? '';
    const singleIndex: number = ha?.value( 'RTInspector/index', 0, { step: 1 } ) ?? 0;

    this.materialSingle.addUniform(
      'lod',
      '1f',
      ha?.value( 'RTInspector/lod', 0, { step: 1 } ) ?? 0.0,
    );

    if ( ha?.value( 'RTInspector/multiple', false ) ) {
      this.nodeMultiple.active = true;
      this.nodeSingle.active = false;
    } else if ( single !== '' ) {
      this.nodeMultiple.active = false;

      for ( const [ name, target ] of BufferRenderTarget.nameMap ) {
        if ( !( new RegExp( single ).test( name ) ) ) { continue; }

        const attachment = gl.COLOR_ATTACHMENT0 + singleIndex;
        const texture = target?.getTexture( attachment );

        if ( !texture ) {
          this.nodeSingle.active = false;
          return;
        }

        this.materialSingle.addUniformTextures( 'sampler0', texture );

        this.nodeSingle.active = true;
      }
    } else {
      // fallback to not render it
      this.nodeMultiple.active = false;
      this.nodeSingle.active = false;
    }
  }
}
