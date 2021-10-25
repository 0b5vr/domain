import { GLSLExpression, arrayIndex, defUniformArrayNamed, defUniformNamed, forBreak, forLoop, gte, ifThen } from '../../shader-builder/shaderBuilder';

export const forEachLights: (
  fn: ( params: {
    iLight: GLSLExpression<'int'>,
    lightPos: GLSLExpression<'vec3'>,
    lightColor: GLSLExpression<'vec3'>,
    lightNearFar: GLSLExpression<'vec2'>,
    lightParams: GLSLExpression<'vec4'>,
    lightPV: GLSLExpression<'mat4'>,
  } ) => void,
) => void = ( fn ) => {
  const lightCount = defUniformNamed( 'int', 'lightCount' );
  const arrLightPos = defUniformArrayNamed( 'vec3', 'lightPos', 8 );
  const arrLightColor = defUniformArrayNamed( 'vec3', 'lightColor', 8 );
  const arrLightNearFar = defUniformArrayNamed( 'vec2', 'lightNearFar', 8 );
  const arrLightParams = defUniformArrayNamed( 'vec4', 'lightParams', 8 );
  const arrLightPV = defUniformArrayNamed( 'mat4', 'lightPV', 8 );

  forLoop( 8, ( iLight ) => {
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
};
