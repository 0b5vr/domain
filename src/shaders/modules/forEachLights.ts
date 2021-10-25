import { GLSLExpression, arrayIndex, forBreak, forLoop, gte, ifThen } from '../../shader-builder/shaderBuilder';

export const defForEachLights: {
  (
    lightCount: GLSLExpression<'int'>,
    arrLightPos: GLSLExpression<'vec3[]'>,
    arrLightColor: GLSLExpression<'vec3[]'>,
    arrLightNearFar: GLSLExpression<'vec2[]'>,
    arrLightParams: GLSLExpression<'vec4[]'>,
    arrLightPV: GLSLExpression<'mat4[]'>,
  ): (
    fn: ( params: {
      iLight: GLSLExpression<'int'>,
      lightPos: GLSLExpression<'vec3'>,
      lightColor: GLSLExpression<'vec3'>,
      lightNearFar: GLSLExpression<'vec2'>,
      lightParams: GLSLExpression<'vec4'>,
      lightPV: GLSLExpression<'mat4'>,
    } ) => void,
  ) => void
} = (
  lightCount,
  arrLightPos,
  arrLightColor,
  arrLightNearFar,
  arrLightParams,
  arrLightPV,
) => ( fn ) => forLoop( 8, ( iLight ) => {
  ifThen( gte( iLight, lightCount ), () => { forBreak(); } );

  fn( {
    iLight,
    lightPos: arrayIndex( arrLightPos, iLight ),
    lightColor: arrayIndex( arrLightColor, iLight ),
    lightNearFar: arrayIndex( arrLightNearFar, iLight ),
    lightParams: arrayIndex( arrLightParams, iLight ),
    lightPV: arrayIndex( arrLightPV, iLight ),
  } );
} );
