import { CharCanvasTexture } from './fui/CharCanvasTexture';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh, MeshCull } from '../heck/components/Mesh';
import { SceneNode, SceneNodeOptions } from '../heck/components/SceneNode';
import { TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL, TRIANGLE_STRIP_QUAD_UV } from '@0b5vr/experimental';
import { auto } from '../globals/automaton';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { fuiFrag } from '../shaders/fuiFrag';
import { getYugoppText } from '../utils/getYugoppText';
import { gl, glCat } from '../globals/canvas';
import { objectVert } from '../shaders/objectVert';
import { randomTexture } from '../globals/randomTexture';

export const charCanvasTexture = new CharCanvasTexture();

const texts = [
  [ 'cube', 'an important, single step' ],
  [ 'sss_box', 'subsurface scatter-brain' ],
  [ 'menger_sponge', 'fractal dimension = 2.7268...' ],
  [ 'asphalt', 'high-octane flavored' ],
  [ 'sp4ghet', 'angura girl with a torus-knot' ],
  [ 'fluid', 'the incomprehensible flow' ],
  [ 'xorshit', 'shut up my brain' ],
  [ 'webpack', 'still suffering in the minifier hell' ],
  [ 'infodesk', 'need some help? same' ],
  [ 'warning', 'gl_invalid_operation' ],
  [ 'parking_space', 'beware of floating cubes' ],
  [ 'octree', 'does not look like a tree at all' ],
  [ 'Pool-LAN', 'the descending bear' ],
  [ 'advantage_cube', 'press triangle to explode' ],
  [ 'crate', 'whoa' ],
  [ 'cardboard_box', 'trace 1,000,000 rays to get free global illumination' ],
  [ 'particles', '65,536 cube pickles' ],
  [ 'trails', 'send noodles' ],
  [ 'esc', 'press esc to end the experience' ],
  [ 'infinity_grid', 'the suffer never ends' ],
];

auto( 'FUI/yugopp', ( { progress } ) => {
  const stuffIndex = auto( 'stuff' );
  const t = texts[ stuffIndex ];

  if ( t != null ) {
    const indexText = ( '0' + stuffIndex ).slice( -2 );

    charCanvasTexture.clear();
    charCanvasTexture.drawChars( 24, 68, 11, getYugoppText( indexText, progress * 4.0 ) );
    charCanvasTexture.drawChars( 320, 120, 7, getYugoppText( t[ 0 ], progress * 2.0 - 0.25 ) );
    charCanvasTexture.drawChars( 316, 60, 2.5, getYugoppText( t[ 1 ], progress * 2.0 - 0.5 ) );
    charCanvasTexture.updateTexture();
  }
} );

export class FUI extends SceneNode {
  public constructor( options?: SceneNodeOptions ) {
    super( options );
    this.transform.position = [ 0.0, 3.0, 3.3 ];
    this.transform.scale = [ 3.0, 3.0, 1.0 ];

    // -- geometry ---------------------------------------------------------------------------------
    const bufferPos = glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_3D ) );

    const bufferNormal = glCat.createBuffer();
    bufferNormal.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_NORMAL ) );

    const bufferUv = glCat.createBuffer();
    bufferUv.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_UV ) );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( bufferPos, 0, 3 );
    geometry.vao.bindVertexbuffer( bufferNormal, 1, 3 );
    geometry.vao.bindVertexbuffer( bufferUv, 2, 2 );

    geometry.count = 4;
    geometry.mode = gl.TRIANGLE_STRIP;

    // -- material ---------------------------------------------------------------------------------
    const forward = new Material(
      objectVert,
      fuiFrag( 'forward' ),
      {
        initOptions: { geometry, target: dummyRenderTarget },
        blend: [ gl.ONE, gl.ONE ],
      },
    );
    forward.addUniform( 'color', '4f', 1.0, 1.0, 1.0, 1.0 );
    forward.addUniformTextures( 'samplerRandom', randomTexture.texture );
    forward.addUniformTextures( 'samplerChar', charCanvasTexture.texture );

    const depth = new Material(
      objectVert,
      fuiFrag( 'depth' ),
      {
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );
    depth.addUniform( 'color', '4f', 1.0, 1.0, 1.0, 1.0 );
    depth.addUniformTextures( 'samplerRandom', randomTexture.texture );
    depth.addUniformTextures( 'samplerChar', charCanvasTexture.texture );

    const materials = { forward, cubemap: forward, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/objectVert',
            '../shaders/fuiFrag',
          ],
          () => {
            forward.replaceShader( objectVert, fuiFrag( 'forward' ) );
            depth.replaceShader( objectVert, fuiFrag( 'depth' ) );
          },
        );
      }
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( { geometry, materials } );
    mesh.cull = MeshCull.None;

    if ( process.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      mesh,
    ];
  }
}
