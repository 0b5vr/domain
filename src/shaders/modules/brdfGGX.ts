import { GLSLExpression, GLSLFloatExpression, add, cache, def, defFn, dot, max, mix, mul, normalize, num, retFn, vec3 } from '../../shader-builder/shaderBuilder';
import { dGGX } from './dGGX';
import { fresnelSchlick } from './fresnelSchlick';
import { vGGX } from './vGGX';

const symbol = Symbol();

export function brdfGGX(
  L: GLSLExpression<'vec3'>,
  V: GLSLExpression<'vec3'>,
  N: GLSLExpression<'vec3'>,
  baseColor: GLSLExpression<'vec3'>,
  roughness: GLSLFloatExpression,
  metallic: GLSLFloatExpression,
): GLSLExpression<'vec3'> {
  const f = cache(
    symbol,
    () => defFn(
      'vec3',
      [ 'vec3', 'vec3', 'vec3', 'vec3', 'float', 'float' ],
      ( L, V, N, baseColor, roughness, metallic ) => {
        const H = def( 'vec3', normalize( add( L, V ) ) );
        const dotNL = def( 'float', max( dot( N, L ), 0.0 ) );
        const dotNV = def( 'float', max( dot( N, V ), 0.0 ) );
        const dotNH = def( 'float', max( dot( N, H ), 0.0 ) );
        const dotVH = def( 'float', max( dot( V, H ), 0.0 ) );

        const roughnessSq = mul( roughness, roughness );

        const f0 = mix( vec3( 0.04 ), baseColor, metallic );
        const f90 = vec3( 1.0 );

        const F = fresnelSchlick( dotVH, f0, f90 );
        const Vis = vGGX( dotNL, dotNV, roughnessSq );
        const D = dGGX( dotNH, roughnessSq );

        retFn( mul( F, Vis, D ) );
      }
    )
  );

  return f( L, V, N, baseColor, num( roughness ), num( metallic ) );
}
