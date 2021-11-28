import { GLSLExpression, abs, add, addAssign, assign, build, cos, def, defInNamed, defOut, defUniformNamed, div, dot, exp, float, forLoop, glFragCoord, insert, main, min, mix, mul, neg, normalize, refract, smoothstep, sub, sw, vec3, vec4 } from '../shader-builder/shaderBuilder';
import { MTL_UNLIT } from './deferredShadeFrag';
import { TAU } from '../utils/constants';
import { depthFrag } from './depthFrag';
import { glslSaturate } from './modules/glslSaturate';
import { isectBox } from './modules/isectBox';
import { setupRoRd } from './modules/setupRoRd';

export const gridCubeFrag = ( tag: 'deferred' | 'depth' ): string => (
  tag === 'depth' ? depthFrag : build( () => {
    insert( 'precision highp float;' );

    const vPosition = defInNamed( 'vec4', 'vPosition' );
    const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
    const vNormal = defInNamed( 'vec3', 'vNormal' );

    const fragColor = defOut( 'vec4' );
    const fragPosition = defOut( 'vec4', 1 );
    const fragNormal = defOut( 'vec4', 2 );
    const fragMisc = defOut( 'vec4', 3 );

    const resolution = defUniformNamed( 'vec2', 'resolution' );
    const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );

    main( () => {
      const p = def( 'vec2', div(
        sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
        sw( resolution, 'y' ),
      ) );

      const { ro, rd } = setupRoRd( { inversePVM, p } );

      const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

      const isectFront = isectBox( ro, rd, vec3( 0.5 ) );
      const n = def( 'vec3', sw( isectFront, 'xyz' ) );
      const rp = def( 'vec3', add( ro, mul( rd, sw( isectFront, 'w' ) ) ) );

      const col = def( 'vec3', vec3( 0.0 ) );

      forLoop( 40, ( i ) => {
        const phase = div( add( float( i ), 0.5 ), 10.0 );

        const eta = div( 1.0, mix( 1.5, 1.6, phase ) );
        const rdt = def( 'vec3', refract( rd, n, eta ) );

        const src = neg( div( rp, rdt ) );
        const dst = abs( div( add( 0.5, mul( 1E2, abs( n ) ) ), rdt ) );
        const b = def( 'vec3', add( src, dst ) );
        const bl = min( min( sw( b, 'x' ), sw( b, 'y' ) ), sw( b, 'z' ) );

        const rp2 = add( rp, mul( rdt, bl ) );
        const grid = dot(
          smoothstep(
            0.02,
            0.0,
            mul(
              exp( mul( -0.3, bl ) ),
              add( 1.0, cos( mul( TAU, 8.0, rp2 ) ) ),
            ),
          ),
          vec3( 1.0 ),
        );

        const a = mul(
          glslSaturate(
            sub( 1.0, mul( 3.0, abs( sub( div( vec3( 1.0, 3.0, 5.0 ), 6.0 ), phase ) ) ) )
          ) as GLSLExpression<'vec3'>,
          4.0 / 10.0,
          exp( mul( vec3( -0.5, -0.7, -0.3 ), bl ) ),
        );
        addAssign( col, mul( a, grid ) );
      } );

      assign( fragColor, vec4( vec3( col ), 1.0 ) );
      assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
      assign( fragNormal, vec4( normalize( vNormal ), MTL_UNLIT ) );
      assign( fragMisc, vec4( 0.0 ) );
      return;
    } );
  } )
);
