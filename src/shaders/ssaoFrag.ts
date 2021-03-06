import { GLSLExpression, add, addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, div, divAssign, dot, ifThen, insert, length, lt, main, mul, normalize, sq, sub, sw, texture, unrollLoop, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { glslDefRandom } from './modules/glslDefRandom';
import { glslSaturate } from './modules/glslSaturate';
import { uniformHemisphere } from './modules/uniformHemisphere';

const AO_ITER = 16;
const AO_BIAS = 0.0;
const AO_RADIUS = 0.5;

export const ssaoFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraPV = defUniformNamed( 'mat4', 'cameraPV' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' ); // position.xyz, depth
  const sampler2 = defUniformNamed( 'sampler2D', 'sampler2' ); // normal.xyz
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init, random } = glslDefRandom();

  function ssao(
    position: GLSLExpression<'vec3'>,
    normal: GLSLExpression<'vec3'>,
  ): GLSLExpression<'float'> {
    const aspect = def( 'float', div( sw( resolution, 'x' ), sw( resolution, 'y' ) ) );

    const accum = def( 'float', 0.0 );

    unrollLoop( AO_ITER, () => {
      const pt = add(
        position,
        mul( AO_RADIUS, random(), uniformHemisphere( normal ) ),
      );

      const screenPos = def( 'vec4', mul( cameraPV, vec4( pt, 1.0 ) ) );
      divAssign( sw( screenPos, 'x' ), aspect );
      const screenUv = add( 0.5, mul( 0.5, div( sw( screenPos, 'xy' ), sw( screenPos, 'w' ) ) ) );
      const s1 = sw( texture( sampler1, screenUv ), 'xyz' );

      const dDir = def( 'vec3', sub( s1, position ) );
      ifThen( lt( length( dDir ), 1E-2 ), () => {
        addAssign( accum, 1.0 );
      }, () => {
        const dNor = dot( normalize( normal ), normalize( dDir ) );
        addAssign(
          accum,
          sub( 1.0, div( glslSaturate( sub( dNor, AO_BIAS ) ), add( length( dDir ), 1.0 ) ) )
        );
      } );
    } );

    return sq( glslSaturate( div( accum, AO_ITER ) ) );
  }

  main( () => {
    init( texture( samplerRandom, vUv ) );

    const tex1 = texture( sampler1, vUv );
    const tex2 = texture( sampler2, vUv );

    const position = def( 'vec3', sw( tex1, 'xyz' ) );
    const normal = def( 'vec3', sw( tex2, 'xyz' ) );

    const ao = ssao( position, normal );
    assign( fragColor, vec4( vec3( ao ), 1.0 ) );
  } );
} );
