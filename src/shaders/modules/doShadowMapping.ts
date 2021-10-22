import { GLSLExpression, abs, add, assign, cache, def, defFn, div, length, lt, mix, mul, mulAssign, retFn, smoothstep, sq, sub, subAssign, sw, tern } from '../../shader-builder/shaderBuilder';
import { glslLinearstep } from './glslLinearstep';
import { glslSaturate } from './glslSaturate';
import { maxOfVec2 } from './maxOfVec2';

const symbol = Symbol();

export function doShadowMapping(
  lenL: GLSLExpression<'float'>,
  dotNL: GLSLExpression<'float'>,
  tex: GLSLExpression<'vec4'>,
  lightP: GLSLExpression<'vec2'>,
  lightNearFar: GLSLExpression<'vec2'>,
  spotness: GLSLExpression<'float'>,
): GLSLExpression<'float'> {
  const f = cache(
    symbol,
    () => defFn(
      'float',
      [ 'float', 'float', 'vec4', 'vec2', 'vec2', 'float' ],
      ( lenL, dotNL, tex, lightP, lightNearFar, spotness ) => {
        const depth = def( 'float', glslLinearstep(
          sw( lightNearFar, 'x' ),
          sw( lightNearFar, 'y' ),
          lenL,
        ) );

        const shadow = def( 'float', mix(
          1.0,
          smoothstep( 1.0, 0.5, length( lightP ) ),
          spotness
        ) );

        const bias = mul( 0.0001, sub( 2.0, dotNL ) );
        subAssign( depth, bias );

        const variance = glslSaturate( sub( sw( tex, 'y' ), sq( sw( tex, 'x' ) ) ) );
        const md = sub( depth, sw( tex, 'x' ) );
        const p = def( 'float', div( variance, add( variance, sq( md ) ) ) );
        assign( p, glslLinearstep( 0.2, 1.0, p ) );

        mulAssign( shadow, mix(
          tern( lt( md, 0.0 ), 1.0, p ),
          1.0,
          smoothstep( 0.8, 1.0, maxOfVec2( abs( lightP ) ) ) // edgeclip
        ) );

        retFn( shadow );
      }
    )
  );

  return f( lenL, dotNL, tex, lightP, lightNearFar, spotness );
}
